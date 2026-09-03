export const BODY_PARTS = [
  { value: "chest", label: "Pecho" },
  { value: "back", label: "Espalda" },
  { value: "shoulders", label: "Hombros" },
  { value: "upper arms", label: "Brazos" },
  { value: "lower arms", label: "Antebrazos" },
  { value: "upper legs", label: "Piernas" },
  { value: "lower legs", label: "Pantorrillas" },
  { value: "waist", label: "Abdomen" },
  { value: "cardio", label: "Cardio" },
  { value: "neck", label: "Cuello" },
] as const;

export function bodyPartLabel(value: string | null): string {
  if (!value) return "";
  return BODY_PARTS.find((b) => b.value === value)?.label ?? value;
}
