/**
 * The server runs in UTC on Vercel; "today" and "this week" for the user
 * are computed in Mexico City time so a 10pm session doesn't land on
 * tomorrow.
 */
export const APP_TIME_ZONE = "America/Mexico_City";

/** Returns a Date whose local (UTC) fields equal the wall-clock fields in APP_TIME_ZONE. */
export function localDate(date: Date): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute")));
}

/** 0 = domingo … 6 = sábado, in APP_TIME_ZONE. */
export function todayWeekday(now = new Date()): number {
  return localDate(now).getUTCDay();
}

/** ISO-ish week key (Monday-based) for a localDate() value. */
export function weekKey(local: Date): string {
  const d = new Date(local);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export const WEEKDAYS = [
  { value: 1, short: "L", long: "Lunes" },
  { value: 2, short: "M", long: "Martes" },
  { value: 3, short: "X", long: "Miércoles" },
  { value: 4, short: "J", long: "Jueves" },
  { value: 5, short: "V", long: "Viernes" },
  { value: 6, short: "S", long: "Sábado" },
  { value: 0, short: "D", long: "Domingo" },
] as const;

export function daysAgo(date: Date, now = new Date()): number {
  const a = localDate(date);
  const b = localDate(now);
  a.setUTCHours(0, 0, 0, 0);
  b.setUTCHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/**
 * Formato de fecha, siempre en la zona horaria de la app (el servidor corre en
 * UTC). El idioma entra por parámetro: cambiar la app a inglés cambia cómo se
 * escribe la fecha, **no** la zona horaria — esa es la del gimnasio, no la del
 * usuario (ver docs/siguiente-ronda.md §3).
 */
export function fmtDate(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  locale: string = "es-MX"
): string {
  return new Intl.DateTimeFormat(locale, { timeZone: APP_TIME_ZONE, ...options }).format(date);
}

/**
 * Rango de la semana (lunes a domingo) que contiene `now`, escrito como lo
 * escribe cada idioma: "21 – 27 de septiembre" en español, "September 21 – 27"
 * en inglés. Lo resuelve `formatRange`, que conoce esas convenciones; armarlo a
 * mano daba "21 – September 27".
 */
export function weekRangeLabel(now = new Date(), locale: string = "es-MX"): string {
  const local = localDate(now);
  const monday = new Date(local);
  monday.setUTCDate(local.getUTCDate() - ((local.getUTCDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).formatRange(monday, sunday);
}
