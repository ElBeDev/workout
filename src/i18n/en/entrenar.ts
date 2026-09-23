import type { entrenar as Es } from "../es/entrenar";

/** Modo entrenamiento: HUD, filas de serie, unidad de carga, notas. */
export const entrenar: typeof Es = {
  hud: {
    descanso: "Rest",
    entrenando: "Training",
    saltar: "Skip",
    ajuste15: "15s",
    transcurrido: "Elapsed",
    series: "Sets",
  },

  carga: {
    placas: (n) => `${n} ${n === 1 ? "plate" : "plates"}`,
    peso: (peso, unidad) => `${peso} ${unidad === "lbs" ? "lb" : "kg"}`,
    corta: (unidad) =>
      unidad === "plates" ? "plates" : unidad === "lbs" ? "lb" : "kg",
    reps: (n) => `${n} reps`,
  },

  ejercicio: {
    seriesPorReps: (series, reps) => `${series} × ${reps} reps`,
    columnaReps: "Reps",
    agregarSerie: "Add set",
  },

  serie: {
    guardando: "Saving set",
    pendiente: "Set waiting to sync",
    error: "Couldn't save — tap to retry",
    marcar: "Log set",
    seGuardaAlReconectar: "Saves when you're back online",
    ariaPlacas: (serie) => `Plates, set ${serie}`,
    ariaPeso: (serie, unidad) =>
      `Weight, set ${serie} (${unidad === "lbs" ? "lb" : "kg"})`,
    ariaReps: (serie) => `Reps, set ${serie}`,
    nuevoRecord: "New personal record",
  },

  sugerencia: {
    subeA: (carga) => `Go up to ${carga}`,
    repite: (carga) => `Repeat ${carga}`,
    cargaPorReps: (carga, reps) => `${carga} × ${reps}`,
    razonCompleta: (series, reps, carga) =>
      `You hit all ${series} × ${reps} at ${carga}`,
    razonCompletaSinCarga: (series, reps) => `You hit all ${series} × ${reps}`,
    razonFaltaron: "You missed some reps last time",
    usar: "Use",
    listo: "Done",
  },

  notas: {
    titulo: "Today's notes",
    placeholder: "How did it feel? Anything to tweak next time?",
    ayuda: "Saves on its own when you tap away.",
  },

  pendientes: {
    aviso: (n) =>
      n === 1
        ? `${n} set saved offline. It'll sync on its own when you reconnect.`
        : `${n} sets saved offline. They'll sync on their own when you reconnect.`,
    sincronizarAhora: "Sync now",
  },

  unidad: {
    titulo: "How is the load marked?",
    aria: (nombre, corta) => `Load unit for ${nombre}: ${corta}. Tap to change`,
    ariaDialogo: (nombre) => `Load unit for ${nombre}`,
    nota: "It's saved to the routine for next time. Sets you already logged keep the unit you entered them with.",
    opciones: {
      kg: { titulo: "Kilograms", ayuda: "The load is marked in kg" },
      lbs: { titulo: "Pounds", ayuda: "Dumbbells or machines marked in lb" },
      plates: {
        titulo: "Plates",
        ayuda: "Cable stacks and machines with no weight marked: count the plates",
      },
    },
  },

  error: {
    titulo: "Couldn't save",
    detalle:
      "Check your connection and try again. The sets you already logged are still saved.",
    reintentar: "Try again",
  },

  terminarEntrenamiento: "Finish workout",
};
