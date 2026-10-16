"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/coach";
import { copiarRutinaAAlumnos } from "@/server/rutinas";

export async function copiarRutina(routineId: string, formData: FormData) {
  const coachId = await requireCoach();
  const destinos = formData.getAll("clientId").map(String);
  if (destinos.length === 0) redirect(`/coach/copiar/${routineId}?error=ninguno`);
  const r = await copiarRutinaAAlumnos(coachId, routineId, destinos);
  if (!r.ok) redirect("/coach");
  revalidatePath("/coach");
  redirect(`/coach/copiar/${routineId}?ok=${r.copiadas}`);
}
