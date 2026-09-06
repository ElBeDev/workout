"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { PendingButton } from "@/components/PendingButton";
import { loadLabel } from "@/lib/suggest";
import { updateSet, deleteSet } from "./actions";

const fieldClass =
  "w-full rounded-xl border border-border bg-surface-2 px-2 py-2 text-center text-[14px] text-foreground outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none";

export function SetRowEditor({
  sessionId,
  setId,
  setNumber,
  weight,
  plates,
  reps,
}: {
  sessionId: string;
  setId: string;
  setNumber: number;
  weight: string | null;
  plates: number | null;
  reps: number | null;
}) {
  const isPlates = plates !== null && plates > 0 && !weight;
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const badge = (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/40 text-[12px] font-semibold text-accent-strong">
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
          aria-label={`Editar serie ${setNumber}`}
        >
          <span className="font-semibold tabular-nums">{loadLabel(weight, plates) ?? "—"}</span>
          <span className="text-muted">×</span>
          <span className="tabular-nums">{reps ?? "—"} reps</span>
          <Pencil className="ml-1 h-3 w-3 text-muted opacity-60" />
        </button>
      </li>
    );
  }

  if (confirmDelete) {
    return (
      <li className="flex items-center gap-2 rounded-2xl bg-danger/10 p-2 text-[13px]">
        <span className="flex-1 pl-1">¿Borrar la serie {setNumber}?</span>
        <button
          type="button"
          onClick={() => setConfirmDelete(false)}
          className="rounded-full border border-border bg-surface px-3 py-1.5 font-medium"
        >
          No
        </button>
        <form action={deleteSet.bind(null, sessionId, setId)}>
          <PendingButton
            pendingLabel="…"
            className="rounded-full bg-danger px-3 py-1.5 font-semibold text-white disabled:opacity-70"
          >
            Sí, borrar
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
          <input name="plates" type="number" step="1" min={0} inputMode="numeric" defaultValue={plates ?? ""} placeholder="placas" className={fieldClass} />
        ) : (
          <input name="weight" type="number" step="0.5" inputMode="decimal" defaultValue={weight ?? ""} placeholder="kg" className={fieldClass} />
        )}
        <input name="reps" type="number" inputMode="numeric" defaultValue={reps ?? ""} placeholder="reps" className={fieldClass} />
        <PendingButton
          pendingLabel=""
          aria-label="Guardar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-70"
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </PendingButton>
      </form>
      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        aria-label="Borrar serie"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        aria-label="Cancelar"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-muted"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}
