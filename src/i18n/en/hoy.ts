import type { hoy as Es } from "../es/hoy";

/** Pantalla Hoy / Resumen. */

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const hoy: typeof Es = {
  /** Notificación del recordatorio diario (la manda el cron, ver
   *  src/app/api/cron/recordatorios). */
  recordatorioTitulo: "Time to train",
  recordatorioCuerpo: (rutina: string) => `${rutina} is on for today. Go get it.`,

  // Cabecera
  titulo: "Summary",
  perfil: "Profile",

  // Anillos de la semana
  carga: (unidad: string) => `Load (${unidad})`,
  series: "Sets",
  dias: "Days",
  rachaSemanas: (semanas: number) => `${semanas}-week streak`,
  porcentajeMetas: (porcentaje: number) => `${porcentaje}% of your goals`,

  // Sesión abierta
  enCurso: "In progress",
  rutinaEliminada: "Deleted routine",
  continuar: "Resume",
  haceMinutos: (minutos: number) => `${minutos} min`,
  haceHoras: (horas: number) => `${horas} h`,
  haceDias: (dias: number) => `${dias} days`,

  // Rutinas
  tusRutinas: "Your routines",
  sinRutinas: "You don't have any routines yet. Create your first one to get started.",
  crearRutina: "New routine",
  hoyToca: (dia: string) => `Today · ${dia}`,
  otrasRutinas: "Other routines",
  verTodas: "See all",
  ejerciciosYSeries: (ejercicios: number, series: number) =>
    `${ejercicios} ${ejercicios === 1 ? "exercise" : "exercises"} · ${series} ${
      series === 1 ? "set" : "sets"
    }`,
  empezarRutina: (rutina: string) => `Start ${rutina}`,
  /** Nombre largo del día de la semana (0 = domingo … 6 = sábado). */
  diaSemana: (dia: number) => DAYS[dia] ?? "",
  /** Última vez que se entrenó la rutina; `null` cuando nunca se ha hecho. */
  ultimaVez: (dias: number | null) => {
    if (dias === null) return "Never";
    if (dias <= 0) return "Today";
    if (dias === 1) return "Yesterday";
    return `${dias} days ago`;
  },

  // Descartar el entrenamiento en curso
  descartar: "Discard",
  descartarEntrenamiento: "Discard workout",
  descartarTitulo: "Discard this workout?",
  descartarAviso: "The sets you've logged in this session will be deleted. This can't be undone.",
  descartando: "Discarding…",
  descartarConfirmar: "Yes, discard",
  cancelar: "Cancel",
};
