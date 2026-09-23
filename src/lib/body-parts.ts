import { ejercicios as ejerciciosEs } from "@/i18n/es/ejercicios";

/** Los valores son los del catálogo (base de datos, en inglés). Las etiquetas
 *  que ve el usuario viven en el diccionario, en `ejercicios.partes`. */
export const BODY_PARTS = [
  { value: "chest" },
  { value: "back" },
  { value: "shoulders" },
  { value: "upper arms" },
  { value: "lower arms" },
  { value: "upper legs" },
  { value: "lower legs" },
  { value: "waist" },
  { value: "cardio" },
  { value: "neck" },
] as const;

export type BodyPart = (typeof BODY_PARTS)[number]["value"];

/**
 * Traduce el grupo muscular. Sin diccionario cae al español, para los
 * llamadores que todavía no lo pasan.
 */
export function bodyPartLabel(
  value: string | null,
  t?: { ejercicios: { partes: Record<string, string> } }
): string {
  if (!value) return "";
  const partes: Record<string, string> = t?.ejercicios.partes ?? ejerciciosEs.partes;
  return partes[value] ?? value;
}
