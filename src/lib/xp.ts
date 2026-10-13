/**
 * XP, rangos y medallas (docs/gamificacion.md §4). Todo puro: recibe las
 * series y bloques ya registrados y arma la línea de tiempo. No se guarda nada,
 * así que corregir o borrar una serie corrige el XP sola, y cambiar una regla
 * de aquí es cambiar código, sin migrar datos.
 */
import { addDaysYmd, localDate, weekKey } from "@/lib/dates";
import { toKg } from "@/lib/suggest";

/* ── Reglas ────────────────────────────────────────────────────────────── */

export const XP = {
  /** Día con al menos una serie o bloque de natación. */
  day: 100,
  /** Cada serie que cuenta (no estiramientos)… */
  set: 5,
  /** …hasta este número por día, para que nadie infle el número. */
  setsPerDayCap: 30,
  /** Bloque de natación completado: más o menos 3 series. */
  swimBlock: 15,
  /** Récord personal roto (ya había una marca y se superó). Uno por ejercicio
   *  y sesión: subir de peso serie tras serie es un solo récord, no cinco. */
  record: 15,
  /** Semana en la que se cumple la meta de días de la persona. */
  weekGoal: 150,
} as const;

export const TIERS = [
  { id: "bronce", min: 0, color: "#c07a3f" },
  { id: "plata", min: 1500, color: "#8e9aa6" },
  { id: "oro", min: 4000, color: "#d9a520" },
  { id: "platino", min: 8000, color: "#2bb3a3" },
  { id: "diamante", min: 14000, color: "#3d8bfd" },
  { id: "campeon", min: 22000, color: "#9b5cf6" },
  { id: "leyenda", min: 32000, color: "#ff375f" },
] as const;

export type TierId = (typeof TIERS)[number]["id"];

export type Rank = {
  tier: TierId;
  color: string;
  /** 3, 2 o 1 (III → I, como en los juegos); null en Leyenda, que no tiene. */
  division: 1 | 2 | 3 | null;
  /** Índice global del escalón (Bronce III = 0), para saber si alguien subió. */
  step: number;
  xp: number;
  /** XP donde empieza este escalón y donde empieza el siguiente (null en Leyenda). */
  floor: number;
  next: number | null;
  /** 0–1 dentro del escalón. */
  progress: number;
};

/** El rango para un total de XP. Nunca baja: el XP sólo suma. */
export function rankFor(xp: number): Rank {
  let i = TIERS.length - 1;
  while (i > 0 && xp < TIERS[i].min) i--;
  const tier = TIERS[i];
  const upper = TIERS[i + 1]?.min ?? null;
  if (upper === null) {
    return { tier: tier.id, color: tier.color, division: null, step: i * 3, xp, floor: tier.min, next: null, progress: 1 };
  }
  const size = (upper - tier.min) / 3;
  const d = Math.min(2, Math.floor((xp - tier.min) / size)); // 0, 1, 2
  const floor = Math.round(tier.min + d * size);
  const next = Math.round(tier.min + (d + 1) * size);
  return {
    tier: tier.id,
    color: tier.color,
    division: (3 - d) as 1 | 2 | 3,
    step: i * 3 + d,
    xp,
    floor,
    next,
    progress: (xp - floor) / (next - floor),
  };
}

/** El siguiente escalón: "Plata I" después de "Plata II", "Oro III" después de "Plata I". */
export function nextRank(rank: Rank): Rank | null {
  return rank.next === null ? null : rankFor(rank.next);
}

/* ── Medallas ──────────────────────────────────────────────────────────── */

export const MEDAL_GROUPS = [
  { group: "dias", thresholds: [1, 10, 25, 50, 100, 250] },
  { group: "racha", thresholds: [4, 8, 12, 26] },
  { group: "anillos", thresholds: [1, 4] },
  { group: "records", thresholds: [1, 25, 50, 100] },
  { group: "toneladas", thresholds: [1, 10, 100] },
  { group: "natacion", thresholds: [1, 10, 42.2] },
  { group: "retoCumplido", thresholds: [1] },
  { group: "retoGanado", thresholds: [1] },
] as const;

export type MedalGroup = (typeof MEDAL_GROUPS)[number]["group"];

export type Medal = {
  id: string;
  group: MedalGroup;
  threshold: number;
};

export const MEDALS: Medal[] = MEDAL_GROUPS.flatMap(({ group, thresholds }) =>
  thresholds.map((threshold) => ({ id: `${group}-${threshold}`, group, threshold }))
);

/* ── La línea de tiempo ────────────────────────────────────────────────── */

export type SetInput = {
  at: Date;
  sessionId: string;
  exerciseId: string;
  /** "reps" | "seconds" | "hold" (src/lib/measure.ts). */
  measure: string;
  weight: string | number | null;
  weightUnit: string;
  plates: number | null;
  reps: number | null;
};

export type SwimInput = {
  at: Date;
  sessionId: string;
  meters: number;
};

export type Goals = { days: number; sets: number; volumeKg: number };

export type XpKind = "day" | "set" | "swim" | "record" | "weekGoal";

export type XpEvent = { at: Date; sessionId: string; xp: number; kind: XpKind };

export type MedalUnlock = { id: string; at: Date | null; sessionId: string | null };

export type Timeline = {
  events: XpEvent[];
  /** Medallas ganadas, con cuándo y en qué sesión (null en las de retos). */
  medals: MedalUnlock[];
  totalXp: number;
  stats: { days: number; records: number; kg: number; meters: number; bestStreak: number; ringWeeks: number };
};

function score(s: SetInput): number {
  if (s.plates !== null) return s.plates;
  const w = s.weight !== null ? Number(s.weight) : null;
  return w !== null && Number.isFinite(w) ? toKg(w, s.weightUnit === "lbs" ? "lbs" : "kg") : 0;
}

/** Carga en kg, con los mismos criterios que los anillos: las placas no suman. */
function kgOf(s: SetInput): number {
  const w = s.weight !== null ? Number(s.weight) : 0;
  if (!s.reps || !Number.isFinite(w) || w <= 0) return 0;
  return toKg(w, s.weightUnit === "lbs" ? "lbs" : "kg") * s.reps;
}

/**
 * Recorre series y bloques en orden y reparte XP y medallas. Mismos criterios
 * que los anillos y el ranking (docs/coach-y-retos.md): un día cuenta con una
 * serie o un bloque, los estiramientos (`seconds`) no suman series, las placas
 * no suman carga. Un récord es como el aviso en vivo: superar una marca que ya
 * existía (la primera vez que haces un ejercicio no es récord).
 *
 * Las metas son las actuales de la persona, también para semanas pasadas: no
 * hay historial de metas.
 */
export function buildTimeline(sets: SetInput[], swims: SwimInput[], goals: Goals): Timeline {
  type Item = { kind: "set"; s: SetInput } | { kind: "swim"; s: SwimInput };
  const items: Item[] = [
    ...sets.map((s) => ({ kind: "set" as const, s })),
    ...swims.map((s) => ({ kind: "swim" as const, s })),
  ].sort((a, b) => a.s.at.getTime() - b.s.at.getTime());

  const events: XpEvent[] = [];
  const medals: MedalUnlock[] = [];
  const got = new Set<string>();
  const unlock = (group: MedalGroup, value: number, at: Date, sessionId: string) => {
    for (const m of MEDALS) {
      if (m.group === group && value >= m.threshold && !got.has(m.id)) {
        got.add(m.id);
        medals.push({ id: m.id, at, sessionId });
      }
    }
  };

  const days = new Set<string>();
  const setsPerDay = new Map<string, number>();
  const weekDays = new Map<string, Set<string>>();
  const weekGoalPaid = new Set<string>();
  const weekKg = new Map<string, number>();
  const weekSets = new Map<string, number>();
  const ringWeeks = new Set<string>();
  const streakByWeek = new Map<string, number>();
  const best = new Map<string, { score: number; reps: number }>();
  const recordIn = new Set<string>(); // "sesión:ejercicio" que ya dio récord
  let records = 0;
  let kg = 0;
  let meters = 0;
  let bestStreak = 0;

  for (const item of items) {
    const { at, sessionId } = item.s;
    const local = localDate(at);
    const ymd = local.toISOString().slice(0, 10);
    const wk = weekKey(local);
    const add = (xp: number, kind: XpKind) => events.push({ at, sessionId, xp, kind });

    if (!days.has(ymd)) {
      days.add(ymd);
      add(XP.day, "day");
      unlock("dias", days.size, at, sessionId);

      const inWeek = weekDays.get(wk) ?? new Set<string>();
      if (inWeek.size === 0) {
        // Primera vez en la semana: la racha sigue si la semana anterior tuvo algo.
        const streak = (streakByWeek.get(addDaysYmd(wk, -7)) ?? 0) + 1;
        streakByWeek.set(wk, streak);
        bestStreak = Math.max(bestStreak, streak);
        unlock("racha", streak, at, sessionId);
      }
      inWeek.add(ymd);
      weekDays.set(wk, inWeek);
      if (inWeek.size >= goals.days && !weekGoalPaid.has(wk)) {
        weekGoalPaid.add(wk);
        add(XP.weekGoal, "weekGoal");
      }
    }

    if (item.kind === "swim") {
      add(XP.swimBlock, "swim");
      meters += item.s.meters;
      unlock("natacion", meters / 1000, at, sessionId);
    } else {
      const s = item.s;
      if (s.measure !== "seconds") {
        const n = (setsPerDay.get(ymd) ?? 0) + 1;
        setsPerDay.set(ymd, n);
        if (n <= XP.setsPerDayCap) add(XP.set, "set");
        weekSets.set(wk, (weekSets.get(wk) ?? 0) + 1);
      }
      if (s.measure === "reps") {
        const sc = score(s);
        const reps = s.reps ?? 0;
        const prev = best.get(s.exerciseId);
        const key = `${sessionId}:${s.exerciseId}`;
        if (prev && (sc > prev.score || (sc === prev.score && reps > prev.reps)) && !recordIn.has(key)) {
          recordIn.add(key);
          records += 1;
          add(XP.record, "record");
          unlock("records", records, at, sessionId);
        }
        if (!prev || sc > prev.score || (sc === prev.score && reps > prev.reps)) {
          best.set(s.exerciseId, { score: sc, reps });
        }
      }
      const setKg = kgOf(s);
      if (setKg > 0) {
        kg += setKg;
        weekKg.set(wk, (weekKg.get(wk) ?? 0) + setKg);
        unlock("toneladas", kg / 1000, at, sessionId);
      }
    }

    // Los tres anillos cerrados en la semana.
    if (
      !ringWeeks.has(wk) &&
      (weekDays.get(wk)?.size ?? 0) >= goals.days &&
      (weekSets.get(wk) ?? 0) >= goals.sets &&
      (weekKg.get(wk) ?? 0) >= goals.volumeKg
    ) {
      ringWeeks.add(wk);
      unlock("anillos", ringWeeks.size, at, sessionId);
    }
  }

  return {
    events,
    medals,
    totalXp: events.reduce((sum, e) => sum + e.xp, 0),
    stats: { days: days.size, records, kg, meters, bestStreak, ringWeeks: ringWeeks.size },
  };
}

/** XP ganado entre `since` (inclusive) y `until` (exclusivo). */
export function xpBetween(t: Timeline, since: Date, until: Date): number {
  let sum = 0;
  for (const e of t.events) if (e.at >= since && e.at < until) sum += e.xp;
  return sum;
}

/** XP ganado en una sesión. */
export function xpInSession(t: Timeline, sessionId: string): number {
  let sum = 0;
  for (const e of t.events) if (e.sessionId === sessionId) sum += e.xp;
  return sum;
}
