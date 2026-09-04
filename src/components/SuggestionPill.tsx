"use client";

import { useState } from "react";
import { TrendingUp, RotateCcw, Check } from "lucide-react";
import type { Suggestion } from "@/lib/suggest";

/**
 * Shows the suggested load for an exercise and, on tap, fills the empty
 * kg/reps inputs of that exercise's set rows (forms carry data-exercise).
 */
export function SuggestionPill({
  exerciseId,
  suggestion,
}: {
  exerciseId: string;
  suggestion: Suggestion;
}) {
  const [applied, setApplied] = useState(false);

  function apply() {
    const forms = document.querySelectorAll<HTMLFormElement>(`form[data-exercise="${exerciseId}"]`);
    forms.forEach((form) => {
      const w = form.querySelector<HTMLInputElement>('input[name="weight"]');
      const r = form.querySelector<HTMLInputElement>('input[name="reps"]');
      if (w && !w.value && suggestion.weight !== null) w.value = String(suggestion.weight);
      if (r && !r.value) r.value = String(suggestion.reps);
    });
    setApplied(true);
  }

  const Icon = suggestion.kind === "up" ? TrendingUp : RotateCcw;
  const label =
    suggestion.weight !== null
      ? `${suggestion.weight} kg × ${suggestion.reps}`
      : `${suggestion.reps} reps`;

  return (
    <div
      className={`mb-3 flex items-center gap-2 rounded-2xl px-3 py-2 ${
        suggestion.kind === "up" ? "bg-accent text-accent-foreground" : "bg-surface-2 text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-tight">
          {suggestion.kind === "up" ? "Sube a" : "Repite"} {label}
        </p>
        <p className="truncate text-[11px] opacity-70">{suggestion.reason}</p>
      </div>
      <button
        type="button"
        onClick={apply}
        disabled={applied}
        className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-primary px-3 text-[12px] font-semibold text-primary-foreground disabled:opacity-60"
      >
        {applied ? <Check className="h-3.5 w-3.5" /> : null}
        {applied ? "Listo" : "Usar"}
      </button>
    </div>
  );
}
