"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { ExercisePicker } from "@/components/ExercisePicker";
import { addExerciseToRoutine } from "./actions";

type SelectedExercise = {
  id: string;
  name: string;
};

export function AddExerciseForm({ routineId }: { routineId: string }) {
  const [selected, setSelected] = useState<SelectedExercise | null>(null);

  if (!selected) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Agregar ejercicio</h2>
        <ExercisePicker onSelect={(ex) => setSelected(ex)} />
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await addExerciseToRoutine(formData);
        setSelected(null);
      }}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="routineId" value={routineId} />
      <input type="hidden" name="exerciseId" value={selected.id} />

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold capitalize">{selected.name}</p>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-black/40 dark:text-white/40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <label className="flex-1 text-xs text-black/50 dark:text-white/50">
          Series
          <input
            name="targetSets"
            type="number"
            min={1}
            defaultValue={3}
            className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-transparent"
          />
        </label>
        <label className="flex-1 text-xs text-black/50 dark:text-white/50">
          Reps
          <input
            name="targetReps"
            type="number"
            min={1}
            defaultValue={10}
            className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-transparent"
          />
        </label>
        <label className="flex-1 text-xs text-black/50 dark:text-white/50">
          Peso (opcional)
          <input
            name="targetWeight"
            type="number"
            step="0.5"
            className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-transparent"
          />
        </label>
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" />
        Agregar a la rutina
      </button>
    </form>
  );
}
