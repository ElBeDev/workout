const NUM = new Intl.NumberFormat("es-MX");

export function fmtNumber(n: number): string {
  return NUM.format(Math.round(n));
}

/** 4,280 kg · 18.4 t cuando el número deja de caber de forma legible. */
export function fmtKg(kg: number): { value: string; unit: string } {
  if (kg >= 100000) return { value: (kg / 1000).toFixed(1).replace(".", ","), unit: "t" };
  return { value: NUM.format(Math.round(kg)), unit: "kg" };
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
