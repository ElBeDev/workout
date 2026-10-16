import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { coachClients, coaches, users } from "@/db/schema";

/**
 * Quién puede ver y tocar qué (docs/coaches.md §2.2). Es el único lugar que
 * decide permisos entre personas: las páginas, las server actions y, más
 * adelante, la API de la app nativa preguntan aquí. No lee cookies ni
 * redirige; recibe a quién lo pide.
 */

export type Actor = { id: string; role: "member" | "coach"; isAdmin: boolean };

export async function getActor(userId: string): Promise<Actor | null> {
  const [row] = await db
    .select({ id: users.id, role: users.role, isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId));
  if (!row) return null;
  return { id: row.id, role: row.role === "coach" ? "coach" : "member", isAdmin: row.isAdmin };
}

/** Es coach de verdad: tiene el rol y su fila en `coaches`. */
export async function esCoach(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: coaches.userId })
    .from(coaches)
    .innerJoin(users, eq(users.id, coaches.userId))
    .where(and(eq(coaches.userId, userId), eq(users.role, "coach")));
  return Boolean(row);
}

/** El coach activo de un alumno, si tiene. */
export async function coachActivoDe(clientId: string): Promise<string | null> {
  const [row] = await db
    .select({ coachId: coachClients.coachId })
    .from(coachClients)
    .where(and(eq(coachClients.clientId, clientId), eq(coachClients.status, "active")));
  return row?.coachId ?? null;
}

/** Los alumnos activos de un coach. */
export async function alumnosDe(coachId: string): Promise<string[]> {
  const rows = await db
    .select({ clientId: coachClients.clientId })
    .from(coachClients)
    .where(and(eq(coachClients.coachId, coachId), eq(coachClients.status, "active")));
  return rows.map((r) => r.clientId);
}

/** `coachId` es hoy el coach activo de `clientId`. */
export async function esCoachDe(coachId: string, clientId: string): Promise<boolean> {
  if (coachId === clientId) return false;
  return (await coachActivoDe(clientId)) === coachId;
}

/**
 * Ver los datos de entrenamiento de alguien (ficha, sesiones, rutinas): uno
 * mismo o su coach activo. Nadie más, ni el dueño de la plataforma: los datos
 * son del alumno y sólo su coach los ve mientras estén ligados.
 */
export async function puedeVerSocio(viewerId: string, socioId: string): Promise<boolean> {
  return viewerId === socioId || esCoachDe(viewerId, socioId);
}

/** Editar las rutinas de alguien: las mismas reglas que verlo. */
export function puedeEditarRutinasDe(viewerId: string, ownerId: string): Promise<boolean> {
  return puedeVerSocio(viewerId, ownerId);
}
