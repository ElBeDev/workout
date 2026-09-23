"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { PendingButton } from "@/components/PendingButton";
import { discardSession } from "@/app/entrenar/actions";

/**
 * Descartar es destructivo, así que confirma en una hoja de acción (como las
 * de iOS) en vez de expandir un bloque dentro de la fila: inline se desbordaba
 * de la tarjeta de "En curso" y se encimaba con el botón de Continuar.
 */
export function DiscardSessionButton({
  sessionId,
  compact = false,
}: {
  sessionId: string;
  compact?: boolean;
}) {
  const t = useT().hoy;
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setConfirming(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [confirming]);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={
          compact
            ? "shrink-0 px-2 text-[15px] font-semibold text-muted transition active:scale-95"
            : "flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-danger transition active:scale-[0.98]"
        }
      >
        {!compact && <Trash2 className="h-4 w-4" />}
        {compact ? t.descartar : t.descartarEntrenamiento}
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-70 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setConfirming(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-[1.75rem] bg-background p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
            <h2 id="discard-title" className="text-[22px] font-bold tracking-[-0.02em]">
              {t.descartarTitulo}
            </h2>
            <p className="mt-2 text-[15px] text-muted">{t.descartarAviso}</p>

            <form action={discardSession.bind(null, sessionId)} className="mt-5">
              <PendingButton
                pendingLabel={t.descartando}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-danger text-[17px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {t.descartarConfirmar}
              </PendingButton>
            </form>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="mt-2 flex h-13 w-full items-center justify-center rounded-full bg-surface-2 text-[17px] font-semibold text-foreground transition active:scale-[0.98]"
            >
              {t.cancelar}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
