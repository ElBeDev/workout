"use client";

import { useFormStatus } from "react-dom";
import { Check, Loader2 } from "lucide-react";

export function LogSetButton({ completed }: { completed: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={() => window.dispatchEvent(new CustomEvent("workout:rest-start"))}
      className={`ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-70 ${
        completed || pending
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-surface-2 text-muted"
      }`}
      aria-label={pending ? "Guardando serie" : "Marcar serie"}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4" strokeWidth={2.5} />
      )}
    </button>
  );
}
