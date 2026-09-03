"use client";

import { Check } from "lucide-react";

export function LogSetButton({ completed }: { completed: boolean }) {
  return (
    <button
      type="submit"
      onClick={() => window.dispatchEvent(new CustomEvent("workout:rest-start"))}
      className={`ml-auto flex h-9 w-9 items-center justify-center rounded-full transition ${
        completed
          ? "bg-green-600 text-white"
          : "bg-black/5 text-black/40 dark:bg-white/10 dark:text-white/40"
      }`}
      aria-label="Marcar serie"
    >
      <Check className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
}
