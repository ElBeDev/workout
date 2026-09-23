/** Lista de rutinas, detalle, ajustes y alta de ejercicios. */

type Unidad = "kg" | "lbs" | "plates";

const unidadCorta = (unidad: Unidad): string =>
  unidad === "plates" ? "placas" : unidad === "lbs" ? "lb" : "kg";

const diaCorto = (dia: number): string =>
  ["D", "L", "M", "X", "J", "V", "S"][dia] ?? "";

const diaLargo = (dia: number): string =>
  ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][dia] ?? "";

export const rutinas = {
  cerrar: "Cerrar",
  cancelar: "Cancelar",
  guardar: "Guardar",

  dias: {
    corto: diaCorto,
    largo: diaLargo,
  },

  unidades: {
    corta: unidadCorta,
    larga: (unidad: Unidad): string =>
      unidad === "plates" ? "Placas" : unidad === "lbs" ? "Libras" : "Kilos",
    campo: (unidad: Unidad): string =>
      unidad === "plates" ? "Placas" : unidad === "lbs" ? "Lb" : "Kg",
    campoPeso: (unidad: Unidad): string =>
      unidad === "plates" ? "Placas" : unidad === "lbs" ? "Peso (lb)" : "Peso (kg)",
  },

  campos: {
    series: "Series",
    reps: "Reps",
    pesoPlaceholder: "—",
  },

  lista: {
    titulo: "Rutinas",
    sinRutinas: "Arma tu primera rutina",
    cuantasRutinas: (n: number): string => `${n} ${n === 1 ? "rutina" : "rutinas"}`,
    vacio: "Toca el + de arriba para crear tu primera rutina.",
    ejerciciosYSeries: (ejercicios: number, series: number): string =>
      `${ejercicios} ${ejercicios === 1 ? "ejercicio" : "ejercicios"} · ${series} ${
        series === 1 ? "serie" : "series"
      }`,
    ultimaVez: (dias: number | null): string =>
      dias === null ? "Nunca" : dias <= 0 ? "Hoy" : dias === 1 ? "Ayer" : `Hace ${dias} días`,
  },

  nueva: {
    titulo: "Nueva rutina",
    nombrePlaceholder: "Nombre (ej. Push Day, Pierna)",
    crear: "Crear rutina",
  },

  detalle: {
    editandoComoAdmin: (usuario: string): string =>
      `Editando como admin la rutina de ${usuario}`,
    otroUsuario: "otro usuario",
    sesionAbierta:
      "Tienes un entrenamiento en curso con esta rutina. Termínalo o descártalo desde Hoy antes de eliminarla.",
    ejercicios: "Ejercicios",
    series: "Series",
    musculos: "Músculos",
    empezar: "Empezar entrenamiento",
    sinEjercicios: "Esta rutina todavía no tiene ejercicios. Agrega el primero abajo.",
  },

  ajustes: {
    titulo: "Ajustes de la rutina",
    nombre: "Nombre",
    guardarNombre: "Guardar nombre",
    diasSemana: "Días de la semana",
    diasAyuda: "Aparece primero en «Hoy» esos días.",
    duplicando: "Duplicando…",
    duplicar: "Duplicar rutina",
    confirmarEliminar: (nombre: string): string =>
      `¿Eliminar ${nombre}? Tu historial de entrenamientos se conserva.`,
    eliminando: "Eliminando…",
    siEliminar: "Sí, eliminar",
    eliminar: "Eliminar rutina",
  },

  menuEjercicio: {
    opciones: (nombre: string): string => `Opciones de ${nombre}`,
    subir: "Subir",
    bajar: "Bajar",
    quitar: "Quitar de la rutina",
  },

  objetivos: {
    editar: "Editar series y reps",
    series: (n: number): string => `${n} ${n === 1 ? "serie" : "series"}`,
    reps: (n: number): string => `${n} reps`,
    peso: (peso: string, unidad: Unidad): string => `${peso} ${unidadCorta(unidad)}`,
  },

  agregar: {
    boton: "Agregar ejercicio",
    titulo: "Agregar ejercicio",
    confirmar: "Agregar a la rutina",
    otroEjercicio: "Elegir otro ejercicio",
  },
};
