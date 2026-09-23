/** El separador de miles cambia entre idiomas: 7,200 en inglés y en español de
 *  México, pero 7.200 en otros. Se resuelve por locale para no clavarlo. */
const cache = new Map<string, Intl.NumberFormat>();
function nf(locale: string) {
  let f = cache.get(locale);
  if (!f) { f = new Intl.NumberFormat(locale); cache.set(locale, f); }
  return f;
}

export function fmtNumber(n: number, locale = "es-MX"): string {
  return nf(locale).format(Math.round(n));
}

/** 4,280 kg · 18.4 t cuando el número deja de caber de forma legible. */
export function fmtKg(kg: number, locale = "es-MX"): { value: string; unit: string } {
  if (kg >= 100000) return { value: nf(locale).format(Math.round(kg / 100) / 10), unit: "t" };
  return { value: nf(locale).format(Math.round(kg)), unit: "kg" };
}

/** 1,200 m · 3.4 km cuando el número deja de caber de forma legible. */
export function fmtMeters(meters: number, locale = "es-MX"): { value: string; unit: string } {
  if (meters >= 10000) return { value: nf(locale).format(Math.round(meters / 100) / 10), unit: "km" };
  return { value: nf(locale).format(Math.round(meters)), unit: "m" };
}

/** Ritmo en minutos por cada 100 m, como "1:45". null si no hay con qué calcularlo. */
export function fmtPace100(distanceMeters: number, seconds: number): string | null {
  if (distanceMeters <= 0 || seconds <= 0) return null;
  const secPer100 = Math.round((seconds / distanceMeters) * 100);
  const mm = Math.floor(secPer100 / 60);
  const ss = secPer100 % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

/** 74 → "1 h 14 min"; 42 → "42 min". */
export function fmtMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** 74 → "1h 45m"; cabe en un tile de métrica. */
export function fmtMinutesShort(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Segundos → mm:ss (o h:mm:ss si pasa de la hora). */
export function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
}
