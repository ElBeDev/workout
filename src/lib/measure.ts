/**
 * Cómo se mide una serie. Vive en `exercises.measure`; en los dos por tiempo,
 * `set_logs.reps` guarda los segundos (docs/rutinas.md §7).
 *
 * - `reps`: repeticiones con carga, lo normal.
 * - `seconds`: estiramientos y rodillo. Cuentan el día, no suman series.
 * - `hold`: isométricos (plancha, L-sit, front lever…). Es entrenamiento, así
 *   que sí suman series, ranking de series y cobertura muscular; no tienen
 *   carga ni récord.
 */
export type Measure = "reps" | "seconds" | "hold";

/** Se registra en segundos y sin carga. */
export function isTimed(measure: string | null | undefined): boolean {
  return measure === "seconds" || measure === "hold";
}

/** Suma a series, ranking de series y cobertura muscular. */
export function countsAsSet(measure: string | null | undefined): boolean {
  return measure !== "seconds";
}
