"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Input, PrimaryButton } from "@/components/ui";
import { useT } from "@/i18n/client";
import { createRoutine } from "./actions";

/**
 * "Nueva rutina" pasa de bloque siempre visible a un "+" en la cabecera que
 * abre una hoja, como el resto de los formularios de la app.
 */
export function NewRoutineSheet() {
  const [open, setOpen] = useState(false);
  const t = useT();

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.rutinas.nueva.titulo}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition active:scale-95"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-routine-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-[1.75rem] bg-background p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
            <div className="mb-4 flex items-center justify-between">
              <h2 id="new-routine-title" className="text-[22px] font-bold tracking-[-0.02em]">
                {t.rutinas.nueva.titulo}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.rutinas.cerrar}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form action={createRoutine} className="flex flex-col gap-3">
              <Input
                name="name"
                placeholder={t.rutinas.nueva.nombrePlaceholder}
                required
                autoFocus
              />
              <PrimaryButton type="submit" tone="accent">
                <Plus className="h-4 w-4" />
                {t.rutinas.nueva.crear}
              </PrimaryButton>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
