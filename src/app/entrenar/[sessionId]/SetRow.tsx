"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, CloudOff, Loader2 } from "lucide-react";
import { enqueueSet, findPendingSet } from "@/lib/offline-queue";
import { logSet } from "./actions";

const fieldClass =
  "w-full rounded-2xl border border-border bg-surface-2 px-3 py-3 text-[15px] text-foreground outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none";

export function SetRow({
  sessionId,
  exerciseId,
  setNumber,
  extra,
  completed,
  weight,
  reps,
  weightPlaceholder,
  repsPlaceholder,
}: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  extra: boolean;
  completed: boolean;
  weight: string | null;
  reps: number | null;
  weightPlaceholder: string;
  repsPlaceholder: string;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "queued">(
    completed ? "done" : "idle"
  );
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // If this set was queued offline earlier (e.g. after a reload), show it.
  useEffect(() => {
    const pending = findPendingSet(sessionId, exerciseId, setNumber);
    if (!pending) return;
    const id = setTimeout(() => {
      setStatus("queued");
      const form = formRef.current;
      if (form) {
        const w = form.querySelector<HTMLInputElement>('input[name="weight"]');
        const r = form.querySelector<HTMLInputElement>('input[name="reps"]');
        if (w && pending.weight !== null) w.value = pending.weight;
        if (r && pending.reps !== null) r.value = String(pending.reps);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [sessionId, exerciseId, setNumber]);

  useEffect(() => {
    const onQueueChange = () => {
      if (!findPendingSet(sessionId, exerciseId, setNumber) && status === "queued") setStatus("done");
    };
    window.addEventListener("workout:queue-changed", onQueueChange);
    return () => window.removeEventListener("workout:queue-changed", onQueueChange);
  }, [sessionId, exerciseId, setNumber, status]);

  function submit(formData: FormData) {
    window.dispatchEvent(new CustomEvent("workout:rest-start"));
    formData.set("sessionId", sessionId);
    formData.set("exerciseId", exerciseId);
    formData.set("setNumber", String(setNumber));
    const weightRaw = String(formData.get("weight") ?? "").trim();
    const repsRaw = String(formData.get("reps") ?? "").trim();
    const entry = {
      sessionId,
      exerciseId,
      setNumber,
      weight: weightRaw === "" ? null : weightRaw,
      reps: repsRaw === "" ? null : Number(repsRaw),
    };

    if (!navigator.onLine) {
      enqueueSet(entry);
      setStatus("queued");
      return;
    }

    setStatus("saving");
    startTransition(async () => {
      try {
        await logSet(formData);
        setStatus("done");
      } catch {
        enqueueSet(entry);
        setStatus("queued");
      }
    });
  }

  const buttonClass =
    status === "done" || status === "saving"
      ? "bg-primary text-primary-foreground"
      : status === "queued"
        ? "bg-amber-400 text-black"
        : "border border-border bg-surface-2 text-muted";

  return (
    <form ref={formRef} action={submit} data-exercise={exerciseId} className="flex items-center gap-2">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
          extra
            ? "border border-dashed border-accent-strong text-accent-strong"
            : "bg-accent/40 text-accent-strong"
        }`}
      >
        {setNumber}
      </span>

      <input
        name="weight"
        type="number"
        step="0.5"
        inputMode="decimal"
        defaultValue={weight ?? undefined}
        placeholder={weightPlaceholder}
        className={fieldClass}
      />
      <input
        name="reps"
        type="number"
        inputMode="numeric"
        defaultValue={reps ?? undefined}
        placeholder={repsPlaceholder}
        className={fieldClass}
      />

      <button
        type="submit"
        disabled={status === "saving"}
        aria-label={
          status === "saving"
            ? "Guardando serie"
            : status === "queued"
              ? "Serie pendiente de sincronizar"
              : "Marcar serie"
        }
        title={status === "queued" ? "Se guardará al reconectar" : undefined}
        className={`ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-70 ${buttonClass}`}
      >
        {status === "saving" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "queued" ? (
          <CloudOff className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4" strokeWidth={2.5} />
        )}
      </button>
    </form>
  );
}
