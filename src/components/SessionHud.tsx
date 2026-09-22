"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { Ring } from "@/components/Rings";
import { fmtClock } from "@/lib/format";

const REST_SECONDS = 180;

/**
 * HUD del entrenamiento: un solo número dominante y un anillo que dice de un
 * vistazo cómo vas. Verde = series de la sesión; cian y en cuenta regresiva
 * mientras descansas (docs/diseno-apple-fitness.md §6.4).
 */
export function SessionHud({
  startedAtMs,
  completed,
  total,
}: {
  startedAtMs: number;
  completed: number;
  total: number;
}) {
  // Start from the session's own timestamp so server and client render the
  // same text (no hydration mismatch); the clock catches up on mount.
  const [now, setNow] = useState(startedAtMs);
  const [rest, setRest] = useState<number | null>(null);

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
    function handleStart() {
      setRest(REST_SECONDS);
    }
    window.addEventListener("workout:rest-start", handleStart);
    return () => window.removeEventListener("workout:rest-start", handleStart);
  }, []);

  useEffect(() => {
    if (rest === null || rest <= 0) return;
    const id = setTimeout(() => {
      setRest((r) => {
        if (r === null) return null;
        if (r <= 1) {
          try {
            navigator.vibrate?.(200);
          } catch {}
          return null;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [rest]);

  const elapsed = Math.max(0, Math.floor((now - startedAtMs) / 1000));
  const resting = rest !== null;
  const setsPct = total > 0 ? completed / total : 0;

  return (
    <div className="glass sticky top-2 z-30 rounded-card p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-4">
        <Ring
          tone={resting ? "days" : "sets"}
          pct={resting ? (rest ?? 0) / REST_SECONDS : setsPct}
          size={64}
          thickness={13}
        >
          {!resting && (
            <span className="text-[13px] font-bold tabular-nums">
              {Math.round(setsPct * 100)}
            </span>
          )}
        </Ring>

        <div className="min-w-0 flex-1">
          <p className={`label ${resting ? "text-days" : "text-sets"}`}>
            {resting ? "Descanso" : "Entrenando"}
          </p>
          <p className="text-[44px] font-bold leading-none tracking-[-0.03em] tabular-nums">
            {fmtClock(resting ? (rest ?? 0) : elapsed)}
          </p>
        </div>
      </div>

      {resting && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setRest((r) => Math.max(1, (r ?? 0) - 15))}
            className="flex h-10 items-center gap-1 rounded-full bg-surface-2 px-4 text-[14px] font-semibold text-foreground active:scale-95"
          >
            <Minus className="h-3.5 w-3.5" /> 15s
          </button>
          <button
            type="button"
            onClick={() => setRest(null)}
            className="flex h-10 items-center gap-1 rounded-full bg-primary px-5 text-[14px] font-semibold text-primary-foreground active:scale-95"
          >
            <X className="h-3.5 w-3.5" /> Saltar
          </button>
          <button
            type="button"
            onClick={() => setRest((r) => (r ?? 0) + 15)}
            className="flex h-10 items-center gap-1 rounded-full bg-surface-2 px-4 text-[14px] font-semibold text-foreground active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> 15s
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 border-t border-border pt-3">
        <div>
          <p className="label text-muted">Transcurrido</p>
          <p className="text-[17px] font-semibold tabular-nums">{fmtClock(elapsed)}</p>
        </div>
        <div className="text-right">
          <p className="label text-muted">Series</p>
          <p className="text-[17px] font-semibold tabular-nums">
            {completed}
            <span className="text-muted">/{total}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
