import type { ejercicios as Es } from "../es/ejercicios";

/** Explorador de ejercicios, hoja de cómo se hace y ejercicio propio. */
export const ejercicios: typeof Es = {
  // Grupos musculares. La clave es el valor que trae la base (catálogo en
  // inglés); el nombre del ejercicio y sus instrucciones NO se traducen aquí,
  // vienen ya elegidos por columna desde la base.
  partes: {
    chest: "Chest",
    back: "Back",
    shoulders: "Shoulders",
    "upper arms": "Arms",
    "lower arms": "Forearms",
    "upper legs": "Legs",
    "lower legs": "Calves",
    waist: "Abs",
    cardio: "Cardio",
    neck: "Neck",
  },

  // Explorador: buscador, filtros y resultados
  buscarPlaceholder: "Search (e.g. bench press, curl)",
  todos: "All",
  propio: "Custom",
  buscando: "Searching...",
  sinResultados: "No exercises match that filter.",
  cargando: "Loading...",
  cargarMas: "Load more",

  // Hoja de "cómo se hace"
  verComoSeHace: (ejercicio: string) => `How to do ${ejercicio}`,
  cerrar: "Close",
  sinInstrucciones: "No instructions for this exercise.",

  // Ejercicio propio
  noEstaCrealo: "Can't find it? Create your own exercise",
  nuevoEjercicioPropio: "New custom exercise",
  nombrePlaceholder: "Name (e.g. Incline press at my gym)",
  grupoMuscular: "Muscle group",
  equipoPlaceholder: "Equipment (optional, e.g. machine)",
  notasPlaceholder: "Notes on how you do it (optional)",
  fotoOpcional: "Photo (optional, max 4.5 MB)",
  sinFotos: "Photos can't be attached right now.",
  creando: "Creating…",
  crearYAgregar: "Create and add",
};
