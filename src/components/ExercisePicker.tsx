"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, Info } from "lucide-react";
import { BODY_PARTS, bodyPartLabel } from "@/lib/body-parts";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { ExerciseInfoSheet } from "@/components/ExerciseInfoSheet";
import { CustomExerciseForm } from "@/components/CustomExerciseForm";
import { Chip, SecondaryButton } from "@/components/ui";

export type ExerciseResult = {
  id: string;
  name: string;
  nameEs: string | null;
  bodyPart: string | null;
  equipment: string | null;
  gifUrl: string | null;
  instructions: string | null;
  isCustom?: boolean;
};

export function ExercisePicker({
  onSelect,
  photoEnabled = false,
}: {
  onSelect: (exercise: ExerciseResult) => void;
  photoEnabled?: boolean;
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
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar (ej. press de banca, curl)"
          className="w-full rounded-2xl border border-border bg-surface-2 py-3.5 pl-11 pr-4 text-[15px] text-foreground outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip active={bodyPart === ""} onClick={() => setBodyPart("")}>
          Todos
        </Chip>
        {BODY_PARTS.map((bp) => (
          <Chip
            key={bp.value}
            active={bodyPart === bp.value}
            onClick={() => setBodyPart(bp.value)}
          >
            {bp.label}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((ex) => (
          <div
            key={ex.id}
            className="relative flex flex-col gap-2 rounded-[1.25rem] border border-border bg-surface-2 p-2"
          >
            <button
              type="button"
              onClick={() => onSelect(ex)}
              className="flex flex-col gap-2 text-left transition active:scale-[0.98]"
            >
              <div className="aspect-square w-full overflow-hidden rounded-2xl bg-surface">
                <ExerciseThumb src={ex.gifUrl} alt={ex.nameEs ?? ex.name} className="h-full w-full" />
              </div>
              <div className="flex flex-col gap-0.5 px-1 pb-1">
                {ex.isCustom && (
                  <span className="mb-0.5 w-fit rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                    Propio
                  </span>
                )}
                <span className="line-clamp-2 text-[13px] font-semibold capitalize leading-tight">
                  {ex.nameEs ?? ex.name}
                </span>
                {ex.nameEs && (
                  <span className="line-clamp-1 text-[11px] capitalize text-muted/80">{ex.name}</span>
                )}
                <span className="text-[11px] text-muted">
                  {[bodyPartLabel(ex.bodyPart), ex.equipment].filter(Boolean).join(" · ")}
                </span>
              </div>
            </button>
            <ExerciseInfoSheet
              exercise={ex}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-[0_2px_8px_rgba(21,21,31,0.12)]"
            >
              <Info className="h-4 w-4" />
            </ExerciseInfoSheet>
          </div>
        ))}
      </div>

      {loading && items.length === 0 && (
        <p className="flex items-center justify-center gap-2 py-6 text-xs text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
        </p>
      )}

      {!loading && items.length === 0 && (
        <p className="py-6 text-center text-xs text-muted">
          No encontramos ejercicios con ese filtro.
        </p>
      )}

      {hasMore && (
        <SecondaryButton type="button" onClick={loadMore} disabled={loading}>
          {loading ? "Cargando..." : "Cargar más"}
        </SecondaryButton>
      )}

      <CustomExerciseForm photoEnabled={photoEnabled} onCreated={(ex) => onSelect(ex)} />
    </div>
  );
}
