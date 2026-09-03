"use client";

import { Check } from "lucide-react";

export function LogSetButton({ completed }: { completed: boolean }) {
  return (
    <button
      type="submit"
      onClick={() => window.dispatchEvent(new CustomEvent("workout:rest-start"))}
      className={`ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
        completed
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-surface-2 text-muted"
      }`}
      aria-label="Marcar serie"
    >
      <Check className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
}
