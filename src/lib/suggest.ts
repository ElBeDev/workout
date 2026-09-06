export type LastSet = { weight: string | null; plates: number | null; reps: number | null };
export type LoadUnit = "kg" | "plates";

export type Suggestion = {
  weight: number | null;
  plates: number | null;
  reps: number;
  /** "up" = subir carga/reps, "repeat" = repetir lo mismo */
  kind: "up" | "repeat";
  reason: string;
};

const WEIGHT_STEP = 2.5;

export function loadLabel(weight: number | string | null, plates: number | null): string | null {
  if (plates !== null && plates > 0) return `${plates} ${plates === 1 ? "placa" : "placas"}`;
  if (weight !== null && Number(weight) > 0) return `${weight} kg`;
  return null;
}

/**
 * Simple progressive-overload rule based on the previous session:
 * hit every target set with target reps → propose +2.5 kg / +1 placa
 * (or +1 rep when there is no load); otherwise propose repeating.
 */
export function suggestNext(
  last: Map<number, LastSet>,
  targetSets: number,
  targetReps: number,
  unit: LoadUnit = "kg"
): Suggestion | null {
  if (last.size === 0) return null;
  const sets = Array.from(last.values());
  const weights = sets.map((s) => (s.weight !== null ? Number(s.weight) : null));
  const plates = sets.map((s) => s.plates);
  const hasWeight = unit === "kg" && weights.some((w) => w !== null && w > 0);
  const hasPlates = unit === "plates" && plates.some((p) => p !== null && p > 0);
  const maxWeight = hasWeight ? Math.max(...weights.filter((w): w is number => w !== null)) : null;
  const maxPlates = hasPlates ? Math.max(...plates.filter((p): p is number => p !== null)) : null;
  const maxReps = Math.max(...sets.map((s) => s.reps ?? 0));

  const completedAll =
    sets.length >= targetSets && sets.every((s) => (s.reps ?? 0) >= targetReps);

  if (completedAll) {
    if (hasWeight && maxWeight !== null) {
      return {
        weight: Math.round((maxWeight + WEIGHT_STEP) * 2) / 2,
        plates: null,
        reps: targetReps,
        kind: "up",
        reason: `Completaste ${targetSets} × ${targetReps} con ${maxWeight} kg`,
      };
    }
    if (hasPlates && maxPlates !== null) {
      return {
        weight: null,
        plates: maxPlates + 1,
        reps: targetReps,
        kind: "up",
        reason: `Completaste ${targetSets} × ${targetReps} con ${loadLabel(null, maxPlates)}`,
      };
    }
    return {
      weight: null,
      plates: null,
      reps: maxReps + 1,
      kind: "up",
      reason: `Completaste ${targetSets} × ${targetReps}`,
    };
  }

  return {
    weight: maxWeight,
    plates: maxPlates,
    reps: targetReps,
    kind: "repeat",
    reason: "No salieron todas las reps la vez pasada",
  };
}
