"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Trash2, Loader2 } from "lucide-react";
import { Card, Input, SecondaryButton, SectionTitle } from "@/components/ui";
import { PendingButton } from "@/components/PendingButton";
import { WEEKDAYS } from "@/lib/dates";
import { renameRoutine, deleteRoutine, setRoutineDays, duplicateRoutine } from "./actions";

export function RoutineSettings({
  routineId,
  name,
  days,
}: {
  routineId: string;
  name: string;
  days: number[];
}) {
  const [confirming, setConfirming] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>(days);
  const [savingDays, startSavingDays] = useTransition();

  function toggleDay(day: number) {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(next);
    startSavingDays(() => setRoutineDays(routineId, next));
  }

  return (
    <Card className="flex flex-col gap-5 p-4">
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-medium text-muted">Días de la semana</label>
          {savingDays && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />}
        </div>
        <div className="flex justify-between gap-1">
          {WEEKDAYS.map((d) => {
            const active = selectedDays.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                aria-pressed={active}
                aria-label={d.long}
                className={`flex h-11 flex-1 items-center justify-center rounded-full text-[14px] font-semibold transition ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-surface-2 text-muted"
                }`}
              >
                {d.short}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted">Aparece primero en «Hoy» esos días.</p>
      </div>

      <form action={duplicateRoutine.bind(null, routineId)}>
        <PendingButton
          pendingLabel="Duplicando…"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-3.5 text-[15px] font-medium text-foreground active:scale-[0.98] disabled:opacity-70"
        >
          <Copy className="h-4 w-4" />
          Duplicar rutina
        </PendingButton>
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
              <PendingButton
                pendingLabel="Eliminando…"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-danger px-5 py-3.5 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-70"
              >
                <Trash2 className="h-4 w-4" />
                Sí, eliminar
              </PendingButton>
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
