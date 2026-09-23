"use client";

import { useState } from "react";
import { Check, Layers, Pencil, Repeat, X } from "lucide-react";
import type { LoadUnit } from "@/lib/suggest";
import { useT } from "@/i18n/client";
import { updateRoutineExercise } from "./actions";

const fieldClass =
  "w-full rounded-xl bg-surface-2 px-1 py-2 text-center text-[14px] text-foreground outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function ExerciseTargetsEditor({
  routineId,
  routineExerciseId,
  targetSets,
  targetReps,
  targetWeight,
  loadUnit,
}: {
  routineId: string;
  routineExerciseId: string;
  targetSets: number;
  targetReps: number;
  targetWeight: string | null;
  loadUnit: LoadUnit;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [unit, setUnit] = useState<LoadUnit>(loadUnit);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-left text-[13px] text-muted"
        aria-label={t.rutinas.objetivos.editar}
      >
        <span className="inline-flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          {t.rutinas.objetivos.series(targetSets)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Repeat className="h-3.5 w-3.5" />
          {t.rutinas.objetivos.reps(targetReps)}
          {targetWeight ? ` · ${t.rutinas.objetivos.peso(targetWeight, loadUnit)}` : ""}
        </span>
        {/* La unidad siempre a la vista: si no se ve, nadie la cambia. */}
        {!targetWeight && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
            {t.rutinas.unidades.corta(loadUnit)}
          </span>
        )}
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
      <input type="hidden" name="loadUnit" value={unit} />
      <div className="flex gap-1 rounded-full bg-surface-2 p-1 text-[12px] font-semibold">
        {(["kg", "lbs", "plates"] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUnit(u)}
            aria-pressed={unit === u}
            className={`flex-1 rounded-full py-1.5 transition ${
              unit === u ? "bg-primary text-primary-foreground" : "text-muted"
            }`}
          >
            {t.rutinas.unidades.larga(u)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <label className="label text-muted">
          {t.rutinas.campos.series}
          <input name="targetSets" type="number" min={1} defaultValue={targetSets} className={fieldClass} />
        </label>
        <label className="label text-muted">
          {t.rutinas.campos.reps}
          <input name="targetReps" type="number" min={1} defaultValue={targetReps} className={fieldClass} />
        </label>
        <label className="label text-muted">
          {t.rutinas.unidades.campo(unit)}
          <input
            name="targetWeight"
            type="number"
            step={unit === "plates" ? 1 : 0.5}
            min={0}
            defaultValue={targetWeight ?? undefined}
            placeholder={t.rutinas.campos.pesoPlaceholder}
            className={fieldClass}
          />
        </label>
      </div>
      <div className="flex gap-1.5">
        <button
          type="submit"
          className="flex h-9 flex-1 items-center justify-center gap-1 rounded-full bg-primary text-[13px] font-semibold text-primary-foreground"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> {t.rutinas.guardar}
        </button>
        <button
          type="button"
          onClick={() => {
            setUnit(loadUnit);
            setEditing(false);
          }}
          aria-label={t.rutinas.cancelar}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-muted"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  );
}
