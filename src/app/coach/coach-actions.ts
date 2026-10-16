"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { coachComments, workoutSessions } from "@/db/schema";
import { requireCoach, requireCoachDe } from "@/lib/coach";
import { enviarAviso } from "@/lib/push";
import { DICCIONARIOS } from "@/i18n/dicts";

const MAX_COMMENT = 1000;

/**
 * El coach le escribe a un socio, suelto o sobre una de sus sesiones. El aviso
 * push sale después de responder (`after`): no tiene por qué esperar a que
 * contesten los servidores de push, y si falla el comentario ya quedó.
 */
export async function addCoachComment(
  targetUserId: string,
  sessionId: string | null,
  formData: FormData
) {
  const authorId = await requireCoachDe(targetUserId);
  const body = String(formData.get("body") ?? "").trim().slice(0, MAX_COMMENT);
  if (!body) return;

  if (sessionId) {
    const [session] = await db
      .select({ id: workoutSessions.id })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, targetUserId)));
    if (!session) return;
  }

  await db.insert(coachComments).values({ userId: targetUserId, authorId, sessionId, body });

  const url = sessionId ? `/progreso/sesion/${sessionId}` : "/";
  after(async () => {
    try {
      await enviarAviso(targetUserId, {
        titulo: DICCIONARIOS.es.coach.avisoTitulo,
        cuerpo: body.length > 140 ? `${body.slice(0, 139)}…` : body,
        url,
      });
    } catch {
      // Best-effort: el comentario ya está guardado y se ve en Hoy.
    }
  });

  revalidatePath(`/coach/usuarios/${targetUserId}`);
  if (sessionId) revalidatePath(`/coach/usuarios/${targetUserId}/sesion/${sessionId}`);
}

/** Cada coach borra sólo lo que él escribió. */
export async function deleteCoachComment(commentId: string) {
  const authorId = await requireCoach();
  const [deleted] = await db
    .delete(coachComments)
    .where(and(eq(coachComments.id, commentId), eq(coachComments.authorId, authorId)))
    .returning({ userId: coachComments.userId, sessionId: coachComments.sessionId });
  if (!deleted) return;
  revalidatePath(`/coach/usuarios/${deleted.userId}`);
  if (deleted.sessionId) {
    revalidatePath(`/coach/usuarios/${deleted.userId}/sesion/${deleted.sessionId}`);
  }
}
