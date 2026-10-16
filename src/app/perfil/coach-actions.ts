"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { mandarAvisos } from "@/lib/avisos";
import { normalizarCodigo } from "@/server/coaches";
import { cancelarSolicitud, ligarConCodigo, solicitarCoach, terminarVinculo } from "@/server/vinculos";

/** Perfil → Mi coach (docs/coaches.md §4.3). Los errores vuelven a la sección. */
function volver(params: string): never {
  revalidatePath("/", "layout");
  redirect(`/perfil?${params}#mi-coach`);
}

export async function unirmeConCodigo(formData: FormData) {
  const userId = await requireUserId();
  const code = normalizarCodigo(String(formData.get("code") ?? ""));
  const r = await ligarConCodigo(userId, code, { source: "code" });
  mandarAvisos(r.avisos);
  // Ya tiene coach: la liga es la que pregunta si lo cambia.
  if (!r.ok && r.error === "tiene_otro") redirect(`/unirse/${encodeURIComponent(code)}`);
  if (!r.ok) volver(`coachError=${r.error}`);
  volver("coach=unido");
}

export async function pedirUnirme(formData: FormData) {
  const userId = await requireUserId();
  const r = await solicitarCoach(userId, String(formData.get("username") ?? ""));
  if (!r.ok) volver(`coachError=${r.error}`);
  mandarAvisos(r.avisos);
  volver("coach=enviada");
}

export async function cancelarMiSolicitud() {
  const userId = await requireUserId();
  await cancelarSolicitud(userId);
  volver("");
}

export async function dejarMiCoach() {
  const userId = await requireUserId();
  const r = await terminarVinculo(userId, { clientId: userId });
  mandarAvisos(r.avisos);
  volver("");
}
