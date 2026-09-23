"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import type { LoadUnit } from "@/lib/suggest";
import { setLoadUnit } from "./actions";

const OPCIONES: { id: LoadUnit; titulo: string; ayuda: string }[] = [
  { id: "kg", titulo: "Kilos", ayuda: "La carga viene marcada en kg" },
  { id: "lbs", titulo: "Libras", ayuda: "Mancuernas o máquinas marcadas en lb" },
  { id: "plates", titulo: "Placas", ayuda: "Poleas y máquinas sin peso marcado: se cuentan láminas" },
];

const CORTO: Record<LoadUnit, string> = { kg: "kg", lbs: "lb", plates: "placas" };

/**
 * Cambia la unidad de carga del ejercicio sin salir del entrenamiento. La
 * decisión se toma frente al aparato, no armando la rutina.
 */
export function LoadUnitPicker({
  sessionId,
  exerciseId,
  nombre,
  unidad,
}: {
  sessionId: string;
  exerciseId: string;
  nombre: string;
  unidad: LoadUnit;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();

  useEffect(() => {
    if (!abierto) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [abierto]);

  function elegir(u: LoadUnit) {
    setAbierto(false);
    if (u === unidad) return;
    startTransition(async () => {
      await setLoadUnit(sessionId, exerciseId, u);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={`Unidad de carga de ${nombre}: ${CORTO[unidad]}. Tocar para cambiar`}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-wide text-muted transition active:scale-95"
      >
        {pendiente ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        {CORTO[unidad]}
        <ChevronDown className="h-3 w-3" />
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-70 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setAbierto(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Unidad de carga de ${nombre}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-[1.75rem] bg-background p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
            <h2 className="text-[22px] font-bold tracking-[-0.02em]">¿En qué viene la carga?</h2>
            <p className="mt-1 truncate text-[15px] capitalize text-muted">{nombre}</p>

            <div className="group-list mt-4 overflow-hidden rounded-card bg-surface">
              {OPCIONES.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => elegir(o.id)}
                  className="flex w-full items-center gap-3 p-4 text-left transition active:bg-surface-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold">{o.titulo}</span>
                    <span className="block text-[13px] text-muted">{o.ayuda}</span>
                  </span>
                  {o.id === unidad && <Check className="h-5 w-5 shrink-0 text-accent" />}
                </button>
              ))}
            </div>

            <p className="mt-3 text-[13px] text-muted">
              Se guarda en la rutina para la próxima vez. Las series que ya registraste
              conservan la unidad con la que las anotaste.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
