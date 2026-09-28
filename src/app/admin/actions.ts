"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, isNotNull, sql } from "drizzle-orm";
import { put } from "@vercel/blob";
import { db } from "@/db";
import { routines, users, exercises, challenges } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { isMetric } from "@/db/gym";
import { pendingGifIds } from "@/lib/blob";

export async function createRoutineForUser(targetUserId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, targetUserId));
  if (!target) redirect("/admin");

  const [routine] = await db
    .insert(routines)
    .values({ userId: targetUserId, name })
    .returning({ id: routines.id });

  revalidatePath(`/admin/usuarios/${targetUserId}`);
  redirect(`/rutinas/${routine.id}`);
}

/**
 * Crea un reto del gimnasio. Las fechas llegan de `<input type="date">` como
 * YYYY-MM-DD y se guardan tal cual: son días locales (hora de México), y los
 * bordes en UTC se calculan al leer (`localDayStart`).
 */
export async function createChallenge(formData: FormData) {
  const createdBy = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const metric = String(formData.get("metric") ?? "");
  const startsOn = String(formData.get("startsOn") ?? "");
  const endsOn = String(formData.get("endsOn") ?? "");
  const goalRaw = String(formData.get("goal") ?? "").trim();
  const goal = goalRaw ? Math.round(Number(goalRaw)) : null;

  const ymd = /^\d{4}-\d{2}-\d{2}$/;
  if (!title || !isMetric(metric) || !ymd.test(startsOn) || !ymd.test(endsOn)) return;
  if (endsOn < startsOn) redirect("/admin/retos?error=fechas");
  if (goal !== null && (!Number.isFinite(goal) || goal <= 0 || goal > 100_000_000)) return;

  await db.insert(challenges).values({ title, metric, goal, startsOn, endsOn, createdBy });
  revalidatePath("/admin/retos");
  revalidatePath("/retos");
  redirect("/admin/retos");
}

export async function deleteChallenge(challengeId: string) {
  await requireAdmin();
  await db.delete(challenges).where(eq(challenges.id, challengeId));
  revalidatePath("/admin/retos");
  revalidatePath("/retos");
}

/**
 * Por qué no hay copias de los gifs. `mirrorExerciseGif` se traga los errores
 * a propósito (es best-effort y no debe tumbar el alta de un ejercicio), y eso
 * hizo que el espejado llevara semanas sin funcionar sin que nadie lo notara.
 * Esto prueba las tres piezas por separado y dice cuál falla.
 */
export async function diagnoseBlob(): Promise<{
  token: boolean;
  acceso: string;
  claves: string;
  download: string;
  upload: string;
  copias: number;
  pendientes: number;
}> {
  await requireAdmin();

  const token = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  // Acceso estático vs. dinámico: si el estático viene vacío y el dinámico no,
  // es que el valor se fijó en el bundle durante el build (cuando la variable
  // todavía no existía) y el runtime real sí la tiene. Solo longitudes.
  const nombre = ["BLOB", "READ", "WRITE", "TOKEN"].join("_");
  const estatico = (process.env.BLOB_READ_WRITE_TOKEN ?? "").length;
  const dinamico = (process.env[nombre] ?? "").length;
  // Solo nombres, nunca valores: sirve para saber si el runtime ve las
  // variables del store de Blob o ninguna.
  const claves =
    Object.keys(process.env)
      .filter((k) => k.includes("BLOB"))
      .sort()
      .join(", ") || "ninguna con BLOB en el nombre";

  const [sample] = await db
    .select({ gifUrl: exercises.gifUrl })
    .from(exercises)
    .where(isNotNull(exercises.gifUrl))
    .limit(1);

  let download = "sin gif de muestra en el catálogo";
  if (sample?.gifUrl) {
    try {
      const res = await fetch(sample.gifUrl, { signal: AbortSignal.timeout(8000) });
      const bytes = res.ok ? (await res.arrayBuffer()).byteLength : 0;
      download = res.ok ? `ok (${Math.round(bytes / 1024)} kB)` : `HTTP ${res.status}`;
    } catch (err) {
      download = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    }
  }

  let upload = "no se intentó (falta el token)";
  if (dinamico > 0) {
    try {
      const blob = await put("diagnostics/ping.txt", `ok ${new Date().toISOString()}`, {
        access: "public",
        contentType: "text/plain",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      upload = `ok (${blob.url})`;
    } catch (err) {
      upload = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    }
  }

  const [{ copias }] = await db
    .select({ copias: sql<number>`count(*)::int` })
    .from(exercises)
    .where(isNotNull(exercises.gifBlobUrl));

  const pendientes = (await pendingGifIds(await requireAdmin())).length;

  return {
    token,
    acceso: `estático ${estatico} car. · dinámico ${dinamico} car.`,
    claves,
    download,
    upload,
    copias,
    pendientes,
  };
}
