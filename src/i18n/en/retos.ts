import type { retos as Es } from "../es/retos";

/** Challenges: gym leaderboard and challenges set up by the coach (docs/coach-y-retos.md). */
export const retos: typeof Es = {
  titulo: "Challenges",
  subtitulo: "The FiTME community",

  // Métricas
  metricas: {
    volume: "Load",
    days: "Days",
    sets: "Sets",
    distance: "Swim",
  },
  /** Para el selector del admin: qué se cuenta exactamente. */
  metricasLargas: {
    volume: "Weight lifted (kg)",
    days: "Days trained",
    sets: "Sets done",
    distance: "Meters swum",
  },
  unidadDias: (n: number) => (n === 1 ? "day" : "days"),
  unidadSeries: (n: number) => (n === 1 ? "set" : "sets"),
  notaCarga: "Load doesn't count exercises logged in plates.",

  // Ranking
  ranking: "Leaderboard",
  semana: "Week",
  mes: "Month",
  tu: "you",
  sinActividad: "Nobody has scored in this period yet. Be the first.",
  tuLugar: (lugar: number) => `You're in place ${lugar}`,
  noSumas: "You haven't scored in this period yet.",
  oculto: "You don't show up in the leaderboard or challenges. Change it in Profile.",
  lugar: (n: number) => `Place ${n}`,

  // Retos
  activos: "Active challenges",
  proximos: "Coming up",
  terminados: "Finished",
  sinRetos: "No active challenges right now. The coach sets them up from their panel.",
  faltan: (dias: number) =>
    dias <= 0 ? "Ends today" : dias === 1 ? "Ends tomorrow" : `${dias} days left`,
  empieza: (fecha: string) => `Starts ${fecha}`,
  termino: (fecha: string) => `Ended ${fecha}`,
  meta: (valor: string) => `Goal: ${valor}`,
  sinMeta: "Whoever scores the most wins",
  tuProgreso: "Your progress",
  completado: "Completed",
  loLograron: (n: number, total: number) => `${n} of ${total} made it`,
  gano: (nombre: string) => `${nombre} won`,
  nadieSumo: "Nobody scored in this challenge.",
  verTodos: (n: number) => `See all ${n}`,
};
