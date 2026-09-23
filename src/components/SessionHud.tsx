"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Minus, Plus, X } from "lucide-react";
import { Ring } from "@/components/Rings";
import { fmtClock } from "@/lib/format";
import { desbloquearSonido, sonarFinDescanso } from "@/lib/rest-sound";
import { useT } from "@/i18n/client";

const REST_SECONDS = 180;

/** Se guarda el INSTANTE en que termina, no los segundos que faltan: así el
 *  descanso sobrevive a salir de la pantalla, a recargar y a que el navegador
 *  congele los temporizadores en segundo plano, sin desfasarse. */
const claveDescanso = (sessionId: string) => `workout:descanso:${sessionId}`;

function leerFin(sessionId: string): number | null {
  try {
    const v = localStorage.getItem(claveDescanso(sessionId));
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function guardarFin(sessionId: string, fin: number | null) {
  try {
    if (fin === null) localStorage.removeItem(claveDescanso(sessionId));
    else localStorage.setItem(claveDescanso(sessionId), String(fin));
  } catch {}
  avisar();
}

// El descanso vive fuera de React (en localStorage, para sobrevivir a salir de
// la pantalla), así que se lee como store externo en vez de copiarlo a estado.
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((fn) => fn());

/**
 * HUD del entrenamiento: un solo número dominante y un anillo que dice de un
 * vistazo cómo vas. Verde = series de la sesión; cian y en cuenta regresiva
 * mientras descansas (docs/diseno-apple-fitness.md §6.4).
 */
export function SessionHud({
  sessionId,
  startedAtMs,
  completed,
  total,
  progressLabel,
}: {
  sessionId: string;
  startedAtMs: number;
  completed: number;
  total: number;
  /** Qué cuenta el segundo número del pie (por defecto "Series"; natación pasa "Bloques"). */
  progressLabel?: string;
}) {
  // Start from the session's own timestamp so server and client render the
  // same text (no hydration mismatch); the clock catches up on mount.
  const [now, setNow] = useState(startedAtMs);
  const t = useT();

  const finDescanso = useSyncExternalStore(
    useCallback((cb: () => void) => {
      oyentes.add(cb);
      return () => oyentes.delete(cb);
    }, []),
    useCallback(() => leerFin(sessionId), [sessionId]),
    () => null
  );

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 1000);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(id);
      clearTimeout(first);
    };
  }, []);

  useEffect(() => {
    const alMarcarSerie = () => guardarFin(sessionId, Date.now() + REST_SECONDS * 1000);
    window.addEventListener("workout:rest-start", alMarcarSerie);
    return () => window.removeEventListener("workout:rest-start", alMarcarSerie);
  }, [sessionId]);

  // El permiso de audio se pierde al recargar (o si el sistema descarta la
  // pestaña), y entonces el descanso terminaría en silencio. Cualquier toque en
  // la pantalla vuelve a desbloquearlo: basta con que mires el teléfono.
  useEffect(() => {
    const alTocar = () => desbloquearSonido();
    window.addEventListener("pointerdown", alTocar, { passive: true });
    return () => window.removeEventListener("pointerdown", alTocar);
  }, []);

  const restante = finDescanso === null ? null : Math.ceil((finDescanso - now) / 1000);

  // Llegó a cero: avisa (sonido + vibración) y se apaga. Si venció mientras no
  // estabas mirando, se limpia sin ruido — el pitido es para el momento, no
  // para cuando regresas diez minutos después.
  useEffect(() => {
    if (finDescanso === null || restante === null || restante > 0) return;
    const aTiempo = Date.now() - finDescanso < 3000;
    guardarFin(sessionId, null);
    if (!aTiempo) return;
    sonarFinDescanso();
    try {
      navigator.vibrate?.([120, 90, 120, 90, 120]);
    } catch {}
  }, [restante, finDescanso, sessionId]);

  function ajustar(segundos: number) {
    if (finDescanso === null) return;
    guardarFin(sessionId, Math.max(Date.now() + 1000, finDescanso + segundos * 1000));
  }

  const saltar = () => guardarFin(sessionId, null);

  const elapsed = Math.max(0, Math.floor((now - startedAtMs) / 1000));
  const descansando = restante !== null && restante > 0;
  const setsPct = total > 0 ? completed / total : 0;

  return (
    <div className="glass sticky top-2 z-30 rounded-card p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-4">
        <Ring
          tone={descansando ? "days" : "sets"}
          pct={descansando ? (restante ?? 0) / REST_SECONDS : setsPct}
          size={64}
          thickness={13}
        >
          {!descansando && (
            <span className="text-[13px] font-bold tabular-nums">
              {Math.round(setsPct * 100)}
            </span>
          )}
        </Ring>

        <div className="min-w-0 flex-1">
          <p className={`label ${descansando ? "text-days" : "text-sets"}`}>
            {descansando ? t.entrenar.hud.descanso : t.entrenar.hud.entrenando}
          </p>
          <p className="text-[44px] font-bold leading-none tracking-[-0.03em] tabular-nums">
            {fmtClock(descansando ? (restante ?? 0) : elapsed)}
          </p>
        </div>
      </div>

      {descansando && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => ajustar(-15)}
            className="flex h-10 items-center gap-1 rounded-full bg-surface-2 px-4 text-[14px] font-semibold text-foreground active:scale-95"
          >
            <Minus className="h-3.5 w-3.5" /> {t.entrenar.hud.ajuste15}
          </button>
          <button
            type="button"
            onClick={saltar}
            className="flex h-10 items-center gap-1 rounded-full bg-primary px-5 text-[14px] font-semibold text-primary-foreground active:scale-95"
          >
            <X className="h-3.5 w-3.5" /> {t.entrenar.hud.saltar}
          </button>
          <button
            type="button"
            onClick={() => ajustar(15)}
            className="flex h-10 items-center gap-1 rounded-full bg-surface-2 px-4 text-[14px] font-semibold text-foreground active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> {t.entrenar.hud.ajuste15}
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 border-t border-border pt-3">
        <div>
          <p className="label text-muted">{t.entrenar.hud.transcurrido}</p>
          <p className="text-[17px] font-semibold tabular-nums">{fmtClock(elapsed)}</p>
        </div>
        <div className="text-right">
          <p className="label text-muted">{progressLabel ?? t.entrenar.hud.series}</p>
          <p className="text-[17px] font-semibold tabular-nums">
            {completed}
            <span className="text-muted">/{total}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
