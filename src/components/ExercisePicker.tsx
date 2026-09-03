"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { BODY_PARTS, bodyPartLabel } from "@/lib/body-parts";

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
  const [bodyPart, setBodyPart] = useState<string>("");
  const [items, setItems] = useState<ExerciseResult[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (query.trim().length === 1) return;

    const id = ++requestId.current;
    const timeout = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (bodyPart) params.set("bodyPart", bodyPart);

      fetch(`/api/exercises/search?${params}`)
        .then((res) => res.json())
        .then((data) => {
          if (id !== requestId.current) return;
          setItems(data.items ?? []);
          setHasMore(Boolean(data.hasMore));
          setOffset((data.items ?? []).length);
        })
        .catch(() => {})
        .finally(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, bodyPart]);

  function loadMore() {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (bodyPart) params.set("bodyPart", bodyPart);
    params.set("offset", String(offset));

    fetch(`/api/exercises/search?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setItems((prev) => [...prev, ...(data.items ?? [])]);
        setHasMore(Boolean(data.hasMore));
        setOffset((prev) => prev + (data.items ?? []).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ejercicio (ej. press banca)"
          className="w-full rounded-xl border border-black/10 bg-white py-3 pl-9 pr-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/5"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip
          label="Todos"
          active={bodyPart === ""}
          onClick={() => setBodyPart("")}
        />
        {BODY_PARTS.map((bp) => (
          <FilterChip
            key={bp.value}
            label={bp.label}
            active={bodyPart === bp.value}
            onClick={() => setBodyPart(bp.value)}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => onSelect(ex)}
            className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white text-left shadow-sm transition active:scale-[0.98] dark:border-white/10 dark:bg-white/5"
          >
            <div className="aspect-square w-full bg-black/5 dark:bg-white/10">
              {ex.gifUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ex.gifUrl}
                  alt={ex.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex flex-col gap-0.5 p-2">
              <span className="line-clamp-2 text-xs font-medium capitalize leading-tight">
                {ex.name}
              </span>
              <span className="text-[10px] text-black/50 dark:text-white/50">
                {[bodyPartLabel(ex.bodyPart), ex.equipment].filter(Boolean).join(" · ")}
              </span>
            </div>
          </button>
        ))}
      </div>

      {loading && items.length === 0 && (
        <p className="flex items-center justify-center gap-2 py-6 text-xs text-black/40 dark:text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
        </p>
      )}

      {!loading && items.length === 0 && (
        <p className="py-6 text-center text-xs text-black/40 dark:text-white/40">
          No encontramos ejercicios con ese filtro.
        </p>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="rounded-full border border-black/10 py-2 text-xs font-medium disabled:opacity-50 dark:border-white/10"
        >
          {loading ? "Cargando..." : "Cargar más"}
        </button>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
        active
          ? "bg-blue-600 text-white"
          : "bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60"
      }`}
    >
      {label}
    </button>
  );
}
