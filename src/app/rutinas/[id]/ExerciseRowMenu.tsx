"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, EllipsisVertical, Trash2, X } from "lucide-react";

/**
 * Las tres acciones de un ejercicio (subir, bajar, quitar) detrás de un "⋮":
 * la fila queda limpia y sin tres botones compitiendo con el contenido.
 * Recibe las server actions ya enlazadas desde el server component.
 */
export function ExerciseRowMenu({
  name,
  moveUp,
  moveDown,
  remove,
  canMoveUp,
  canMoveDown,
}: {
  name: string;
  moveUp: () => Promise<void>;
  moveDown: () => Promise<void>;
  remove: () => Promise<void>;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Opciones de ${name}`}
        className="flex h-11 w-9 shrink-0 items-center justify-center rounded-full text-faint transition active:scale-90"
      >
        <EllipsisVertical className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Opciones de ${name}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-[1.75rem] bg-background p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-[17px] font-semibold capitalize">{name}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="group-list overflow-hidden rounded-card bg-surface">
              <form action={moveUp}>
                <button
                  type="submit"
                  disabled={!canMoveUp}
                  className="flex w-full items-center gap-3 p-4 text-left text-[17px] disabled:opacity-30"
                >
                  <ArrowUp className="h-5 w-5 text-muted" /> Subir
                </button>
              </form>
              <form action={moveDown}>
                <button
                  type="submit"
                  disabled={!canMoveDown}
                  className="flex w-full items-center gap-3 p-4 text-left text-[17px] disabled:opacity-30"
                >
                  <ArrowDown className="h-5 w-5 text-muted" /> Bajar
                </button>
              </form>
              <form action={remove}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 p-4 text-left text-[17px] font-semibold text-danger"
                >
                  <Trash2 className="h-5 w-5" /> Quitar de la rutina
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
