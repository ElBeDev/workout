"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X, Info } from "lucide-react";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { bodyPartLabel } from "@/lib/body-parts";

export type ExerciseInfo = {
  name: string;
  nameEs?: string | null;
  gifUrl: string | null;
  bodyPart: string | null;
  equipment: string | null;
  instructions: string | null;
};

function splitSteps(instructions: string | null): string[] {
  if (!instructions) return [];
  return instructions
    .split(/Step:\s*\d+\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Wraps any trigger (thumbnail, name, an "i" button) and opens a bottom
 * sheet with the big gif and the step-by-step instructions.
 */
export function ExerciseInfoSheet({
  exercise,
  children,
  className = "",
}: {
  exercise: ExerciseInfo;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

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

  const steps = splitSteps(exercise.instructions);
  const title = exercise.nameEs ?? exercise.name;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-left ${className}`}
        aria-label={`Ver cómo se hace: ${title}`}
      >
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-background pb-[max(1.5rem,env(safe-area-inset-bottom))] text-foreground"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-white">
              <ExerciseThumb src={exercise.gifUrl} alt={title} className="h-full w-full" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-foreground shadow-[0_2px_12px_rgba(21,21,31,0.12)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 px-5 pt-5">
              <div>
                <h2 className="text-[22px] font-bold capitalize leading-tight tracking-tight">
                  {title}
                </h2>
                {exercise.nameEs && (
                  <p className="text-[13px] capitalize text-muted">{exercise.name}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {exercise.bodyPart && (
                    <span className="rounded-full bg-accent px-3 py-1 text-[12px] font-medium text-accent-foreground">
                      {bodyPartLabel(exercise.bodyPart)}
                    </span>
                  )}
                  {exercise.equipment && (
                    <span className="rounded-full bg-surface-2 px-3 py-1 text-[12px] font-medium capitalize text-muted">
                      {exercise.equipment}
                    </span>
                  )}
                </div>
              </div>

              {steps.length > 0 ? (
                <ol className="flex flex-col gap-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
                        {i + 1}
                      </span>
                      <p className="text-[15px] leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Info className="h-4 w-4" /> Sin instrucciones para este ejercicio.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
