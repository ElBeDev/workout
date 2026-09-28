/** Retos: ranking del gimnasio y retos que arma el coach (docs/coach-y-retos.md). */
export const retos = {
  titulo: "Retos",
  subtitulo: "La comunidad FiTME",

  // Métricas
  metricas: {
    volume: "Carga",
    days: "Días",
    sets: "Series",
    distance: "Natación",
  } as Record<string, string>,
  /** Para el selector del admin: qué se cuenta exactamente. */
  metricasLargas: {
    volume: "Carga levantada (kg)",
    days: "Días entrenados",
    sets: "Series hechas",
    distance: "Metros nadados",
  } as Record<string, string>,
  unidadDias: (n: number): string => (n === 1 ? "día" : "días"),
  unidadSeries: (n: number): string => (n === 1 ? "serie" : "series"),
  notaCarga: "La carga no cuenta los ejercicios en placas.",

  // Ranking
  ranking: "Ranking",
  semana: "Semana",
  mes: "Mes",
  tu: "tú",
  sinActividad: "Nadie ha sumado todavía en este periodo. Sé el primero.",
  tuLugar: (lugar: number) => `Vas en el lugar ${lugar}`,
  noSumas: "Todavía no sumas en este periodo.",
  oculto: "No apareces en el ranking ni en los retos. Se cambia en Perfil.",
  lugar: (n: number) => `Lugar ${n}`,

  // Retos
  activos: "Retos activos",
  proximos: "Próximamente",
  terminados: "Terminados",
  sinRetos: "No hay retos activos por ahora. El coach los arma desde su panel.",
  faltan: (dias: number) =>
    dias <= 0 ? "Termina hoy" : dias === 1 ? "Termina mañana" : `Faltan ${dias} días`,
  empieza: (fecha: string) => `Empieza el ${fecha}`,
  termino: (fecha: string) => `Terminó el ${fecha}`,
  meta: (valor: string) => `Meta: ${valor}`,
  sinMeta: "Gana quien más sume",
  tuProgreso: "Tu progreso",
  completado: "Completado",
  loLograron: (n: number, total: number) =>
    `${n} de ${total} ${total === 1 ? "lo logró" : "lo lograron"}`,
  gano: (nombre: string) => `Ganó ${nombre}`,
  nadieSumo: "Nadie sumó en este reto.",
  verTodos: (n: number) => `Ver los ${n}`,
};
