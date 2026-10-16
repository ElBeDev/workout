"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { SecondaryButton } from "@/components/ui";
import { PendingButton } from "@/components/PendingButton";

/**
 * Botón que pide confirmar antes de algo que no se deshace solo (dejar a tu
 * coach, quitar a un alumno). Mismo patrón que "Eliminar rutina": se abre en
 * su lugar con la explicación y el botón rojo.
 */
export function ConfirmAction({
  label,
  confirmText,
  yesLabel,
  action,
}: {
  label: string;
  confirmText: string;
  yesLabel: string;
  action: () => Promise<void>;
}) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center justify-center rounded-full border border-border bg-surface px-5 py-3 text-[15px] font-medium text-danger"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-danger/10 p-4">
      <p className="text-[14px]">{confirmText}</p>
      <div className="flex gap-2">
        <SecondaryButton type="button" className="flex-1" onClick={() => setConfirming(false)}>
          {t.rutinas.cancelar}
        </SecondaryButton>
        <form action={action} className="flex-1">
          <PendingButton className="flex w-full items-center justify-center gap-2 rounded-full bg-danger px-5 py-3.5 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-70">
            {yesLabel}
          </PendingButton>
        </form>
      </div>
    </div>
  );
}
