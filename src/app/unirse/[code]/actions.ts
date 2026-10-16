"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { guardarInvitacion } from "@/lib/invitacion";
import { mandarAvisos } from "@/lib/avisos";
import { normalizarCodigo } from "@/server/coaches";
import { ligarConCodigo } from "@/server/vinculos";

/** Sin sesión: guarda el código y manda a crear cuenta o a entrar (docs/coaches.md §4.5). */
export async function irConInvitacion(code: string, destino: "registro" | "login") {
  await guardarInvitacion(normalizarCodigo(code));
  redirect(destino === "registro" ? "/registro" : "/login");
}

/** Con sesión: unirse al coach de la liga; `cambiar` si ya tenía otro y lo confirmó. */
export async function unirmeDesdeLiga(code: string, cambiar: boolean) {
  const userId = await requireUserId();
  const r = await ligarConCodigo(userId, code, { cambiar, source: "link" });
  mandarAvisos(r.avisos);
  if (!r.ok) redirect(`/unirse/${encodeURIComponent(code)}?error=${r.error}`);
  revalidatePath("/", "layout");
  redirect("/perfil?coach=unido");
}
