"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { PendingButton } from "@/components/PendingButton";
import { useT } from "@/i18n/client";
import type { WeightUnit } from "@/lib/suggest";
import { loadLabel } from "@/lib/load-label";
import { updateSet, deleteSet } from "./actions";

const fieldClass =
  "w-full rounded-xl bg-surface-2 px-2 py-2 text-center text-[14px] text-foreground outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none";

export function SetRowEditor({
  sessionId,
  setId,
  setNumber,
  weight,
  weightUnit,
  plates,
  reps,
}: {
  sessionId: string;
  setId: string;
  setNumber: number;
  weight: string | null;
  weightUnit: WeightUnit;
  plates: number | null;
  reps: number | null;
}) {
  const t = useT();
  const isPlates = plates !== null && plates > 0 && !weight;
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const badge = (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[13px] font-bold text-faint tabular-nums">
      {setNumber}
    </span>
  );

  if (!editing) {
    return (
      <li className="flex items-center gap-3 text-[14px]">
        {badge}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex flex-1 items-center gap-3 text-left"
          aria-label={t.progreso.editarSerie(setNumber)}
        >
          <span className="font-semibold tabular-nums">{loadLabel(t, weight, plates, weightUnit) ?? "—"}</span>
          <span className="text-muted">×</span>
          <span className="tabular-nums">{t.progreso.reps(reps)}</span>
          <Pencil className="ml-1 h-3 w-3 text-muted opacity-60" />
        </button>
      </li>
    );
  }

  if (confirmDelete) {
    return (
      <li className="flex items-center gap-2 rounded-2xl bg-danger/10 p-2 text-[13px]">
        <span className="flex-1 pl-1">{t.progreso.confirmarBorrarSerie(setNumber)}</span>
        <button
          type="button"
          onClick={() => setConfirmDelete(false)}
          className="rounded-full border border-border bg-surface px-3 py-1.5 font-medium"
        >
          {t.progreso.no}
        </button>
        <form action={deleteSet.bind(null, sessionId, setId)}>
          <PendingButton
            pendingLabel="…"
            className="rounded-full bg-danger px-3 py-1.5 font-semibold text-white disabled:opacity-70"
          >
            {t.progreso.siBorrar}
          </PendingButton>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2">
      {badge}
      <form
        action={async (fd) => {
          await updateSet(sessionId, setId, fd);
          setEditing(false);
        }}
        className="flex flex-1 items-center gap-2"
      >
        {isPlates ? (
          <input name="plates" type="number" step="1" min={0} inputMode="numeric" defaultValue={plates ?? ""} placeholder={t.progreso.placeholderPlacas} className={fieldClass} />
        ) : (
          <input
            name="weight"
            type="number"
            step="0.5"
            inputMode="decimal"
            defaultValue={weight ?? ""}
            placeholder={weightUnit === "lbs" ? "lb" : "kg"}
            className={fieldClass}
          />
        )}
        <input name="reps" type="number" inputMode="numeric" defaultValue={reps ?? ""} placeholder={t.progreso.placeholderReps} className={fieldClass} />
        <PendingButton
          pendingLabel=""
          aria-label={t.progreso.guardar}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-70"
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </PendingButton>
      </form>
      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        aria-label={t.progreso.borrarSerie}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        aria-label={t.progreso.cancelar}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}
