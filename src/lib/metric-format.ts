import type { Dict } from "@/i18n/dicts";
import type { Metric } from "@/db/gym";
import { fmtKg, fmtMeters, fmtNumber } from "@/lib/format";

/** Un valor del ranking o de un reto con su unidad: "18.4 t", "12 días", "1,200 m". */
export function fmtMetric(metric: Metric, value: number, t: Dict): { value: string; unit: string } {
  switch (metric) {
    case "volume":
      return fmtKg(value, t.comun.intl);
    case "distance":
      return fmtMeters(value, t.comun.intl);
    case "days":
      return { value: fmtNumber(value, t.comun.intl), unit: t.retos.unidadDias(value) };
    case "sets":
      return { value: fmtNumber(value, t.comun.intl), unit: t.retos.unidadSeries(value) };
  }
}

/** Mismo valor en una sola cadena, para textos corridos ("Meta: 12 días"). */
export function fmtMetricText(metric: Metric, value: number, t: Dict): string {
  const f = fmtMetric(metric, value, t);
  return `${f.value} ${f.unit}`;
}

/** El color del dato, el mismo que en los anillos: carga rosa, series verde, días cian. */
export const METRIC_TONE: Record<Metric, string> = {
  volume: "text-load",
  sets: "text-sets",
  days: "text-days",
  distance: "text-load",
};

export const METRIC_BG: Record<Metric, string> = {
  volume: "bg-load",
  sets: "bg-sets",
  days: "bg-days",
  distance: "bg-load",
};
