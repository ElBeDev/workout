import type { comun as Es } from "../es/comun";

/** Textos compartidos: navegación, botones genéricos, estados de error y sin conexión. */
export const comun: typeof Es = {
  /** Locale de Intl para fechas y números. La zona horaria NO cambia: es la
   *  del gimnasio (America/Mexico_City), no la del idioma. */
  intl: "en-US",

  nav: {
    hoy: "Today",
    rutinas: "Routines",
    progreso: "Progress",
    perfil: "Profile",
  },

  volver: "Back",
  tendencia: {
    sinComparacion: "no baseline",
    igual: "no change",
    porcentaje: (pct) => `${pct > 0 ? "+" : ""}${Math.round(pct)}%`,
  },

  error: {
    titulo: "Something went wrong",
    descripcion: "It might be your signal. Give it another try.",
    reintentar: "Try again",
  },

  sinConexion: {
    aviso: "Offline — your sets are saved here and sent when you reconnect",
    titulo: "You're offline",
    descripcion:
      "You hadn't opened this screen before, so it isn't saved. The ones you've already visited still open without a signal, and your changes go up as soon as you're back online.",
  },

  meta: {
    descripcion: "Track your routines, weights, and reps from your phone.",
  },
};
