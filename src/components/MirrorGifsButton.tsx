"use client";

import { useState } from "react";
import { CloudDownload, Loader2, Check } from "lucide-react";
import { mirrorMyGifs } from "@/app/perfil/actions";

export function MirrorGifsButton({ pending }: { pending: number }) {
  const [left, setLeft] = useState(pending);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      let remaining = left;
      let guard = 0;
      while (remaining > 0 && guard < 60) {
        const res = await mirrorMyGifs();
        if (!res.enabled) {
          setError("Vercel Blob no está configurado en este entorno.");
          break;
        }
        setDone((d) => d + res.mirrored);
        remaining = res.remaining;
        setLeft(remaining);
        if (res.mirrored === 0 && remaining > 0) {
          setError("Algunos gifs no se pudieron descargar; inténtalo más tarde.");
          break;
        }
        guard += 1;
      }
    } catch {
      setError("Se perdió la conexión; vuelve a intentar.");
    } finally {
      setRunning(false);
    }
  }

  if (left === 0 && done === 0) {
    return (
      <p className="flex items-center gap-2 text-[13px] text-muted">
        <Check className="h-4 w-4 text-accent-strong" /> Todos tus ejercicios ya tienen copia propia.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={run}
        disabled={running || left === 0}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-[15px] font-semibold text-primary-foreground disabled:opacity-60"
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : left === 0 ? <Check className="h-4 w-4" /> : <CloudDownload className="h-4 w-4" />}
        {running
          ? `Copiando… faltan ${left}`
          : left === 0
            ? `Listo: ${done} copiados`
            : `Copiar ${left} ${left === 1 ? "gif" : "gifs"} a tu almacenamiento`}
      </button>
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}
