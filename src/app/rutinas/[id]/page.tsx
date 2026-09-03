import { db } from "@/db";
import { routines, routineExercises, exercises } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronUp, ChevronDown, Play, Trash2 } from "lucide-react";
import { bodyPartLabel } from "@/lib/body-parts";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { AddExerciseForm } from "./AddExerciseForm";
import { removeRoutineExercise, moveRoutineExercise } from "./actions";
import { startSession } from "../../entrenar/actions";

export const dynamic = "force-dynamic";

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
        <Link
          href="/rutinas"
          className="flex h-8 w-8 items-center justify-center rounded-full text-black/40 dark:text-white/40"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{routine.name}</h1>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">
          Esta rutina todavía no tiene ejercicios.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-2xl border border-black/10 bg-surface p-2.5 shadow-sm dark:border-white/10"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <ExerciseThumb
                  src={item.gifUrl}
                  alt={item.exerciseName}
                  className="h-full w-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold capitalize">
                  {item.exerciseName}
                </p>
                <p className="text-xs text-black/50 dark:text-white/50">
                  {item.targetSets} series × {item.targetReps} reps
                  {item.targetWeight ? ` · ${item.targetWeight} kg` : ""}
                </p>
                <p className="text-[11px] text-black/35 dark:text-white/35">
                  {bodyPartLabel(item.bodyPart)}
                </p>
              </div>
              <div className="flex flex-col">
                <form
                  action={moveRoutineExercise.bind(null, routine.id, item.id, "up")}
                >
                  <button
                    type="submit"
                    disabled={index === 0}
                    className="flex h-6 w-7 items-center justify-center text-black/30 disabled:opacity-20 dark:text-white/30"
                    aria-label="Subir"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </form>
                <form
                  action={moveRoutineExercise.bind(null, routine.id, item.id, "down")}
                >
                  <button
                    type="submit"
                    disabled={index === items.length - 1}
                    className="flex h-6 w-7 items-center justify-center text-black/30 disabled:opacity-20 dark:text-white/30"
                    aria-label="Bajar"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </form>
              </div>
              <form action={removeRoutineExercise.bind(null, routine.id, item.id)}>
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-black/30 hover:text-red-500 dark:text-white/30"
                  aria-label="Quitar ejercicio"
                >
                  <Trash2 className="h-4 w-4" />
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
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3.5 text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
          >
            <Play className="h-4 w-4" fill="currentColor" />
            Empezar entrenamiento
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-black/10 bg-surface p-3 shadow-sm dark:border-white/10">
        <AddExerciseForm routineId={routine.id} />
      </div>
    </div>
  );
}
