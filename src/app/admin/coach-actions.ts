"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { coachComments, users, workoutSessions } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
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
  const authorId = await requireAdmin();
  const body = String(formData.get("body") ?? "").trim().slice(0, MAX_COMMENT);
  if (!body) return;

  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, targetUserId));
  if (!target) return;
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

  revalidatePath(`/admin/usuarios/${targetUserId}`);
  if (sessionId) revalidatePath(`/admin/usuarios/${targetUserId}/sesion/${sessionId}`);
}

export async function deleteCoachComment(commentId: string) {
  await requireAdmin();
  const [deleted] = await db
    .delete(coachComments)
    .where(eq(coachComments.id, commentId))
    .returning({ userId: coachComments.userId, sessionId: coachComments.sessionId });
  if (!deleted) return;
  revalidatePath(`/admin/usuarios/${deleted.userId}`);
  if (deleted.sessionId) {
    revalidatePath(`/admin/usuarios/${deleted.userId}/sesion/${deleted.sessionId}`);
  }
}
