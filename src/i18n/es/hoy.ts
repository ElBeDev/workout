/** Pantalla Hoy / Resumen. */

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const hoy = {
  // Cabecera
  titulo: "Resumen",
  perfil: "Perfil",

  // Anillos de la semana
  carga: (unidad: string) => `Carga (${unidad})`,
  series: "Series",
  dias: "Días",
  rachaSemanas: (semanas: number) => `${semanas} semanas seguidas`,
  porcentajeMetas: (porcentaje: number) => `${porcentaje} % de tus metas`,

  // Sesión abierta
  enCurso: "En curso",
  rutinaEliminada: "Rutina eliminada",
  continuar: "Continuar",
  haceMinutos: (minutos: number) => `${minutos} min`,
  haceHoras: (horas: number) => `${horas} h`,
  haceDias: (dias: number) => `${dias} días`,

  // Rutinas
  tusRutinas: "Tus rutinas",
  sinRutinas: "Todavía no tienes rutinas. Crea la primera para empezar.",
  crearRutina: "Crear rutina",
  hoyToca: (dia: string) => `Hoy toca · ${dia}`,
  otrasRutinas: "Otras rutinas",
  verTodas: "Ver todas",
  ejerciciosYSeries: (ejercicios: number, series: number) =>
    `${ejercicios} ${ejercicios === 1 ? "ejercicio" : "ejercicios"} · ${series} ${
      series === 1 ? "serie" : "series"
    }`,
  empezarRutina: (rutina: string) => `Empezar ${rutina}`,
  /** Nombre largo del día de la semana (0 = domingo … 6 = sábado). */
  diaSemana: (dia: number) => DIAS[dia] ?? "",
  /** Última vez que se entrenó la rutina; `null` cuando nunca se ha hecho. */
  ultimaVez: (dias: number | null) => {
    if (dias === null) return "Nunca";
    if (dias <= 0) return "Hoy";
    if (dias === 1) return "Ayer";
    return `Hace ${dias} días`;
  },

  // Descartar el entrenamiento en curso
  descartar: "Descartar",
  descartarEntrenamiento: "Descartar entrenamiento",
  descartarTitulo: "¿Descartar el entrenamiento?",
  descartarAviso:
    "Se borran las series que llevas registradas en esta sesión. No se puede deshacer.",
  descartando: "Descartando…",
  descartarConfirmar: "Sí, descartar",
  cancelar: "Cancelar",
};
