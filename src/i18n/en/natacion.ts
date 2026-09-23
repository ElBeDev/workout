/** Swim routines and training: blocks, checklist, progress. */

export const natacion = {
  tipoRutina: {
    titulo: "Routine type",
    fuerza: "Strength",
    natacion: "Swimming",
    ayuda: "Can't be changed after it's created.",
  },

  bloque: {
    etiquetas: {
      calentamiento: "Warm-up",
      principal: "Main set",
      patada: "Kick",
      drill: "Drill",
      enfriamiento: "Cool-down",
      libre: "Free",
    } as Record<string, string>,
    estilos: {
      libre: "Freestyle",
      dorso: "Backstroke",
      pecho: "Breaststroke",
      mariposa: "Butterfly",
      combinado: "IM",
      patada: "Kick",
      drill: "Drill",
    } as Record<string, string>,
    resumen: (reps: number, distancia: number): string => `${reps} × ${distancia} m`,
    descanso: (segundos: number): string => `Rest ${segundos}s`,
  },

  rutina: {
    bloques: "Blocks",
    distanciaTotal: "Distance",
    estilos: "Strokes",
    sinBloques: "This routine has no blocks yet. Add the first one below.",
  },

  agregarBloque: {
    boton: "Add block",
    titulo: "Add block",
    editarTitulo: "Edit block",
    confirmar: "Add to routine",
    guardar: "Save",
    campos: {
      etiqueta: "Block type",
      estilo: "Stroke",
      repeticiones: "Reps",
      distancia: "Distance (m)",
      descanso: "Rest (s, optional)",
      notas: "Notes (optional)",
      notasPlaceholder: "E.g. descending, send-off every 1:45…",
    },
  },

  menuBloque: {
    opciones: (etiqueta: string): string => `${etiqueta} options`,
    subir: "Move up",
    bajar: "Move down",
    quitar: "Remove from routine",
  },

  entrenar: {
    hud: "Blocks",
    distanciaRealLabel: "actual m",
    marcarHecho: "Done",
    deshacer: "Undo",
    guardando: "Saving",
  },

  progresoCard: {
    titulo: "Swimming",
    distanciaTotal: "Distance",
    ritmo: "Pace /100m",
    sinRitmo: "—",
    sesiones: (n: number): string => `${n} ${n === 1 ? "workout" : "workouts"}`,
  },

  sesion: {
    distanciaTotal: "Distance",
    ritmo: "Pace /100m",
    bloques: "Blocks",
    bloqueEliminado: "Deleted block",
  },
};
