"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";

const DEFAULT_SECONDS = 90;

export function RestTimer() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    function handleStart() {
      setSecondsLeft(DEFAULT_SECONDS);
    }
    window.addEventListener("workout:rest-start", handleStart);
    return () => window.removeEventListener("workout:rest-start", handleStart);
  }, []);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const id = setTimeout(() => {
      setSecondsLeft((s) => {
        if (s === null) return null;
        if (s <= 1) {
          try {
            navigator.vibrate?.(200);
          } catch {}
          return null;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  if (secondsLeft === null) return null;

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4">
      <div className="flex items-center gap-1 rounded-full bg-black/85 px-2 py-2 text-white shadow-lg backdrop-blur dark:bg-white/90 dark:text-black">
        <button
          type="button"
          onClick={() => setSecondsLeft((s) => Math.max(0, (s ?? 0) - 15))}
          className="flex h-7 w-7 items-center justify-center rounded-full"
          aria-label="Restar 15s"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-14 text-center text-sm font-semibold tabular-nums">
          {mm}:{String(ss).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => setSecondsLeft((s) => (s ?? 0) + 15)}
          className="flex h-7 w-7 items-center justify-center rounded-full"
          aria-label="Sumar 15s"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setSecondsLeft(null)}
          className="ml-1 flex h-7 w-7 items-center justify-center rounded-full"
          aria-label="Cerrar timer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
