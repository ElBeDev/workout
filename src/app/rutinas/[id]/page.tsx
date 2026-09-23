import { db } from "@/db";
import { routines, routineExercises, exercises, users } from "@/db/schema";
import { exerciseGif } from "@/db/exercise-gif";
import { exerciseInstructions } from "@/db/exercise-instructions";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Play, ShieldCheck } from "lucide-react";
import { requireUserId } from "@/lib/session";
import { isAdminUser } from "@/lib/admin";
import { normalizeLoadUnit } from "@/lib/suggest";
import { blobConfigured } from "@/lib/blob";
import { getDict } from "@/i18n";
import { Card, GroupedList, PageHeader, PrimaryButton, SectionTitle } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { ExerciseInfoSheet } from "@/components/ExerciseInfoSheet";
import { AddExerciseSheet } from "./AddExerciseSheet";
import { RoutineSettings } from "./RoutineSettings";
import { ExerciseRowMenu } from "./ExerciseRowMenu";
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
  const t = await getDict();

  const [routine] = await db.select().from(routines).where(eq(routines.id, id));
  if (!routine) notFound();

  const isOwner = routine.userId === userId;
  if (!isOwner && !(await isAdminUser(userId))) notFound();

  let ownerName: string | null = null;
  if (!isOwner) {
    const [owner] = await db.select({ username: users.username }).from(users).where(eq(users.id, routine.userId));
    ownerName = owner?.username ?? null;
  }

  const items = await db
    .select({
      id: routineExercises.id,
      targetSets: routineExercises.targetSets,
      targetReps: routineExercises.targetReps,
      targetWeight: routineExercises.targetWeight,
      loadUnit: routineExercises.loadUnit,
      exerciseName: exercises.name,
      exerciseNameEs: exercises.nameEs,
      gifUrl: exerciseGif,
      bodyPart: exercises.bodyPart,
      equipment: exercises.equipment,
      instructions: exerciseInstructions,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(eq(routineExercises.routineId, id))
    .orderBy(routineExercises.sortOrder);

  const totalSets = items.reduce((sum, i) => sum + i.targetSets, 0);
  const muscleGroups = new Set(items.map((i) => i.bodyPart).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={routine.name}
        backHref={isOwner ? "/rutinas" : `/admin/usuarios/${routine.userId}`}
      />

      {!isOwner && (
        <p className="flex items-center gap-2 rounded-xl bg-accent/12 px-4 py-3 text-[14px] font-semibold text-accent">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          {t.rutinas.detalle.editandoComoAdmin(
            ownerName
              ? ownerName.charAt(0).toUpperCase() + ownerName.slice(1)
              : t.rutinas.detalle.otroUsuario,
          )}
        </p>
      )}

      {error === "open-session" && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-[14px] font-semibold text-danger">
          {t.rutinas.detalle.sesionAbierta}
        </p>
      )}

      <Card hero className="grid grid-cols-3 divide-x divide-border p-4">
        <Stat value={items.length} label={t.rutinas.detalle.ejercicios} tone="text-days" />
        <Stat value={totalSets} label={t.rutinas.detalle.series} tone="text-sets" />
        <Stat value={muscleGroups} label={t.rutinas.detalle.musculos} tone="text-load" />
      </Card>

      {isOwner && items.length > 0 && (
        <form action={startSession.bind(null, routine.id)}>
          <PrimaryButton type="submit" tone="accent">
            <Play className="h-4 w-4" fill="currentColor" />
            {t.rutinas.detalle.empezar}
          </PrimaryButton>
        </form>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle>{t.rutinas.detalle.ejercicios}</SectionTitle>
        {items.length === 0 ? (
          <p className="text-sm text-muted">{t.rutinas.detalle.sinEjercicios}</p>
        ) : (
          <GroupedList>
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 p-3">
                <ExerciseInfoSheet
                  exercise={{
                    name: item.exerciseName,
                    nameEs: item.exerciseNameEs,
                    gifUrl: item.gifUrl,
                    bodyPart: item.bodyPart,
                    equipment: item.equipment,
                    instructions: item.instructions,
                  }}
                  className="h-12 w-12 shrink-0 overflow-hidden rounded-[0.7rem]"
                >
                  <ExerciseThumb
                    src={item.gifUrl}
                    alt={item.exerciseNameEs ?? item.exerciseName}
                    className="h-full w-full"
                  />
                </ExerciseInfoSheet>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[17px] font-semibold capitalize leading-snug">
                    {item.exerciseNameEs ?? item.exerciseName}
                  </p>
                  <ExerciseTargetsEditor
                    routineId={routine.id}
                    routineExerciseId={item.id}
                    targetSets={item.targetSets}
                    targetReps={item.targetReps}
                    targetWeight={item.targetWeight}
                    loadUnit={normalizeLoadUnit(item.loadUnit)}
                  />
                </div>
                <ExerciseRowMenu
                  name={item.exerciseNameEs ?? item.exerciseName}
                  canMoveUp={index > 0}
                  canMoveDown={index < items.length - 1}
                  moveUp={moveRoutineExercise.bind(null, routine.id, item.id, "up")}
                  moveDown={moveRoutineExercise.bind(null, routine.id, item.id, "down")}
                  remove={removeRoutineExercise.bind(null, routine.id, item.id)}
                />
              </div>
            ))}
          </GroupedList>
        )}
      </section>

      <AddExerciseSheet routineId={routine.id} photoEnabled={blobConfigured()} />

      <RoutineSettings routineId={routine.id} name={routine.name} days={routine.days ?? []} />
    </div>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`label ${tone}`}>{label}</span>
      <span className="text-[26px] font-bold leading-none tracking-[-0.02em] tabular-nums">
        {value}
      </span>
    </div>
  );
}
