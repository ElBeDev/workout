"use server";

import { db } from "@/db";
import { exercises } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { uploadExercisePhoto } from "@/lib/blob";
import { BODY_PARTS } from "@/lib/body-parts";

export type CreatedExercise = {
  id: string;
  name: string;
  nameEs: string | null;
  bodyPart: string | null;
  equipment: string | null;
  gifUrl: string | null;
  instructions: string | null;
  isCustom: boolean;
};

export async function createCustomExercise(
  formData: FormData
): Promise<{ ok: true; exercise: CreatedExercise } | { ok: false; error: string }> {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  const bodyPart = String(formData.get("bodyPart") ?? "").trim();
  const equipment = String(formData.get("equipment") ?? "").trim() || null;
  const instructions = String(formData.get("instructions") ?? "").trim() || null;
  const photo = formData.get("photo");

  if (name.length < 2) return { ok: false, error: "Ponle un nombre al ejercicio." };
  if (!BODY_PARTS.some((b) => b.value === bodyPart)) {
    return { ok: false, error: "Elige el grupo muscular." };
  }

  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await uploadExercisePhoto(userId, photo);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "No se pudo subir la foto." };
    }
  }

  const [created] = await db
    .insert(exercises)
    .values({
      name: name.toLowerCase(),
      nameEs: name,
      bodyPart,
      equipment,
      instructions,
      gifUrl: null,
      gifBlobUrl: photoUrl,
      userId,
      isCustom: true,
    })
    .returning({
      id: exercises.id,
      name: exercises.name,
      nameEs: exercises.nameEs,
      bodyPart: exercises.bodyPart,
      equipment: exercises.equipment,
      gifBlobUrl: exercises.gifBlobUrl,
      instructions: exercises.instructions,
      isCustom: exercises.isCustom,
    });

  return {
    ok: true,
    exercise: { ...created, gifUrl: created.gifBlobUrl },
  };
}
