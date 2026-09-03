import { db } from "@/db";
import { routines, routineExercises, exercises } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AddExerciseForm } from "./AddExerciseForm";
import { removeRoutineExercise } from "./actions";
import { startSession } from "../../entrenar/actions";

export default async function RutinaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [routine] = await db.select().from(routines).where(eq(routines.id, id));
  if (!routine) notFound();

  const items = await db
    .select({
      id: routineExercises.id,
      targetSets: routineExercises.targetSets,
      targetReps: routineExercises.targetReps,
      targetWeight: routineExercises.targetWeight,
      exerciseName: exercises.name,
      gifUrl: exercises.gifUrl,
      bodyPart: exercises.bodyPart,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(eq(routineExercises.routineId, id))
    .orderBy(routineExercises.sortOrder);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-2">
        <Link href="/rutinas" className="text-black/40 dark:text-white/40">
          ‹
        </Link>
        <h1 className="text-2xl font-bold">{routine.name}</h1>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          Esta rutina todavía no tiene ejercicios.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-black/10 p-3 dark:border-white/10"
            >
              {item.gifUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.gifUrl}
                  alt={item.exerciseName}
                  className="h-14 w-14 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium capitalize">{item.exerciseName}</p>
                <p className="text-xs text-black/50 dark:text-white/50">
                  {item.targetSets} series × {item.targetReps} reps
                  {item.targetWeight ? ` · ${item.targetWeight} kg` : ""}
                </p>
              </div>
              <form action={removeRoutineExercise.bind(null, routine.id, item.id)}>
                <button
                  type="submit"
                  className="text-xs text-red-500"
                  aria-label="Quitar ejercicio"
                >
                  Quitar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <form action={startSession.bind(null, routine.id)}>
          <button
            type="submit"
            className="w-full rounded-full bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white"
          >
            Empezar entrenamiento
          </button>
        </form>
      )}

      <AddExerciseForm routineId={routine.id} />
    </div>
  );
}
