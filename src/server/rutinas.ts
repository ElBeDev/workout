import { eq } from "drizzle-orm";
import { db } from "@/db";
import { routineExercises, routines, swimBlocks } from "@/db/schema";
import { esCoachDe, puedeEditarRutinasDe } from "@/server/acceso";

/**
 * Copiar una rutina a varios alumnos (docs/coaches.md §4.5): el coach la arma
 * una vez y la reparte. Cada copia es una rutina nueva del alumno, con el
 * mismo nombre, días y contenido, marcada como "De tu coach" (`created_by`).
 * Nunca pisa una rutina existente. Devuelve a cuántos se copió: los destinos
 * que no son alumnos activos del coach se ignoran.
 */
export async function copiarRutinaAAlumnos(
  coachId: string,
  routineId: string,
  destinos: string[]
): Promise<{ ok: true; copiadas: number } | { ok: false; error: "no_existe" }> {
  const [source] = await db.select().from(routines).where(eq(routines.id, routineId));
  if (!source || !(await puedeEditarRutinasDe(coachId, source.userId))) return { ok: false, error: "no_existe" };

  const validos: string[] = [];
  for (const id of new Set(destinos)) {
    if (id !== source.userId && (await esCoachDe(coachId, id))) validos.push(id);
  }
  if (validos.length === 0) return { ok: true, copiadas: 0 };

  const [blocks, items] = await Promise.all([
    source.kind === "natacion" ? db.select().from(swimBlocks).where(eq(swimBlocks.routineId, routineId)) : [],
    source.kind === "natacion" ? [] : db.select().from(routineExercises).where(eq(routineExercises.routineId, routineId)),
  ]);

  for (const userId of validos) {
    const [copy] = await db
      .insert(routines)
      .values({ userId, name: source.name, days: source.days ?? [], kind: source.kind, createdBy: coachId })
      .returning({ id: routines.id });
    if (blocks.length) {
      await db.insert(swimBlocks).values(
        blocks.map((b) => ({
          routineId: copy.id,
          sortOrder: b.sortOrder,
          label: b.label,
          stroke: b.stroke,
          reps: b.reps,
          distanceMeters: b.distanceMeters,
          restSeconds: b.restSeconds,
          notes: b.notes,
        }))
      );
    }
    if (items.length) {
      await db.insert(routineExercises).values(
        items.map((i) => ({
          routineId: copy.id,
          exerciseId: i.exerciseId,
          sortOrder: i.sortOrder,
          targetSets: i.targetSets,
          targetReps: i.targetReps,
          targetWeight: i.targetWeight,
          loadUnit: i.loadUnit,
        }))
      );
    }
  }
  return { ok: true, copiadas: validos.length };
}
