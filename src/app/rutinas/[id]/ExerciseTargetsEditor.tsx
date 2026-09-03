"use client";

import { useState } from "react";
import { Check, Layers, Pencil, Repeat, X } from "lucide-react";
import { updateRoutineExercise } from "./actions";

const fieldClass =
  "w-full rounded-xl border border-border bg-surface-2 px-1.5 py-2 text-center text-[14px] text-foreground outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function ExerciseTargetsEditor({
  routineId,
  routineExerciseId,
  targetSets,
  targetReps,
  targetWeight,
}: {
  routineId: string;
  routineExerciseId: string;
  targetSets: number;
  targetReps: number;
  targetWeight: string | null;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-left text-[13px] text-muted"
        aria-label="Editar series y reps"
      >
        <span className="inline-flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          {targetSets} {targetSets === 1 ? "serie" : "series"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Repeat className="h-3.5 w-3.5" />
          {targetReps} reps
          {targetWeight ? ` · ${targetWeight} kg` : ""}
        </span>
        <Pencil className="h-3 w-3 opacity-60" />
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await updateRoutineExercise(routineId, routineExerciseId, formData);
        setEditing(false);
      }}
      className="mt-2 flex flex-col gap-2"
    >
      <div className="grid grid-cols-3 gap-1.5">
        <label className="text-[10px] font-medium text-muted">
          Series
          <input name="targetSets" type="number" min={1} defaultValue={targetSets} className={fieldClass} />
        </label>
        <label className="text-[10px] font-medium text-muted">
          Reps
          <input name="targetReps" type="number" min={1} defaultValue={targetReps} className={fieldClass} />
        </label>
        <label className="text-[10px] font-medium text-muted">
          Kg
          <input
            name="targetWeight"
            type="number"
            step="0.5"
            defaultValue={targetWeight ?? undefined}
            placeholder="—"
            className={fieldClass}
          />
        </label>
      </div>
      <div className="flex gap-1.5">
        <button
          type="submit"
          className="flex h-9 flex-1 items-center justify-center gap-1 rounded-full bg-primary text-[13px] font-semibold text-primary-foreground"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Guardar
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-label="Cancelar"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-2 text-muted"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  );
}
