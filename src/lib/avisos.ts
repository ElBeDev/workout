import { after } from "next/server";
import { enviarAviso } from "@/lib/push";
import type { Aviso } from "@/server/vinculos";

/**
 * Manda los avisos push que devolvió un servicio, después de responder: no
 * tiene por qué esperar a los servidores de push, y si fallan lo importante
 * ya quedó guardado. Sólo desde una server action o un route handler.
 */
export function mandarAvisos(avisos: Aviso[]) {
  if (avisos.length === 0) return;
  after(async () => {
    for (const a of avisos) {
      try {
        await enviarAviso(a.para, { titulo: a.titulo, cuerpo: a.cuerpo, url: a.url });
      } catch {
        // Best-effort, como los comentarios del coach.
      }
    }
  });
}
