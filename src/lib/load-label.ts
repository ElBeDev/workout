import type { Dict } from "@/i18n/dicts";
import type { WeightUnit } from "./suggest";

/**
 * Cómo se lee una carga guardada: placas si las hay, si no el peso. Usa las
 * mismas claves que `entrenar.carga` (la fila de serie durante el
 * entrenamiento) para que "3 placas" / "3 plates" salga igual en toda la app,
 * sin duplicar el plural en cada pantalla.
 */
export function loadLabel(
  t: Pick<Dict, "entrenar">,
  weight: number | string | null,
  plates: number | null,
  unit: WeightUnit = "kg"
): string | null {
  if (plates !== null && plates > 0) return t.entrenar.carga.placas(plates);
  if (weight !== null && Number(weight) > 0) return t.entrenar.carga.peso(weight, unit);
  return null;
}
