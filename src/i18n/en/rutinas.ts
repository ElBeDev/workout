import type { rutinas as Es } from "../es/rutinas";

/** Lista de rutinas, detalle, ajustes y alta de ejercicios. */

type Unidad = "kg" | "lbs" | "plates";

const unidadCorta = (unidad: Unidad): string =>
  unidad === "plates" ? "plates" : unidad === "lbs" ? "lb" : "kg";

const diaCorto = (dia: number): string =>
  ["S", "M", "T", "W", "T", "F", "S"][dia] ?? "";

const diaLargo = (dia: number): string =>
  ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dia] ?? "";

export const rutinas: typeof Es = {
  cerrar: "Close",
  cancelar: "Cancel",
  guardar: "Save",

  dias: {
    corto: diaCorto,
    largo: diaLargo,
  },

  unidades: {
    corta: unidadCorta,
    larga: (unidad: Unidad): string =>
      unidad === "plates" ? "Plates" : unidad === "lbs" ? "Pounds" : "Kilograms",
    campo: (unidad: Unidad): string =>
      unidad === "plates" ? "Plates" : unidad === "lbs" ? "Lb" : "Kg",
    campoPeso: (unidad: Unidad): string =>
      unidad === "plates" ? "Plates" : unidad === "lbs" ? "Load (lb)" : "Load (kg)",
  },

  campos: {
    series: "Sets",
    reps: "Reps",
    pesoPlaceholder: "—",
  },

  lista: {
    titulo: "Routines",
    sinRutinas: "Build your first routine",
    cuantasRutinas: (n: number): string => `${n} ${n === 1 ? "routine" : "routines"}`,
    vacio: "Tap + up top to create your first routine.",
    ejerciciosYSeries: (ejercicios: number, series: number): string =>
      `${ejercicios} ${ejercicios === 1 ? "exercise" : "exercises"} · ${series} ${
        series === 1 ? "set" : "sets"
      }`,
    ultimaVez: (dias: number | null): string =>
      dias === null
        ? "Never"
        : dias <= 0
          ? "Today"
          : dias === 1
            ? "Yesterday"
            : `${dias} days ago`,
  },

  nueva: {
    titulo: "New routine",
    nombrePlaceholder: "Name (e.g. Push Day, Legs)",
    crear: "Create routine",
  },

  detalle: {
    editandoComoAdmin: (usuario: string): string =>
      `Editing ${usuario}'s routine as admin`,
    otroUsuario: "another user",
    sesionAbierta:
      "You have a workout in progress with this routine. Finish or discard it from Today before deleting it.",
    ejercicios: "Exercises",
    series: "Sets",
    musculos: "Muscles",
    empezar: "Start workout",
    sinEjercicios: "This routine has no exercises yet. Add the first one below.",
  },

  ajustes: {
    titulo: "Routine settings",
    nombre: "Name",
    guardarNombre: "Save name",
    diasSemana: "Days of the week",
    diasAyuda: "Shows up first under “Today” on those days.",
    duplicando: "Duplicating…",
    duplicar: "Duplicate routine",
    confirmarEliminar: (nombre: string): string =>
      `Delete ${nombre}? Your workout history is kept.`,
    eliminando: "Deleting…",
    siEliminar: "Yes, delete",
    eliminar: "Delete routine",
  },

  menuEjercicio: {
    opciones: (nombre: string): string => `Options for ${nombre}`,
    subir: "Move up",
    bajar: "Move down",
    quitar: "Remove from routine",
  },

  objetivos: {
    editar: "Edit sets and reps",
    series: (n: number): string => `${n} ${n === 1 ? "set" : "sets"}`,
    reps: (n: number): string => `${n} reps`,
    peso: (peso: string, unidad: Unidad): string => `${peso} ${unidadCorta(unidad)}`,
  },

  agregar: {
    boton: "Add exercise",
    titulo: "Add exercise",
    confirmar: "Add to routine",
    otroEjercicio: "Pick another exercise",
  },
};
