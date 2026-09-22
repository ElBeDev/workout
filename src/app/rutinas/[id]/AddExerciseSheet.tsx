"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { ExercisePicker } from "@/components/ExercisePicker";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { addExerciseToRoutine } from "./actions";

type SelectedExercise = {
  id: string;
  name: string;
  nameEs?: string | null;
  gifUrl: string | null;
};

const fieldClass =
  "mt-1 w-full rounded-xl bg-surface-2 px-3 py-3 text-[17px] text-foreground outline-none focus:ring-2 focus:ring-accent";

/**
 * Collapsed by default (just a button) so the routine screen doesn't carry
 * the whole search grid permanently; opens the picker as a bottom sheet,
 * same chrome as ExerciseInfoSheet.
 */
export function AddExerciseSheet({
  routineId,
  photoEnabled = false,
}: {
  routineId: string;
  photoEnabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedExercise | null>(null);
  const [unit, setUnit] = useState<"kg" | "lbs" | "plates">("kg");

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setSelected(null);
    setUnit("kg");
  }

  return (
    <>
      <SecondaryButton type="button" onClick={() => setOpen(true)} className="w-full">
        <Plus className="h-4 w-4" />
        Agregar ejercicio
      </SecondaryButton>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-exercise-sheet-title"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-md flex-col overflow-y-auto rounded-t-[1.75rem] bg-background p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-foreground"
          >
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
            <div className="mb-4 flex items-center justify-between">
              <h2 id="add-exercise-sheet-title" className="truncate text-[22px] font-bold tracking-[-0.02em]">
                {selected ? (selected.nameEs ?? selected.name) : "Agregar ejercicio"}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!selected ? (
              <ExercisePicker onSelect={(ex) => setSelected(ex)} photoEnabled={photoEnabled} />
            ) : (
              <form
                action={async (formData) => {
                  await addExerciseToRoutine(formData);
                  close();
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
                  {selected.nameEs && (
                    <p className="truncate text-[12px] capitalize text-muted">{selected.name}</p>
                  )}
                </div>

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
                      {u === "kg" ? "Kilos" : u === "lbs" ? "Libras" : "Placas"}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="loadUnit" value={unit} />

                <div className="grid grid-cols-3 gap-2">
                  <label className="label text-muted">
                    Series
                    <input name="targetSets" type="number" min={1} defaultValue={2} className={fieldClass} />
                  </label>
                  <label className="label text-muted">
                    Reps
                    <input name="targetReps" type="number" min={1} defaultValue={10} className={fieldClass} />
                  </label>
                  <label className="label text-muted">
                    {unit === "plates" ? "Placas" : unit === "lbs" ? "Peso (lb)" : "Peso (kg)"}
                    <input
                      name="targetWeight"
                      type="number"
                      step={unit === "plates" ? 1 : 0.5}
                      min={0}
                      placeholder="—"
                      className={fieldClass}
                    />
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
            )}
          </div>
        </div>
      )}
    </>
  );
}
