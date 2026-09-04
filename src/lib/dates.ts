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

export function daysAgoLabel(date: Date | null): string {
  if (!date) return "Nunca";
  const n = daysAgo(date);
  if (n <= 0) return "Hoy";
  if (n === 1) return "Ayer";
  return `Hace ${n} días`;
}
