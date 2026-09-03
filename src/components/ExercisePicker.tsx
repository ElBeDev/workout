"use client";

import { useEffect, useState } from "react";

type ExerciseResult = {
  id: string;
  name: string;
  bodyPart: string | null;
  equipment: string | null;
  gifUrl: string | null;
};

export function ExercisePicker({
  onSelect,
}: {
  onSelect: (exercise: ExerciseResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setLoading(true);
      fetch(`/api/exercises/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => setResults(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar ejercicio (ej. press banca)"
        className="rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/10 dark:bg-transparent"
      />

      {loading && (
        <p className="text-xs text-black/40 dark:text-white/40">Buscando...</p>
      )}

      {query.trim().length >= 2 && results.length > 0 && (
        <ul className="flex flex-col gap-1">
          {results.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(ex);
                  setQuery("");
                  setResults([]);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-black/10 p-2 text-left dark:border-white/10"
              >
                {ex.gifUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ex.gifUrl}
                    alt={ex.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                )}
                <span>
                  <span className="block text-sm font-medium capitalize">
                    {ex.name}
                  </span>
                  <span className="block text-xs text-black/50 dark:text-white/50">
                    {[ex.bodyPart, ex.equipment].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
