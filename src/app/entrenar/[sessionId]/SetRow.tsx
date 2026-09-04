"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, Check, CloudOff, Loader2 } from "lucide-react";
import { enqueueSet, findPendingSet } from "@/lib/offline-queue";
import { logSet } from "./actions";

const fieldClass =
  "w-full rounded-2xl border border-border bg-surface-2 px-3 py-3 text-[15px] text-foreground outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none";

type Status = "idle" | "saving" | "done" | "queued" | "error";

function isNetworkError(err: unknown) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const msg = err instanceof Error ? `${err.name} ${err.message}`.toLowerCase() : String(err).toLowerCase();
  return msg.includes("fetch failed") || msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("load failed");
}

export function SetRow({
  userId,
  sessionId,
  exerciseId,
  setNumber,
  extra,
  completed,
  weight,
  reps,
  weightPlaceholder,
  repsPlaceholder,
  restSeconds = 90,
}: {
  userId: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  extra: boolean;
  completed: boolean;
  weight: string | null;
  reps: number | null;
  weightPlaceholder: string;
  repsPlaceholder: string;
  restSeconds?: number;
}) {
  const [status, setStatus] = useState<Status>(completed ? "done" : "idle");
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function fill(w: string | null, r: number | null) {
    const form = formRef.current;
    if (!form) return;
    const wi = form.querySelector<HTMLInputElement>('input[name="weight"]');
    const ri = form.querySelector<HTMLInputElement>('input[name="reps"]');
    if (wi) wi.value = w ?? "";
    if (ri) ri.value = r !== null ? String(r) : "";
  }

  // If this set was queued offline earlier (e.g. after a reload), show it.
  useEffect(() => {
    const pending = findPendingSet(userId, sessionId, exerciseId, setNumber);
    if (!pending) return;
    const id = setTimeout(() => {
      setStatus("queued");
      fill(pending.weight, pending.reps);
    }, 0);
    return () => clearTimeout(id);
  }, [userId, sessionId, exerciseId, setNumber]);

  useEffect(() => {
    const onQueueChange = () => {
      if (status === "queued" && !findPendingSet(userId, sessionId, exerciseId, setNumber)) setStatus("done");
    };
    window.addEventListener("workout:queue-changed", onQueueChange);
    return () => window.removeEventListener("workout:queue-changed", onQueueChange);
  }, [userId, sessionId, exerciseId, setNumber, status]);

  // Dispatched from the button's onClick, not from the action: inside a
  // form action React batches the listener's setState into the transition
  // and the RSC refresh after saving can swallow it.
  function startRest() {
    window.dispatchEvent(new CustomEvent("workout:rest-start", { detail: { seconds: restSeconds } }));
  }

  function submit(formData: FormData) {
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
    // React resets an uncontrolled form after its action runs; put the
    // values back so the row still shows what was typed.
    const restore = () => setTimeout(() => fill(entry.weight, entry.reps), 0);

    if (!navigator.onLine) {
      enqueueSet(userId, entry);
      setStatus("queued");
      restore();
      return;
    }

    setStatus("saving");
    startTransition(async () => {
      try {
        await logSet(formData);
        setStatus("done");
      } catch (err) {
        if (isNetworkError(err)) {
          enqueueSet(userId, entry);
          setStatus("queued");
        } else {
          setStatus("error");
        }
      }
      restore();
    });
  }

  const buttonClass =
    status === "done" || status === "saving"
      ? "bg-primary text-primary-foreground"
      : status === "queued"
        ? "bg-amber-400 text-black"
        : status === "error"
          ? "bg-danger text-white"
          : "border border-border bg-surface-2 text-muted";

  const label =
    status === "saving"
      ? "Guardando serie"
      : status === "queued"
        ? "Serie pendiente de sincronizar"
        : status === "error"
          ? "No se pudo guardar, toca para reintentar"
          : "Marcar serie";

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
        aria-label={`Peso serie ${setNumber} (kg)`}
        className={fieldClass}
      />
      <input
        name="reps"
        type="number"
        inputMode="numeric"
        defaultValue={reps ?? undefined}
        placeholder={repsPlaceholder}
        aria-label={`Repeticiones serie ${setNumber}`}
        className={fieldClass}
      />

      <button
        type="submit"
        onClick={startRest}
        disabled={status === "saving"}
        aria-label={label}
        title={status === "queued" ? "Se guardará al reconectar" : undefined}
        className={`ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-70 ${buttonClass}`}
      >
        {status === "saving" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "queued" ? (
          <CloudOff className="h-4 w-4" />
        ) : status === "error" ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4" strokeWidth={2.5} />
        )}
      </button>
    </form>
  );
}
