import { notFound, redirect } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { esCoach, esCoachDe, getActor } from "@/server/acceso";

/**
 * Guardias de la web para el panel del coach y el del dueño. Las reglas viven
 * en `src/server/acceso.ts`; esto sólo decide a dónde mandar a quien no pasa.
 */

/** Manda a Hoy a quien no es coach. Devuelve el id del coach. */
export async function requireCoach(): Promise<string> {
  const userId = await requireUserId();
  if (!(await esCoach(userId))) redirect("/");
  return userId;
}

/**
 * Coach y además coach activo de `socioId`. Si no lo es, 404: no se le dice
 * que esa persona existe.
 */
export async function requireCoachDe(socioId: string): Promise<string> {
  const coachId = await requireCoach();
  if (!(await esCoachDe(coachId, socioId))) notFound();
  return coachId;
}

/** El dueño de la plataforma (`users.is_admin`), para `/admin`. */
export async function requireOwner(): Promise<string> {
  const userId = await requireUserId();
  const actor = await getActor(userId);
  if (!actor?.isAdmin) redirect("/");
  return userId;
}
