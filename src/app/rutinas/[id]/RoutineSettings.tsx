"use client";

import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { Card, Input, SecondaryButton, SectionTitle } from "@/components/ui";
import { renameRoutine, deleteRoutine } from "./actions";

export function RoutineSettings({
  routineId,
  name,
}: {
  routineId: string;
  name: string;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <Card className="flex flex-col gap-4 p-4">
      <SectionTitle>Ajustes de la rutina</SectionTitle>

      <form action={renameRoutine.bind(null, routineId)} className="flex flex-col gap-2">
        <label className="text-[12px] font-medium text-muted">Nombre</label>
        <div className="flex gap-2">
          <Input name="name" defaultValue={name} required className="flex-1" />
          <button
            type="submit"
            aria-label="Guardar nombre"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Check className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </form>

      {confirming ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-danger/10 p-4">
          <p className="text-[14px]">
            ¿Eliminar <span className="font-semibold">{name}</span>? Tu historial de
            entrenamientos se conserva.
          </p>
          <div className="flex gap-2">
            <SecondaryButton
              type="button"
              className="flex-1"
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </SecondaryButton>
            <form action={deleteRoutine.bind(null, routineId)} className="flex-1">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-danger px-5 py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.98]"
              >
                <Trash2 className="h-4 w-4" />
                Sí, eliminar
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-3.5 text-[15px] font-medium text-danger"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar rutina
        </button>
      )}
    </Card>
  );
}
