"use client";

import { useState, useTransition } from "react";
import { Camera, Plus, X } from "lucide-react";
import { BODY_PARTS, bodyPartLabel } from "@/lib/body-parts";
import { createCustomExercise, type CreatedExercise } from "@/app/ejercicios/actions";
import { useT } from "@/i18n/client";

const fieldClass =
  "w-full rounded-xl bg-surface-2 px-4 py-3 text-[17px] text-foreground outline-none focus:ring-2 focus:ring-accent";

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
  const t = useT();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-full border border-dashed border-border bg-surface px-5 py-3.5 text-[14px] font-medium text-muted"
      >
        <Plus className="h-4 w-4" />
        {t.ejercicios.noEstaCrealo}
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
      className="flex flex-col gap-3 rounded-tile bg-surface-2 p-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold">{t.ejercicios.nuevoEjercicioPropio}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t.ejercicios.cerrar}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <p className="rounded-2xl bg-danger/10 px-3 py-2 text-[13px] font-medium text-danger">{error}</p>
      )}

      <input
        name="name"
        placeholder={t.ejercicios.nombrePlaceholder}
        required
        minLength={2}
        className={fieldClass}
      />

      <select name="bodyPart" required defaultValue="" className={fieldClass}>
        <option value="" disabled>
          {t.ejercicios.grupoMuscular}
        </option>
        {BODY_PARTS.map((b) => (
          <option key={b.value} value={b.value}>
            {bodyPartLabel(b.value, t)}
          </option>
        ))}
      </select>

      <input name="equipment" placeholder={t.ejercicios.equipoPlaceholder} className={fieldClass} />
      <textarea
        name="instructions"
        rows={2}
        placeholder={t.ejercicios.notasPlaceholder}
        className={`${fieldClass} resize-none`}
      />

      {photoEnabled ? (
        <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-[14px] text-muted">
          <Camera className="h-4 w-4" />
          {t.ejercicios.fotoOpcional}
          <input name="photo" type="file" accept="image/*" capture="environment" className="sr-only" />
        </label>
      ) : (
        <p className="text-[13px] text-muted">{t.ejercicios.sinFotos}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-[15px] font-semibold text-primary-foreground disabled:opacity-70"
      >
        <Plus className="h-4 w-4" />
        {pending ? t.ejercicios.creando : t.ejercicios.crearYAgregar}
      </button>
    </form>
  );
}
