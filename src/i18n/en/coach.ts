import type { coach as Es } from "../es/coach";

/** Coach comments: what the member sees and what the coach writes. */
export const coach: typeof Es = {
  // Lo que ve el socio
  deTuCoach: "From your coach",
  tuCoach: "Your coach",
  sobreSesion: (rutina: string, fecha: string) => `About ${rutina} · ${fecha}`,
  entendido: "Got it",
  comentariosSesion: "Coach comments",

  // Notificación push
  avisoTitulo: "Tu coach te escribió",

  // Lo que ve el coach
  comentarios: "Comments",
  escribir: "Write a comment…",
  escribirSesion: "Comment on this session…",
  enviar: "Send",
  borrar: "Delete comment",
  leido: "Read",
  sinLeer: "Unread",
  sinComentarios: "You haven't written to them yet.",
  avisoPush: "They also get it as a notification if they turned them on.",
};
