/** Textos compartidos: navegación, botones genéricos, estados de error y sin conexión. */
export const comun = {
  /** Locale de Intl para fechas y números. La zona horaria NO cambia: es la
   *  del gimnasio (America/Mexico_City), no la del idioma. */
  intl: "es-MX",

  /** Cápsula de navegación de abajo. */
  nav: {
    hoy: "Hoy",
    rutinas: "Rutinas",
    progreso: "Progreso",
    perfil: "Perfil",
  },

  /** Primitivas del sistema visual (src/components/ui.tsx). */
  volver: "Volver",
  tendencia: {
    sinComparacion: "sin comparación",
    igual: "igual",
    porcentaje: (pct: number) => `${pct > 0 ? "+" : ""}${Math.round(pct)} %`,
  },

  /** Frontera de error de la app. */
  error: {
    titulo: "Algo salió mal",
    descripcion: "Puede ser la señal. Inténtalo de nuevo.",
    reintentar: "Reintentar",
  },

  sinConexion: {
    aviso: "Sin conexión — las series se guardan aquí y se envían al reconectar",
    titulo: "Sin conexión",
    descripcion:
      "Esta pantalla no se había abierto antes, así que no está guardada. Las que ya visitaste sí se abren sin señal; los cambios se guardan cuando vuelva la conexión.",
  },

  /** Metadatos del documento (pestaña del navegador, ficha al compartir). */
  meta: {
    descripcion: "Lleva tus rutinas, pesos y repeticiones desde el celular.",
  },
};
