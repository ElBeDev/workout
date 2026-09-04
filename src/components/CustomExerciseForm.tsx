"use client";

import { useState, useTransition } from "react";
import { Camera, Plus, X } from "lucide-react";
import { BODY_PARTS } from "@/lib/body-parts";
import { createCustomExercise, type CreatedExercise } from "@/app/ejercicios/actions";

const fieldClass =
  "w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-[15px] text-foreground outline-none focus:ring-2 focus:ring-accent";

export function CustomExerciseForm({
  onCreated,
  photoEnabled,
}: {
  onCreated: (exercise: CreatedExercise) => void;
  photoEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-full border border-dashed border-border bg-surface px-5 py-3.5 text-[14px] font-medium text-muted"
      >
        <Plus className="h-4 w-4" />
        ¿No está? Crea tu propio ejercicio
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          const res = await createCustomExercise(fd);
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setError(null);
          setOpen(false);
          onCreated(res.exercise);
        })
      }
      className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-surface-2 p-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold">Nuevo ejercicio propio</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <p className="rounded-2xl bg-danger/10 px-3 py-2 text-[13px] font-medium text-danger">{error}</p>
      )}

      <input name="name" placeholder="Nombre (ej. Prensa inclinada del gym)" required minLength={2} className={fieldClass} />

      <select name="bodyPart" required defaultValue="" className={fieldClass}>
        <option value="" disabled>
          Grupo muscular
        </option>
        {BODY_PARTS.map((b) => (
          <option key={b.value} value={b.value}>
            {b.label}
          </option>
        ))}
      </select>

      <input name="equipment" placeholder="Equipo (opcional, ej. máquina)" className={fieldClass} />
      <textarea name="instructions" rows={2} placeholder="Notas de cómo lo haces (opcional)" className={`${fieldClass} resize-none`} />

      {photoEnabled ? (
        <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-[14px] text-muted">
          <Camera className="h-4 w-4" />
          Foto (opcional)
          <input name="photo" type="file" accept="image/*" capture="environment" className="sr-only" />
        </label>
      ) : (
        <p className="text-[12px] text-muted">La foto se activa cuando Vercel Blob esté configurado.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-[15px] font-semibold text-primary-foreground disabled:opacity-70"
      >
        <Plus className="h-4 w-4" />
        {pending ? "Creando…" : "Crear y agregar"}
      </button>
    </form>
  );
}
