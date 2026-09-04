import { db } from "@/db";
import { workoutSessions, routines, setLogs, exercises } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Layers, Weight, NotebookPen } from "lucide-react";
import { requireUserId } from "@/lib/session";
import { bodyPartLabel } from "@/lib/body-parts";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";

export const dynamic = "force-dynamic";

function formatDuration(start: Date, end: Date | null) {
  if (!end) return "—";
  const min = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const [session] = await db
    .select({
      id: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      finishedAt: workoutSessions.finishedAt,
      notes: workoutSessions.notes,
      routineName: routines.name,
    })
    .from(workoutSessions)
    .leftJoin(routines, eq(workoutSessions.routineId, routines.id))
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)));
  if (!session) notFound();

  const sets = await db
    .select({
      exerciseId: exercises.id,
      name: exercises.name,
      nameEs: exercises.nameEs,
      gifUrl: exercises.gifUrl,
      bodyPart: exercises.bodyPart,
      setNumber: setLogs.setNumber,
      weight: setLogs.weight,
      reps: setLogs.reps,
      loggedAt: setLogs.loggedAt,
    })
    .from(setLogs)
    .innerJoin(exercises, eq(setLogs.exerciseId, exercises.id))
    .where(and(eq(setLogs.sessionId, id), eq(setLogs.completed, true)))
    .orderBy(asc(setLogs.loggedAt), asc(setLogs.setNumber));

  type Group = {
    exerciseId: string;
    name: string;
    nameEs: string | null;
    gifUrl: string | null;
    bodyPart: string | null;
    sets: { setNumber: number; weight: string | null; reps: number | null }[];
  };
  const groups: Group[] = [];
  for (const s of sets) {
    let g = groups.find((x) => x.exerciseId === s.exerciseId);
    if (!g) {
      g = { exerciseId: s.exerciseId, name: s.name, nameEs: s.nameEs, gifUrl: s.gifUrl, bodyPart: s.bodyPart, sets: [] };
      groups.push(g);
    }
    g.sets.push({ setNumber: s.setNumber, weight: s.weight, reps: s.reps });
  }
  for (const g of groups) g.sets.sort((a, b) => a.setNumber - b.setNumber);

  const volume = sets.reduce((sum, s) => sum + (Number(s.weight ?? 0) * (s.reps ?? 0)), 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={session.routineName ?? "Rutina eliminada"}
        backHref="/progreso"
        subtitle={new Intl.DateTimeFormat("es-MX", { dateStyle: "full", timeStyle: "short" }).format(
          session.startedAt
        )}
      />

      <div className="rounded-[1.5rem] bg-accent p-5 text-accent-foreground">
        <div className="grid grid-cols-3 divide-x divide-black/10 dark:divide-white/15">
          <Stat icon={<Clock className="h-4 w-4" />} value={formatDuration(session.startedAt, session.finishedAt)} label="Duración" />
          <Stat icon={<Layers className="h-4 w-4" />} value={String(sets.length)} label="Series" />
          <Stat icon={<Weight className="h-4 w-4" />} value={volume ? `${Math.round(volume)} kg` : "—"} label="Volumen" />
        </div>
      </div>

      {groups.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted">Esta sesión no tiene series registradas.</Card>
      ) : (
        <section className="flex flex-col gap-3">
          <SectionTitle>Ejercicios</SectionTitle>
          {groups.map((g) => (
            <Card key={g.exerciseId} className="p-3">
              <Link href={`/progreso/${g.exerciseId}`} className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
                  <ExerciseThumb src={g.gifUrl} alt={g.nameEs ?? g.name} className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold capitalize">{g.nameEs ?? g.name}</p>
                  <p className="text-[12px] text-muted">{bodyPartLabel(g.bodyPart)}</p>
                </div>
              </Link>
              <ul className="mt-3 flex flex-col gap-1.5">
                {g.sets.map((s) => (
                  <li key={s.setNumber} className="flex items-center gap-3 text-[14px]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/40 text-[12px] font-semibold text-accent-strong">
                      {s.setNumber}
                    </span>
                    <span className="font-semibold tabular-nums">{s.weight ? `${s.weight} kg` : "—"}</span>
                    <span className="text-muted">×</span>
                    <span className="tabular-nums">{s.reps ?? "—"} reps</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </section>
      )}

      {session.notes && (
        <Card className="flex flex-col gap-2 p-4">
          <SectionTitle className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-muted" /> Notas
          </SectionTitle>
          <p className="whitespace-pre-wrap text-[15px]">{session.notes}</p>
        </Card>
      )}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="opacity-70">{icon}</span>
      <span className="text-[18px] font-bold leading-none tabular-nums">{value}</span>
      <span className="text-[11px] opacity-70">{label}</span>
    </div>
  );
}
