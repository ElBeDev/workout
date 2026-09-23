export type WeightUnit = "kg" | "lbs";
export type LoadUnit = WeightUnit | "plates";
export type LastSet = {
  weight: string | null;
  plates: number | null;
  reps: number | null;
  weightUnit: WeightUnit | null;
};

export type Suggestion = {
  weight: number | null;
  plates: number | null;
  reps: number;
  unit: WeightUnit;
  /** "up" = subir carga/reps, "repeat" = repetir lo mismo */
  kind: "up" | "repeat";
};

const WEIGHT_STEP: Record<WeightUnit, number> = { kg: 2.5, lbs: 5 };
const LB_TO_KG = 0.45359237;

/** Converts a raw entered weight to kg, for aggregates that must add across units (e.g. session volume). */
export function toKg(weight: number, unit: WeightUnit): number {
  return unit === "lbs" ? weight * LB_TO_KG : weight;
}

export function normalizeLoadUnit(value: string | null | undefined): LoadUnit {
  if (value === "plates") return "plates";
  if (value === "lbs") return "lbs";
  return "kg";
}

/**
 * Simple progressive-overload rule based on the previous session:
 * hit every target set with target reps → propose +2.5 kg (or +5 lb) / +1
 * placa (or +1 rep when there is no load); otherwise propose repeating.
 * Weight history logged in a different unit than the exercise's current one
 * (e.g. it moved from a kg-marked to a lb-marked machine) is ignored rather
 * than compared raw, since the numbers aren't on the same scale.
 */
export function suggestNext(
  last: Map<number, LastSet>,
  targetSets: number,
  targetReps: number,
  unit: LoadUnit = "kg"
): Suggestion | null {
  if (last.size === 0) return null;
  const sets = Array.from(last.values());
  const weightUnit: WeightUnit = unit === "lbs" ? "lbs" : "kg";
  const weights = sets.map((s) =>
    s.weight !== null && (s.weightUnit ?? "kg") === weightUnit ? Number(s.weight) : null
  );
  const plates = sets.map((s) => s.plates);
  const hasWeight = unit !== "plates" && weights.some((w) => w !== null && w > 0);
  const hasPlates = unit === "plates" && plates.some((p) => p !== null && p > 0);
  const maxWeight = hasWeight ? Math.max(...weights.filter((w): w is number => w !== null)) : null;
  const maxPlates = hasPlates ? Math.max(...plates.filter((p): p is number => p !== null)) : null;
  const maxReps = Math.max(...sets.map((s) => s.reps ?? 0));

  const completedAll =
    sets.length >= targetSets && sets.every((s) => (s.reps ?? 0) >= targetReps);

  if (completedAll) {
    if (hasWeight && maxWeight !== null) {
      return {
        weight: Math.round((maxWeight + WEIGHT_STEP[weightUnit]) * 2) / 2,
        plates: null,
        reps: targetReps,
        unit: weightUnit,
        kind: "up",
      };
    }
    if (hasPlates && maxPlates !== null) {
      return {
        weight: null,
        plates: maxPlates + 1,
        reps: targetReps,
        unit: weightUnit,
        kind: "up",
      };
    }
    return {
      weight: null,
      plates: null,
      reps: maxReps + 1,
      unit: weightUnit,
      kind: "up",
    };
  }

  return {
    weight: maxWeight,
    plates: maxPlates,
    reps: targetReps,
    unit: weightUnit,
    kind: "repeat",
  };
}
