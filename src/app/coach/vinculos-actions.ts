"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCoach, requireCoachDe } from "@/lib/coach";
import { mandarAvisos } from "@/lib/avisos";
import { responderSolicitud, terminarVinculo } from "@/server/vinculos";

/** Aceptar o rechazar a quien pidió unirse (docs/coaches.md §4.3). */
export async function responder(vinculoId: string, aceptar: boolean) {
  const coachId = await requireCoach();
  const r = await responderSolicitud(coachId, vinculoId, aceptar);
  if (r.ok) mandarAvisos(r.avisos);
  revalidatePath("/coach");
  if (!r.ok && r.error === "sin_cupo") redirect("/coach?error=sin_cupo");
}

/** Quitar a un alumno del grupo: deja de verlo; el alumno conserva todo (§4.4). */
export async function quitarAlumno(clientId: string) {
  const coachId = await requireCoachDe(clientId);
  const r = await terminarVinculo(coachId, { clientId, coachId });
  mandarAvisos(r.avisos);
  revalidatePath("/coach");
  redirect("/coach");
}
