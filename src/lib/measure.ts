/**
 * Cómo se mide una serie. Vive en `exercises.measure`; en los tres por tiempo,
 * `set_logs.reps` guarda el tiempo (docs/rutinas.md §7).
 *
 * - `reps`: repeticiones con carga, lo normal.
 * - `seconds`: estiramientos y rodillo. Cuentan el día, no suman series.
 * - `hold`: isométricos (plancha, L-sit, front lever…). Es entrenamiento, así
 *   que sí suman series, ranking de series y cobertura muscular; no tienen
 *   carga ni récord.
 * - `minutes`: cardio (caminadora, bici, elíptica, cuerda…). Igual que `hold`
 *   pero en minutos: 20 minutos de bici no se anotan como 1200 segundos.
 */
export type Measure = "reps" | "seconds" | "hold" | "minutes";

/** Unidad del tiempo que se anota en `set_logs.reps`. */
export type TimeUnit = "s" | "min";

/** Se registra por tiempo y sin carga: la unidad, o `null` si va por reps. */
export function timeUnit(measure: string | null | undefined): TimeUnit | null {
  if (measure === "minutes") return "min";
  if (measure === "seconds" || measure === "hold") return "s";
  return null;
}

/** Se registra por tiempo y sin carga. */
export function isTimed(measure: string | null | undefined): boolean {
  return timeUnit(measure) !== null;
}

/** Suma a series, ranking de series y cobertura muscular. */
export function countsAsSet(measure: string | null | undefined): boolean {
  return measure !== "seconds";
}
