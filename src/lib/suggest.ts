export type LastSet = { weight: string | null; reps: number | null };

export type Suggestion = {
  weight: number | null;
  reps: number;
  /** "up" = subir peso/reps, "repeat" = repetir lo mismo */
  kind: "up" | "repeat";
  reason: string;
};

const WEIGHT_STEP = 2.5;

/**
 * Simple progressive-overload rule based on the previous session:
 * hit every target set with target reps → propose +2.5 kg (or +1 rep when
 * there is no weight); otherwise propose repeating the same load.
 */
export function suggestNext(
  last: Map<number, LastSet>,
  targetSets: number,
  targetReps: number
): Suggestion | null {
  if (last.size === 0) return null;
  const sets = Array.from(last.values());
  const weights = sets.map((s) => (s.weight !== null ? Number(s.weight) : null));
  const hasWeight = weights.some((w) => w !== null && w > 0);
  const maxWeight = hasWeight ? Math.max(...weights.filter((w): w is number => w !== null)) : null;
  const maxReps = Math.max(...sets.map((s) => s.reps ?? 0));

  const completedAll =
    sets.length >= targetSets && sets.every((s) => (s.reps ?? 0) >= targetReps);

  if (completedAll) {
    if (hasWeight && maxWeight !== null) {
      return {
        weight: Math.round((maxWeight + WEIGHT_STEP) * 2) / 2,
        reps: targetReps,
        kind: "up",
        reason: `Completaste ${targetSets} × ${targetReps} con ${maxWeight} kg`,
      };
    }
    return {
      weight: null,
      reps: maxReps + 1,
      kind: "up",
      reason: `Completaste ${targetSets} × ${targetReps}`,
    };
  }

  return {
    weight: maxWeight,
    reps: targetReps,
    kind: "repeat",
    reason: "No salieron todas las reps la vez pasada",
  };
}
