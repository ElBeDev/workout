/**
 * Cómo se mide una serie: repeticiones, o segundos sostenidos (estiramientos,
 * rodillo). Vive en `exercises.measure`; en los de segundos, `set_logs.reps`
 * guarda los segundos.
 */
export type Measure = "reps" | "seconds";

export function isTimed(measure: string | null | undefined): boolean {
  return measure === "seconds";
}
