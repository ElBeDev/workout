"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { logSwimBlock } from "./actions";

type Block = {
  id: string;
  label: string;
  stroke: string;
  reps: number;
  distanceMeters: number;
  restSeconds: number | null;
};

/**
 * Fila de un bloque planeado en el modo entrenamiento de natación: se marca
 * "Hecho" al salir de la alberca, con la distancia real si se quiere ajustar
 * — no hay logueo en vivo, serie por serie, porque el teléfono no entra al
 * agua (docs/natacion.md §0).
 */
export function SwimBlockRow({
  sessionId,
  block,
  initialCompleted,
  initialDistance,
}: {
  sessionId: string;
  block: Block;
  initialCompleted: boolean;
  initialDistance: number;
}) {
  const t = useT();
  const [completed, setCompleted] = useState(initialCompleted);
  const [distance, setDistance] = useState(String(initialDistance));
  const [pending, startTransition] = useTransition();

  function save(nextCompleted: boolean, nextDistance: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("completed", String(nextCompleted));
      fd.set("actualDistanceMeters", nextDistance);
      await logSwimBlock(sessionId, block.id, fd);
    });
  }

  function toggle() {
    const next = !completed;
    setCompleted(next);
    save(next, distance);
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-xl p-2 transition ${completed ? "bg-sets/10" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-snug">
          {t.natacion.bloque.etiquetas[block.label] ?? block.label} ·{" "}
          <span className="font-normal text-muted">
            {t.natacion.bloque.estilos[block.stroke] ?? block.stroke}
          </span>
        </p>
        <p className="text-[13px] text-muted">
          {t.natacion.bloque.resumen(block.reps, block.distanceMeters)}
          {block.restSeconds ? ` · ${t.natacion.bloque.descanso(block.restSeconds)}` : ""}
        </p>
        {completed && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              onBlur={() => save(true, distance)}
              aria-label={t.natacion.entrenar.distanciaRealLabel}
              className="h-8 w-20 rounded-lg bg-surface-2 px-2 text-center text-[13px] font-semibold tabular-nums outline-none [appearance:textfield] focus:ring-2 focus:ring-accent [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[12px] text-muted">{t.natacion.entrenar.distanciaRealLabel}</span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={completed}
        aria-label={t.natacion.entrenar.marcarHecho}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-70 ${
          completed ? "bg-sets text-white" : "bg-surface-2 text-faint"
        }`}
      >
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Check className="h-5 w-5" strokeWidth={3} />
        )}
      </button>
    </div>
  );
}
