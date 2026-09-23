"use client";

import { useState } from "react";
import { TrendingUp, RotateCcw, Check } from "lucide-react";
import { useT } from "@/i18n/client";
import type { Suggestion } from "@/lib/suggest";

/**
 * Shows the suggested load for an exercise and, on tap, fills the empty
 * load/reps inputs of that exercise's set rows (forms carry data-exercise).
 * El texto llega ya armado desde el servidor: la razón se construye con datos
 * de la sesión anterior que sólo la página tiene.
 */
export function SuggestionPill({
  exerciseId,
  suggestion,
  titulo,
  razon,
}: {
  exerciseId: string;
  suggestion: Suggestion;
  titulo: string;
  razon: string;
}) {
  const [applied, setApplied] = useState(false);
  const t = useT();

  function apply() {
    const forms = document.querySelectorAll<HTMLFormElement>(`form[data-exercise="${exerciseId}"]`);
    const load = suggestion.plates ?? suggestion.weight;
    forms.forEach((form) => {
      const w = form.querySelector<HTMLInputElement>('input[name="load"]');
      const r = form.querySelector<HTMLInputElement>('input[name="reps"]');
      if (w && !w.value && load !== null) w.value = String(load);
      if (r && !r.value) r.value = String(suggestion.reps);
    });
    setApplied(true);
  }

  const Icon = suggestion.kind === "up" ? TrendingUp : RotateCcw;

  return (
    <div
      className={`mb-3 flex items-center gap-2 rounded-xl px-3 py-2 ${
        suggestion.kind === "up" ? "bg-load/12 text-load" : "bg-surface-2 text-muted"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold leading-tight">{titulo}</p>
        <p className="truncate text-[11px] opacity-80">{razon}</p>
      </div>
      <button
        type="button"
        onClick={apply}
        disabled={applied}
        className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-primary px-3 text-[13px] font-semibold text-primary-foreground disabled:opacity-60"
      >
        {applied ? <Check className="h-3.5 w-3.5" /> : null}
        {applied ? t.entrenar.sugerencia.listo : t.entrenar.sugerencia.usar}
      </button>
    </div>
  );
}
