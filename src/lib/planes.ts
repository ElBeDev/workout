/**
 * Los planes del coach (docs/negocio.md §4): precio al mes en pesos con IVA
 * incluido y cuántos alumnos activos caben (`null` = sin tope). Un solo lugar
 * para el panel del dueño, la página pública y, en el paso 5, Stripe.
 */
export const PLANES = {
  coach: { precio: 199, cupo: 30 },
  coach_plus: { precio: 399, cupo: null },
  comp: { precio: 0, cupo: null },
} as const satisfies Record<string, { precio: number; cupo: number | null }>;

export type Plan = keyof typeof PLANES;

export function esPlan(value: string): value is Plan {
  return value in PLANES;
}

/** Días de prueba antes del primer cobro. */
export const DIAS_PRUEBA = 14;

/** Precio del plan anual de Coach: 10 meses (2 gratis). */
export const PRECIO_ANUAL_COACH = PLANES.coach.precio * 10;
