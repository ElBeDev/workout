import { put } from "@vercel/blob";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { exercises } from "@/db/schema";

export function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Copies an exercise's gif from ExerciseDB into our Blob store and saves
 * the URL. Best-effort: returns null (and leaves the row untouched) when
 * Blob isn't configured or the download fails.
 */
export async function mirrorExerciseGif(exerciseId: string): Promise<string | null> {
  if (!blobConfigured()) return null;

  const [row] = await db
    .select({ gifUrl: exercises.gifUrl, gifBlobUrl: exercises.gifBlobUrl, externalId: exercises.externalId })
    .from(exercises)
    .where(eq(exercises.id, exerciseId));
  if (!row?.gifUrl || row.gifBlobUrl) return row?.gifBlobUrl ?? null;

  try {
    const res = await fetch(row.gifUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const bytes = await res.arrayBuffer();
    const name = `exercises/${row.externalId ?? exerciseId}.gif`;
    const blob = await put(name, bytes, {
      access: "public",
      contentType: res.headers.get("content-type") ?? "image/gif",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    await db.update(exercises).set({ gifBlobUrl: blob.url }).where(eq(exercises.id, exerciseId));
    return blob.url;
  } catch {
    return null;
  }
}

/** Exercises this user uses (in a routine or logged) whose gif has no Blob copy yet. */
export async function pendingGifIds(userId: string): Promise<string[]> {
  const rows = await db.execute<{ id: string }>(sql`
    select e.id from exercises e
    where e.gif_blob_url is null and e.gif_url is not null and (
      exists (select 1 from routine_exercises re join routines r on r.id = re.routine_id
              where re.exercise_id = e.id and r.user_id = ${userId})
      or exists (select 1 from set_logs sl join workout_sessions ws on ws.id = sl.session_id
              where sl.exercise_id = e.id and ws.user_id = ${userId})
    )`);
  return rows.rows.map((r) => r.id);
}

/** Uploads a user photo for a custom exercise. Returns null when Blob isn't configured. */
export async function uploadExercisePhoto(userId: string, file: File): Promise<string | null> {
  if (!blobConfigured() || file.size === 0) return null;
  // Vercel limits server-side uploads to 4.5 MB (client uploads would be needed beyond that).
  if (file.size > 4.5 * 1024 * 1024) throw new Error("La foto pesa más de 4.5 MB; bájale la resolución.");
  if (!/^image\/(jpeg|png|webp|gif|heic|heif)$/.test(file.type)) {
    throw new Error("Solo se aceptan imágenes (JPG, PNG, WebP, GIF, HEIC).");
  }
  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const blob = await put(`custom/${userId}/${crypto.randomUUID()}.${ext}`, file, {
    access: "public",
    contentType: file.type || "image/jpeg",
  });
  return blob.url;
}
