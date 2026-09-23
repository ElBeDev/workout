"use client";

import { useSyncExternalStore } from "react";
import { Moon, Smartphone, Sun } from "lucide-react";
import { useT } from "@/i18n/client";

type Tema = "sistema" | "claro" | "oscuro";

const OPCIONES: { id: Tema; Icono: typeof Sun }[] = [
  { id: "sistema", Icono: Smartphone },
  { id: "claro", Icono: Sun },
  { id: "oscuro", Icono: Moon },
];

declare global {
  interface Window {
    __tema?: { leer: () => string; aplicar: () => void; set: (p: string) => void };
  }
}

// La preferencia vive fuera de React (localStorage + <html data-theme>), así
// que se lee como store externo en vez de copiarla a estado en un efecto.
const oyentes = new Set<() => void>();
const suscribir = (fn: () => void) => {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
};
const leer = (): Tema => (window.__tema?.leer() as Tema) ?? "sistema";
const enServidor = (): Tema => "sistema";

/**
 * Selector de apariencia. El tema lo aplica `themeScript` (que corre antes del
 * primer pintado, para que no haya parpadeo); esto sólo guarda la preferencia
 * y le pide que la aplique, sin recargar.
 */
export function ThemeSwitch() {
  const t = useT();
  const tema = useSyncExternalStore(suscribir, leer, enServidor);

  function elegir(elegido: Tema) {
    window.__tema?.set(elegido);
    oyentes.forEach((fn) => fn());
  }

  return (
    <div className="flex gap-1 rounded-full bg-surface-2 p-1">
      {OPCIONES.map(({ id, Icono }) => {
        const activo = tema === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => elegir(id)}
            aria-pressed={activo}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[14px] font-semibold transition ${
              activo ? "bg-surface text-foreground shadow-hero" : "text-muted"
            }`}
          >
            <Icono className="h-4 w-4" />
            {t.perfil.apariencia[id]}
          </button>
        );
      })}
    </div>
  );
}
