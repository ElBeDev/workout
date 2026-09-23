import type { progreso as Es } from "../es/progreso";

/** Progreso, detalle de sesión y página por ejercicio. */
export const progreso: typeof Es = {
  // Pantalla de progreso
  titulo: "Progress",
  rangoSemana: "Week",
  rangoMes: "Month",
  rangoAnio: "Year",
  tendenciaDeCarga: "Load trend",
  tendenciaSeries: "sets",
  porcentajeTendencia: (pct) => `${pct > 0 ? "+" : ""}${pct}%`,
  tendenciaSinComparacion: (dias) =>
    `Nothing to compare these ${dias} days against yet. Keep training.`,
  tendenciaSubio: (pct, dias) =>
    `You lifted ${pct}% more load than the previous ${dias} days.`,
  tendenciaBajo: (pct, dias) =>
    `You lifted ${pct}% less load than the previous ${dias} days.`,
  metricaSesiones: "Workouts",
  metricaSeries: "Sets",
  metricaCarga: "Load",
  metricaTiempo: "Time",
  diasEntrenados: "Training days",
  porEjercicio: "By exercise",
  sesiones: "Workouts",
  sinSesiones: "No workouts logged yet. Finish a workout to see it here.",
  rutinaEliminada: "Deleted routine",
  series: (n) => `${n} ${n === 1 ? "set" : "sets"}`,
  reps: (n) => `${n ?? "—"} ${n === 1 ? "rep" : "reps"}`,

  // Calendario de constancia
  calendarioDias: ["M", "T", "W", "T", "F", "S", "S"],
  calendarioLocale: "en-US",
  calendarioDia: (fecha, series, kg) =>
    `${fecha} · ${series} ${series === 1 ? "set" : "sets"} · ${kg} kg`,
  calendarioResumen: (dias, semanas) =>
    `${dias} training ${dias === 1 ? "day" : "days"} in the last ${semanas} weeks`,

  // Página por ejercicio
  record: "Record",
  ultima: "Latest",
  unidadPlacas: "plates",
  unidadReps: "reps",
  ejercicioSinSesiones: "No workouts logged for this exercise yet.",
  porSesion: "By session",
  placas: (n) => `${n} ${n === 1 ? "plate" : "plates"}`,

  // Gráfica del ejercicio
  metricaPesoMax: "Max weight",
  metricaPlacasMax: "Max plates",
  metricaRepsMax: "Max reps",
  metricaVolumen: "Volume",
  graficaSinDatos: (metrica) => `No ${metrica.toLowerCase()} data yet.`,

  // Detalle de sesión
  entrenamientoTerminado: "Workout complete",
  semanaConEsteEntrenamiento: "Here's how your week looks with this workout in it.",
  listo: "Done",
  recordsSesion: "This session's records",
  anilloCarga: (unidad) => `Load (${unidad})`,
  anilloSeries: "Sets",
  anilloDias: "Days",
  duracion: "Duration",
  statSeries: "Sets",
  cargaTotal: "Total load",
  statEjercicios: "Exercises",
  duracionHorasMinutos: (horas, minutos) => `${horas} h ${minutos} min`,
  duracionMinutos: (minutos) => `${minutos} min`,
  sesionSinSeries: "This workout has no sets logged.",
  ejercicios: "Exercises",
  notas: "Notes",

  // Editor de series del detalle de sesión
  editarSerie: (n) => `Edit set ${n}`,
  confirmarBorrarSerie: (n) => `Delete set ${n}?`,
  no: "No",
  siBorrar: "Yes, delete",
  guardar: "Save",
  borrarSerie: "Delete set",
  cancelar: "Cancel",
  placeholderPlacas: "plates",
  placeholderReps: "reps",
};
