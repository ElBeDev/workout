/** Rutinas y entrenamiento de natación: bloques, checklist, progreso. */

export const natacion = {
  tipoRutina: {
    titulo: "Tipo de rutina",
    fuerza: "Fuerza",
    natacion: "Natación",
    ayuda: "No se puede cambiar después de creada.",
  },

  bloque: {
    etiquetas: {
      calentamiento: "Calentamiento",
      principal: "Serie principal",
      patada: "Patada",
      drill: "Drill",
      enfriamiento: "Enfriamiento",
      libre: "Libre",
    } as Record<string, string>,
    estilos: {
      libre: "Libre",
      dorso: "Dorso",
      pecho: "Pecho",
      mariposa: "Mariposa",
      combinado: "Combinado",
      patada: "Patada",
      drill: "Drill",
    } as Record<string, string>,
    resumen: (reps: number, distancia: number): string => `${reps} × ${distancia} m`,
    descanso: (segundos: number): string => `Descanso ${segundos}s`,
  },

  rutina: {
    bloques: "Bloques",
    distanciaTotal: "Distancia",
    estilos: "Estilos",
    sinBloques: "Esta rutina todavía no tiene bloques. Agrega el primero abajo.",
  },

  agregarBloque: {
    boton: "Agregar bloque",
    titulo: "Agregar bloque",
    editarTitulo: "Editar bloque",
    confirmar: "Agregar a la rutina",
    guardar: "Guardar",
    campos: {
      etiqueta: "Tipo de bloque",
      estilo: "Estilo",
      repeticiones: "Repeticiones",
      distancia: "Distancia (m)",
      descanso: "Descanso (s, opcional)",
      notas: "Notas (opcional)",
      notasPlaceholder: "Ej. progresivo, salida cada 1:45…",
    },
  },

  menuBloque: {
    opciones: (etiqueta: string): string => `Opciones de ${etiqueta}`,
    subir: "Subir",
    bajar: "Bajar",
    quitar: "Quitar de la rutina",
  },

  entrenar: {
    hud: "Bloques",
    distanciaRealLabel: "m reales",
    marcarHecho: "Hecho",
    deshacer: "Deshacer",
    guardando: "Guardando",
  },

  progresoCard: {
    titulo: "Natación",
    distanciaTotal: "Distancia",
    ritmo: "Ritmo /100m",
    sinRitmo: "—",
    sesiones: (n: number): string => `${n} ${n === 1 ? "sesión" : "sesiones"}`,
  },

  sesion: {
    distanciaTotal: "Distancia",
    ritmo: "Ritmo /100m",
    bloques: "Bloques",
    bloqueEliminado: "Bloque eliminado",
  },
};
