/** Explorador de ejercicios, hoja de cómo se hace y ejercicio propio. */
export const ejercicios = {
  // Grupos musculares. La clave es el valor que trae la base (catálogo en
  // inglés); el nombre del ejercicio y sus instrucciones NO se traducen aquí,
  // vienen ya elegidos por columna desde la base.
  partes: {
    chest: "Pecho",
    back: "Espalda",
    shoulders: "Hombros",
    "upper arms": "Brazos",
    "lower arms": "Antebrazos",
    "upper legs": "Piernas",
    "lower legs": "Pantorrillas",
    waist: "Abdomen",
    cardio: "Cardio",
    neck: "Cuello",
  },

  // Explorador: buscador, filtros y resultados
  buscarPlaceholder: "Buscar (ej. press de banca, curl)",
  todos: "Todos",
  propio: "Propio",
  buscando: "Buscando...",
  sinResultados: "No encontramos ejercicios con ese filtro.",
  cargando: "Cargando...",
  cargarMas: "Cargar más",

  // Hoja de "cómo se hace"
  verComoSeHace: (ejercicio: string) => `Ver cómo se hace: ${ejercicio}`,
  cerrar: "Cerrar",
  sinInstrucciones: "Sin instrucciones para este ejercicio.",

  // Ejercicio propio
  noEstaCrealo: "¿No está? Crea tu propio ejercicio",
  nuevoEjercicioPropio: "Nuevo ejercicio propio",
  nombrePlaceholder: "Nombre (ej. Prensa inclinada del gym)",
  grupoMuscular: "Grupo muscular",
  equipoPlaceholder: "Equipo (opcional, ej. máquina)",
  notasPlaceholder: "Notas de cómo lo haces (opcional)",
  fotoOpcional: "Foto (opcional, máx. 4.5 MB)",
  sinFotos: "Por ahora no se pueden adjuntar fotos.",
  creando: "Creando…",
  crearYAgregar: "Crear y agregar",
};
