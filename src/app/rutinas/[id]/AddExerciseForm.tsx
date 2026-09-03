"use client";

import { useState } from "react";
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
      <div className="flex flex-col gap-2">
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
      className="flex flex-col gap-2 rounded-xl border border-black/10 p-3 dark:border-white/10"
    >
      <input type="hidden" name="routineId" value={routineId} />
      <input type="hidden" name="exerciseId" value={selected.id} />

      <p className="text-sm font-medium capitalize">{selected.name}</p>

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

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Agregar a la rutina
        </button>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="rounded-full border border-black/10 px-4 py-2 text-sm dark:border-white/10"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
