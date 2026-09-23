/** Modo entrenamiento: HUD, filas de serie, unidad de carga, notas. */
export const entrenar = {
  /** HUD pegado arriba: cronómetro, descanso y avance de series. */
  hud: {
    descanso: "Descanso",
    entrenando: "Entrenando",
    saltar: "Saltar",
    ajuste15: "15s",
    transcurrido: "Transcurrido",
    series: "Series",
  },

  /** Cómo se nombra una carga. Se usa en placeholders, sugerencias y columnas. */
  carga: {
    placas: (n: number) => `${n} ${n === 1 ? "placa" : "placas"}`,
    peso: (peso: string | number, unidad: "kg" | "lbs") =>
      `${peso} ${unidad === "lbs" ? "lb" : "kg"}`,
    corta: (unidad: "kg" | "lbs" | "plates"): string =>
      unidad === "plates" ? "placas" : unidad === "lbs" ? "lb" : "kg",
    reps: (n: number) => `${n} reps`,
  },

  /** Tarjeta de cada ejercicio dentro de la sesión. */
  ejercicio: {
    seriesPorReps: (series: number, reps: number) => `${series} × ${reps} reps`,
    columnaReps: "Reps",
    agregarSerie: "Agregar serie",
  },

  /** Fila de una serie: campos y estado del botón de marcar. */
  serie: {
    guardando: "Guardando serie",
    pendiente: "Serie pendiente de sincronizar",
    error: "No se pudo guardar, toca para reintentar",
    marcar: "Marcar serie",
    seGuardaAlReconectar: "Se guardará al reconectar",
    ariaPlacas: (serie: number) => `Placas serie ${serie}`,
    ariaPeso: (serie: number, unidad: "kg" | "lbs") =>
      `Peso serie ${serie} (${unidad === "lbs" ? "lb" : "kg"})`,
    ariaReps: (serie: number) => `Repeticiones serie ${serie}`,
    nuevoRecord: "Nuevo récord personal",
  },

  /** Píldora con la carga sugerida a partir de la vez pasada. */
  sugerencia: {
    subeA: (carga: string) => `Sube a ${carga}`,
    repite: (carga: string) => `Repite ${carga}`,
    cargaPorReps: (carga: string, reps: number) => `${carga} × ${reps}`,
    razonCompleta: (series: number, reps: number, carga: string) =>
      `Completaste ${series} × ${reps} con ${carga}`,
    razonCompletaSinCarga: (series: number, reps: number) =>
      `Completaste ${series} × ${reps}`,
    razonFaltaron: "No salieron todas las reps la vez pasada",
    usar: "Usar",
    listo: "Listo",
  },

  /** Notas de la sesión. */
  notas: {
    titulo: "Notas de hoy",
    placeholder: "¿Cómo te sentiste? ¿Algo que ajustar la próxima vez?",
    ayuda: "Se guarda solo al salir del campo.",
  },

  /** Aviso de series guardadas sin señal. */
  pendientes: {
    aviso: (n: number) =>
      n === 1
        ? `${n} serie guardada sin señal. Se sincroniza sola al reconectar.`
        : `${n} series guardadas sin señal. Se sincronizan solas al reconectar.`,
    sincronizarAhora: "Sincronizar ahora",
  },

  /** Hoja para cambiar la unidad de carga del ejercicio. */
  unidad: {
    titulo: "¿En qué viene la carga?",
    aria: (nombre: string, corta: string) =>
      `Unidad de carga de ${nombre}: ${corta}. Tocar para cambiar`,
    ariaDialogo: (nombre: string) => `Unidad de carga de ${nombre}`,
    nota: "Se guarda en la rutina para la próxima vez. Las series que ya registraste conservan la unidad con la que las anotaste.",
    opciones: {
      kg: { titulo: "Kilos", ayuda: "La carga viene marcada en kg" },
      lbs: { titulo: "Libras", ayuda: "Mancuernas o máquinas marcadas en lb" },
      plates: {
        titulo: "Placas",
        ayuda: "Poleas y máquinas sin peso marcado: se cuentan láminas",
      },
    },
  },

  /** Pantalla de error de la sesión. */
  error: {
    titulo: "No se pudo guardar",
    detalle:
      "Revisa tu señal e inténtalo de nuevo. Las series que ya marcaste siguen guardadas.",
    reintentar: "Reintentar",
  },

  terminarEntrenamiento: "Terminar entrenamiento",
};
