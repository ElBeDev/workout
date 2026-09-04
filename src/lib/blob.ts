import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
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
    const res = await fetch(row.gifUrl);
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

/** Uploads a user photo for a custom exercise. Returns null when Blob isn't configured. */
export async function uploadExercisePhoto(userId: string, file: File): Promise<string | null> {
  if (!blobConfigured() || file.size === 0) return null;
  if (file.size > 8 * 1024 * 1024) throw new Error("La foto pesa más de 8 MB.");
  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const blob = await put(`custom/${userId}/${crypto.randomUUID()}.${ext}`, file, {
    access: "public",
    contentType: file.type || "image/jpeg",
  });
  return blob.url;
}
