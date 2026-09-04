"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { SecondaryButton } from "@/components/ui";
import { PendingButton } from "@/components/PendingButton";
import { discardSession } from "@/app/entrenar/actions";

export function DiscardSessionButton({
  sessionId,
  compact = false,
}: {
  sessionId: string;
  compact?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={
          compact
            ? "text-[13px] font-medium text-muted underline-offset-2 hover:underline"
            : "flex items-center justify-center gap-2 py-2 text-[14px] font-medium text-muted"
        }
      >
        {!compact && <Trash2 className="h-4 w-4" />}
        Descartar entrenamiento
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-danger/10 p-4">
      <p className="text-[14px]">¿Descartar este entrenamiento? Se borran las series de hoy.</p>
      <div className="flex gap-2">
        <SecondaryButton type="button" className="flex-1" onClick={() => setConfirming(false)}>
          Cancelar
        </SecondaryButton>
        <form action={discardSession.bind(null, sessionId)} className="flex-1">
          <PendingButton
            pendingLabel="Descartando…"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-danger px-5 py-3.5 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-70"
          >
            Sí, descartar
          </PendingButton>
        </form>
      </div>
    </div>
  );
}
