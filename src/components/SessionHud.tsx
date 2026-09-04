"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";

const REST_SECONDS = 90;

function format(totalSeconds: number) {
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function SessionHud({
  startedAtMs,
  completed,
  total,
}: {
  startedAtMs: number;
  completed: number;
  total: number;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [rest, setRest] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handleStart(e: Event) {
      const seconds = Number((e as CustomEvent<{ seconds?: number }>).detail?.seconds);
      setRest(Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : REST_SECONDS);
    }
    window.addEventListener("workout:rest-start", handleStart);
    return () => window.removeEventListener("workout:rest-start", handleStart);
  }, []);

  useEffect(() => {
    if (rest === null || rest <= 0) return;
    const id = setTimeout(() => {
      setRest((r) => {
        if (r === null) return null;
        if (r <= 1) {
          try {
            navigator.vibrate?.(200);
          } catch {}
          return null;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [rest]);

  const elapsed = Math.max(0, Math.floor((now - startedAtMs) / 1000));
  const resting = rest !== null;
  const ticks = Math.max(total, 1);

  return (
    <div className="sticky top-3 z-30 rounded-[1.5rem] bg-accent p-4 text-accent-foreground shadow-[0_10px_30px_rgba(21,21,31,0.10)]">
      <div className="flex gap-1">
        {Array.from({ length: Math.min(ticks, 40) }, (_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i < Math.round((completed / ticks) * Math.min(ticks, 40))
                ? "bg-accent-foreground/85"
                : "bg-accent-foreground/20"
            }`}
          />
        ))}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold tabular-nums">{format(elapsed)}</span>
          <span className="text-[11px] opacity-70">Transcurrido</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[40px] font-bold leading-none tabular-nums">
            {resting ? format(rest) : format(elapsed)}
          </span>
          <span className="mt-1 text-[11px] opacity-70">
            {resting ? "Descanso" : "Entrenando"}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[15px] font-semibold tabular-nums">
            {completed}/{total}
          </span>
          <span className="text-[11px] opacity-70">Series</span>
        </div>
      </div>

      {resting && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setRest((r) => Math.max(1, (r ?? 0) - 15))}
            className="flex h-9 items-center gap-1 rounded-full bg-surface px-3 text-[13px] font-medium text-foreground"
          >
            <Minus className="h-3.5 w-3.5" /> 15s
          </button>
          <button
            type="button"
            onClick={() => setRest(null)}
            className="flex h-9 items-center gap-1 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
          >
            <X className="h-3.5 w-3.5" /> Saltar
          </button>
          <button
            type="button"
            onClick={() => setRest((r) => (r ?? 0) + 15)}
            className="flex h-9 items-center gap-1 rounded-full bg-surface px-3 text-[13px] font-medium text-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> 15s
          </button>
        </div>
      )}
    </div>
  );
}
