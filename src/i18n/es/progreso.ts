/** Progreso, detalle de sesión y página por ejercicio. */
export const progreso = {
  // Pantalla de progreso
  titulo: "Progreso",
  rangoSemana: "Semana",
  rangoMes: "Mes",
  rangoAnio: "Año",
  tendenciaDeCarga: "Tendencia de carga",
  tendenciaSeries: "series",
  porcentajeTendencia: (pct: number) => `${pct > 0 ? "+" : ""}${pct} %`,
  tendenciaSinComparacion: (dias: number) =>
    `Aún no hay con qué comparar estos ${dias} días. Sigue entrenando.`,
  tendenciaSubio: (pct: number, dias: number) =>
    `Levantaste ${pct} % más carga que los ${dias} días anteriores.`,
  tendenciaBajo: (pct: number, dias: number) =>
    `Levantaste ${pct} % menos carga que los ${dias} días anteriores.`,
  tendenciaFrecuencia: "frecuencia",
  frecuenciaDetalle: (semana: number, promedio: number) =>
    `${semana} esta semana · prom. ${promedio.toFixed(1)} en las últimas 4`,
  metricaSesiones: "Sesiones",
  metricaSeries: "Series",
  metricaCarga: "Carga",
  metricaTiempo: "Tiempo",
  diasEntrenados: "Días entrenados",
  coberturaMuscular: "Cobertura muscular",
  porEjercicio: "Por ejercicio",
  sesiones: "Sesiones",
  sinSesiones:
    "Todavía no tienes sesiones registradas. Termina un entrenamiento para verlo aquí.",
  rutinaEliminada: "Rutina eliminada",
  series: (n: number) => `${n} ${n === 1 ? "serie" : "series"}`,
  reps: (n: number | null) => `${n ?? "—"} ${n === 1 ? "rep" : "reps"}`,

  // Calendario de constancia
  calendarioDias: ["L", "M", "X", "J", "V", "S", "D"],
  calendarioLocale: "es-MX",
  calendarioDia: (fecha: string, series: number, kg: number) =>
    `${fecha} · ${series} ${series === 1 ? "serie" : "series"} · ${kg} kg`,
  calendarioResumen: (dias: number, semanas: number) =>
    `${dias} ${dias === 1 ? "día entrenado" : "días entrenados"} en las últimas ${semanas} semanas`,

  // Página por ejercicio
  record: "Récord",
  ultima: "Última",
  unidadPlacas: "placas",
  unidadReps: "reps",
  ejercicioSinSesiones: "Todavía no tienes sesiones registradas para este ejercicio.",
  porSesion: "Por sesión",
  placas: (n: number) => `${n} ${n === 1 ? "placa" : "placas"}`,

  // Gráfica del ejercicio
  metricaPesoMax: "Peso máx.",
  metricaPlacasMax: "Placas máx.",
  metricaRepsMax: "Reps máx.",
  metricaVolumen: "Volumen",
  metrica1RM: "1RM est.",
  graficaSinDatos: (metrica: string) => `Sin datos de ${metrica.toLowerCase()} todavía.`,

  // Detalle de sesión
  entrenamientoTerminado: "Entrenamiento terminado",
  semanaConEsteEntrenamiento: "Así va tu semana con este entrenamiento dentro.",
  listo: "Listo",
  recordsSesion: "Récords de esta sesión",

  anilloCarga: (unidad: string) => `Carga (${unidad})`,
  anilloSeries: "Series",
  anilloDias: "Días",
  duracion: "Duración",
  statSeries: "Series",
  cargaTotal: "Carga total",
  statEjercicios: "Ejercicios",
  duracionHorasMinutos: (horas: number, minutos: number) => `${horas} h ${minutos} min`,
  duracionMinutos: (minutos: number) => `${minutos} min`,
  sesionSinSeries: "Esta sesión no tiene series registradas.",
  ejercicios: "Ejercicios",
  notas: "Notas",

  // Editor de series del detalle de sesión
  editarSerie: (n: number) => `Editar serie ${n}`,
  confirmarBorrarSerie: (n: number) => `¿Borrar la serie ${n}?`,
  no: "No",
  siBorrar: "Sí, borrar",
  guardar: "Guardar",
  borrarSerie: "Borrar serie",
  cancelar: "Cancelar",
  placeholderPlacas: "placas",
  placeholderReps: "reps",
};
