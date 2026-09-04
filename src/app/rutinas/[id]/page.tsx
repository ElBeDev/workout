import { db } from "@/db";
import { routines, routineExercises, exercises } from "@/db/schema";
import { exerciseGif } from "@/db/exercise-gif";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ChevronUp, ChevronDown, Play, Trash2 } from "lucide-react";
import { bodyPartLabel } from "@/lib/body-parts";
import { requireUserId } from "@/lib/session";
import { blobConfigured } from "@/lib/blob";
import { Card, PageHeader, PrimaryButton, SectionTitle } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { ExerciseInfoSheet } from "@/components/ExerciseInfoSheet";
import { AddExerciseForm } from "./AddExerciseForm";
import { RoutineSettings } from "./RoutineSettings";
import { ExerciseTargetsEditor } from "./ExerciseTargetsEditor";
import { removeRoutineExercise, moveRoutineExercise } from "./actions";
import { startSession } from "../../entrenar/actions";

export const dynamic = "force-dynamic";

export default async function RutinaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const userId = await requireUserId();

  const [routine] = await db.select().from(routines).where(eq(routines.id, id));
  if (!routine || routine.userId !== userId) notFound();

  const items = await db
    .select({
      id: routineExercises.id,
      targetSets: routineExercises.targetSets,
      targetReps: routineExercises.targetReps,
      targetWeight: routineExercises.targetWeight,
      restSeconds: routineExercises.restSeconds,
      exerciseName: exercises.name,
      exerciseNameEs: exercises.nameEs,
      gifUrl: exerciseGif,
      bodyPart: exercises.bodyPart,
      equipment: exercises.equipment,
      instructions: exercises.instructions,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(eq(routineExercises.routineId, id))
    .orderBy(routineExercises.sortOrder);

  const totalSets = items.reduce((sum, i) => sum + i.targetSets, 0);
  const muscleGroups = new Set(items.map((i) => i.bodyPart).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={routine.name} backHref="/rutinas" />

      {error === "open-session" && (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-[13px] font-medium text-danger">
          Tienes un entrenamiento en curso con esta rutina. Termínalo o descártalo desde Hoy antes de eliminarla.
        </p>
      )}

      <div className="rounded-[1.5rem] bg-accent p-5 text-accent-foreground">
        <div className="grid grid-cols-3 divide-x divide-black/10 dark:divide-white/15">
          <Stat value={items.length} label="Ejercicios" />
          <Stat value={totalSets} label="Series" />
          <Stat value={muscleGroups} label="Músculos" />
        </div>
      </div>

      {items.length > 0 && (
        <form action={startSession.bind(null, routine.id)}>
          <PrimaryButton type="submit">
            <Play className="h-4 w-4" fill="currentColor" />
            Empezar entrenamiento
          </PrimaryButton>
        </form>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle>Ejercicios</SectionTitle>
        {items.length === 0 ? (
          <p className="text-sm text-muted">
            Esta rutina todavía no tiene ejercicios. Agrega el primero abajo.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item, index) => (
              <li key={item.id}>
                <Card className="flex items-center gap-3 p-3">
                  <ExerciseInfoSheet
                    exercise={{
                      name: item.exerciseName,
                      nameEs: item.exerciseNameEs,
                      gifUrl: item.gifUrl,
                      bodyPart: item.bodyPart,
                      equipment: item.equipment,
                      instructions: item.instructions,
                    }}
                    className="h-18 w-18 shrink-0 overflow-hidden rounded-2xl"
                  >
                    <ExerciseThumb
                      src={item.gifUrl}
                      alt={item.exerciseNameEs ?? item.exerciseName}
                      className="h-full w-full"
                    />
                  </ExerciseInfoSheet>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold capitalize">
                      {item.exerciseNameEs ?? item.exerciseName}
                    </p>
                    <ExerciseTargetsEditor
                      routineId={routine.id}
                      routineExerciseId={item.id}
                      targetSets={item.targetSets}
                      targetReps={item.targetReps}
                      targetWeight={item.targetWeight}
                      restSeconds={item.restSeconds}
                    />
                    <p className="mt-0.5 text-[12px] text-muted/80">
                      {bodyPartLabel(item.bodyPart)}
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <form action={moveRoutineExercise.bind(null, routine.id, item.id, "up")}>
                      <button
                        type="submit"
                        disabled={index === 0}
                        className="flex h-7 w-8 items-center justify-center text-muted disabled:opacity-25"
                        aria-label="Subir"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    </form>
                    <form action={moveRoutineExercise.bind(null, routine.id, item.id, "down")}>
                      <button
                        type="submit"
                        disabled={index === items.length - 1}
                        className="flex h-7 w-8 items-center justify-center text-muted disabled:opacity-25"
                        aria-label="Bajar"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                  <form action={removeRoutineExercise.bind(null, routine.id, item.id)}>
                    <button
                      type="submit"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-2 text-muted"
                      aria-label="Quitar ejercicio"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card className="p-4">
        <AddExerciseForm routineId={routine.id} photoEnabled={blobConfigured()} />
      </Card>

      <RoutineSettings routineId={routine.id} name={routine.name} days={routine.days ?? []} />
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[26px] font-bold leading-none tabular-nums">{value}</span>
      <span className="mt-1 text-[12px] opacity-70">{label}</span>
    </div>
  );
}
