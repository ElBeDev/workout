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
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[1.75rem] bg-background pb-[max(1.5rem,env(safe-area-inset-bottom))] text-foreground"
          >
            <div className="px-5 pt-3">
              <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[26px] font-bold capitalize leading-tight tracking-[-0.02em]">
                    {title}
                  </h2>
                  {exercise.nameEs && (
                    <p className="truncate text-[14px] capitalize text-muted">{exercise.name}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* El gif es de 180 px: a ancho completo se ve lavado. Se muestra en
                un escenario acotado y centrado, que además se lee mejor. */}
            <div className="px-5 pt-4">
              <ExerciseThumb
                src={exercise.gifUrl}
                alt={title}
                eager
                className="mx-auto aspect-square w-full max-w-[300px] rounded-[1.5rem] shadow-hero"
              />
            </div>

            <div className="flex flex-col gap-4 px-5 pt-5">
              <div>
                <div className="flex flex-wrap gap-2">
                  {exercise.bodyPart && (
                    <span className="rounded-full bg-surface-2 px-3 py-1.5 text-[13px] font-semibold text-foreground">
                      {bodyPartLabel(exercise.bodyPart)}
                    </span>
                  )}
                  {exercise.equipment && (
                    <span className="rounded-full bg-surface-2 px-3 py-1.5 text-[13px] font-semibold capitalize text-muted">
                      {exercise.equipment}
                    </span>
                  )}
                </div>
              </div>

              {steps.length > 0 ? (
                <ol className="flex flex-col gap-3.5">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/12 text-[13px] font-bold text-accent">
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
