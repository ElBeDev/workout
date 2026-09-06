"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ExercisePicker } from "@/components/ExercisePicker";
import { PrimaryButton, SectionTitle } from "@/components/ui";
import { addExerciseToRoutine } from "./actions";

type SelectedExercise = {
  id: string;
  name: string;
  nameEs?: string | null;
  gifUrl: string | null;
};

const fieldClass =
  "mt-1 w-full rounded-2xl border border-border bg-surface-2 px-3 py-3 text-[15px] text-foreground outline-none focus:ring-2 focus:ring-accent";

export function AddExerciseForm({
  routineId,
  photoEnabled = false,
}: {
  routineId: string;
  photoEnabled?: boolean;
}) {
  const [selected, setSelected] = useState<SelectedExercise | null>(null);
  const [unit, setUnit] = useState<"kg" | "plates">("kg");

  if (!selected) {
    return (
      <div className="flex flex-col gap-3">
        <SectionTitle>Agregar ejercicio</SectionTitle>
        <ExercisePicker onSelect={(ex) => setSelected(ex)} photoEnabled={photoEnabled} />
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await addExerciseToRoutine(formData);
        setSelected(null);
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="routineId" value={routineId} />
      <input type="hidden" name="exerciseId" value={selected.id} />

      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
          {selected.gifUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.gifUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold capitalize">
            {selected.nameEs ?? selected.name}
          </p>
          {selected.nameEs && (
            <p className="truncate text-[12px] capitalize text-muted">{selected.name}</p>
          )}
        </div>
      </div>

      <div className="flex gap-1 rounded-full bg-surface-2 p-1 text-[12px] font-semibold">
        {(["kg", "plates"] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUnit(u)}
            aria-pressed={unit === u}
            className={`flex-1 rounded-full py-1.5 transition ${
              unit === u ? "bg-primary text-primary-foreground" : "text-muted"
            }`}
          >
            {u === "kg" ? "Kilos" : "Placas (máquina sin kg)"}
          </button>
        ))}
      </div>
      <input type="hidden" name="loadUnit" value={unit} />

      <div className="grid grid-cols-3 gap-2">
        <label className="text-[12px] font-medium text-muted">
          Series
          <input name="targetSets" type="number" min={1} defaultValue={2} className={fieldClass} />
        </label>
        <label className="text-[12px] font-medium text-muted">
          Reps
          <input name="targetReps" type="number" min={1} defaultValue={10} className={fieldClass} />
        </label>
        <label className="text-[12px] font-medium text-muted">
          {unit === "plates" ? "Placas" : "Peso (kg)"}
          <input name="targetWeight" type="number" step={unit === "plates" ? 1 : 0.5} min={0} placeholder="—" className={fieldClass} />
        </label>
      </div>

      <PrimaryButton type="submit">
        <Plus className="h-4 w-4" />
        Agregar a la rutina
      </PrimaryButton>
      <button
        type="button"
        onClick={() => setSelected(null)}
        className="text-center text-sm font-medium text-muted"
      >
        Elegir otro ejercicio
      </button>
    </form>
  );
}
