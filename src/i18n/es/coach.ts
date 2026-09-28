/** Comentarios del coach: lo que ve el socio y lo que escribe el coach. */
export const coach = {
  // Lo que ve el socio
  deTuCoach: "De tu coach",
  tuCoach: "Tu coach",
  sobreSesion: (rutina: string, fecha: string) => `Sobre ${rutina} · ${fecha}`,
  entendido: "Entendido",
  comentariosSesion: "Comentarios del coach",

  // Notificación push (la manda el servidor; va en español, como el
  // recordatorio, porque el idioma vive en una cookie del teléfono)
  avisoTitulo: "Tu coach te escribió",

  // Lo que ve el coach
  comentarios: "Comentarios",
  escribir: "Escribe un comentario…",
  escribirSesion: "Comenta esta sesión…",
  enviar: "Enviar",
  borrar: "Borrar comentario",
  leido: "Leído",
  sinLeer: "Sin leer",
  sinComentarios: "Todavía no le has escrito.",
  avisoPush: "Le llega también como notificación si la tiene activada.",
};
