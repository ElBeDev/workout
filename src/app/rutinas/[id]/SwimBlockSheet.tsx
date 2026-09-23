"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Plus, X } from "lucide-react";
import { PrimaryButton } from "@/components/ui";
import { useT } from "@/i18n/client";
import { addSwimBlock, updateSwimBlock } from "./swim-actions";

const LABELS = ["calentamiento", "principal", "patada", "drill", "enfriamiento", "libre"] as const;
const STROKES = ["libre", "dorso", "pecho", "mariposa", "combinado", "patada", "drill"] as const;

const fieldClass =
  "mt-1 w-full rounded-xl bg-surface-2 px-3 py-3 text-[17px] text-foreground outline-none focus:ring-2 focus:ring-accent";

type BlockDefaults = {
  id: string;
  label: string;
  stroke: string;
  reps: number;
  distanceMeters: number;
  restSeconds: number | null;
  notes: string | null;
};

/**
 * Hoja para agregar o editar un bloque de una rutina de natación — mismo
 * cuerpo de formulario para las dos, sólo cambia a qué action llama. El
 * disparador (botón "Agregar bloque", o la fila misma para editar) se recibe
 * como `children` — no como render prop — porque este componente lo llama un
 * server component y una función no puede cruzar esa frontera.
 */
export function SwimBlockSheet({
  routineId,
  children,
  block,
  className,
}: {
  routineId: string;
  children: ReactNode;
  block?: BlockDefaults;
  className?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(block);

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

  async function submit(formData: FormData) {
    if (isEdit && block) {
      await updateSwimBlock(routineId, block.id, formData);
    } else {
      formData.set("routineId", routineId);
      await addSwimBlock(formData);
    }
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
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
            aria-labelledby="swim-block-title"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-md flex-col overflow-y-auto rounded-t-[1.75rem] bg-background p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-foreground"
          >
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
            <div className="mb-4 flex items-center justify-between">
              <h2 id="swim-block-title" className="text-[22px] font-bold tracking-[-0.02em]">
                {isEdit ? t.natacion.agregarBloque.editarTitulo : t.natacion.agregarBloque.titulo}
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

            <form action={submit} className="flex flex-col gap-3">
              <label className="label text-muted">
                {t.natacion.agregarBloque.campos.etiqueta}
                <select name="label" defaultValue={block?.label ?? "principal"} className={fieldClass}>
                  {LABELS.map((l) => (
                    <option key={l} value={l}>
                      {t.natacion.bloque.etiquetas[l]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="label text-muted">
                {t.natacion.agregarBloque.campos.estilo}
                <select name="stroke" defaultValue={block?.stroke ?? "libre"} className={fieldClass}>
                  {STROKES.map((s) => (
                    <option key={s} value={s}>
                      {t.natacion.bloque.estilos[s]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="label text-muted">
                  {t.natacion.agregarBloque.campos.repeticiones}
                  <input
                    name="reps"
                    type="number"
                    min={1}
                    defaultValue={block?.reps ?? 4}
                    className={fieldClass}
                  />
                </label>
                <label className="label text-muted">
                  {t.natacion.agregarBloque.campos.distancia}
                  <input
                    name="distanceMeters"
                    type="number"
                    min={25}
                    step={25}
                    defaultValue={block?.distanceMeters ?? 100}
                    className={fieldClass}
                  />
                </label>
              </div>

              <label className="label text-muted">
                {t.natacion.agregarBloque.campos.descanso}
                <input
                  name="restSeconds"
                  type="number"
                  min={0}
                  defaultValue={block?.restSeconds ?? undefined}
                  className={fieldClass}
                />
              </label>

              <label className="label text-muted">
                {t.natacion.agregarBloque.campos.notas}
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={block?.notes ?? ""}
                  placeholder={t.natacion.agregarBloque.campos.notasPlaceholder}
                  className={fieldClass}
                />
              </label>

              <PrimaryButton type="submit">
                {isEdit ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {isEdit ? t.natacion.agregarBloque.guardar : t.natacion.agregarBloque.confirmar}
              </PrimaryButton>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
