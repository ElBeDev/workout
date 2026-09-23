"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { probarSonido, setSonidoActivado, sonidoActivado } from "@/lib/rest-sound";

const oyentes = new Set<() => void>();

/** Apagar el aviso sonoro del fin del descanso. Se guarda por dispositivo. */
export function SoundToggle() {
  const activo = useSyncExternalStore(
    useCallback((cb: () => void) => {
      oyentes.add(cb);
      return () => oyentes.delete(cb);
    }, []),
    sonidoActivado,
    () => true
  );

  function alternar() {
    setSonidoActivado(!activo);
    oyentes.forEach((fn) => fn());
    if (!activo) probarSonido();
  }

  return (
    <div className="flex items-center gap-3 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
        {activo ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold">Sonido al terminar el descanso</span>
        <span className="block text-[13px] text-muted">
          Tres pitidos cortos. No suena con el teléfono bloqueado.
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label="Sonido al terminar el descanso"
        onClick={alternar}
        className={`relative h-8 w-[52px] shrink-0 rounded-full transition ${
          activo ? "bg-sets" : "bg-surface-3"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
            activo ? "left-[24px]" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
