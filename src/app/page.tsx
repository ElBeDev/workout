import Link from "next/link";
import { eq } from "drizzle-orm";
import { Play, Plus, Dumbbell, Layers, User } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getRoutineSummaries } from "@/db/queries";
import { requireUserId } from "@/lib/session";
import { Card, SectionTitle, CircleButton } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { startSession } from "./entrenar/actions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await requireUserId();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const myRoutines = await getRoutineSummaries(userId);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Hola,</p>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight capitalize">
            {user?.username ?? "tú"}
          </h1>
        </div>
        <Link
          href="/perfil"
          aria-label="Perfil"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface shadow-[0_2px_12px_rgba(21,21,31,0.06)]"
        >
          <User className="h-5 w-5" />
        </Link>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <SectionTitle>Tus rutinas</SectionTitle>
          {myRoutines.length > 0 && (
            <Link href="/rutinas" className="text-sm font-medium text-muted">
              Ver todas
            </Link>
          )}
        </div>

        {myRoutines.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Dumbbell className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted">
              Todavía no tienes rutinas. Crea la primera para empezar.
            </p>
            <Link
              href="/rutinas"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              Crear rutina
            </Link>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {myRoutines.map((routine) => (
              <li key={routine.id}>
                <Card className="flex items-center gap-3 p-3">
                  <Link
                    href={`/rutinas/${routine.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="h-18 w-18 shrink-0 overflow-hidden rounded-2xl">
                      <ExerciseThumb
                        src={routine.thumbUrl}
                        alt={routine.name}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-semibold">{routine.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-[13px] text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Dumbbell className="h-3.5 w-3.5" />
                          {routine.exerciseCount} ejercicios
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          {routine.totalSets} series
                        </span>
                      </div>
                    </div>
                  </Link>
                  <form action={startSession.bind(null, routine.id)}>
                    <CircleButton
                      type="submit"
                      tone="dark"
                      aria-label={`Empezar ${routine.name}`}
                      disabled={routine.exerciseCount === 0}
                    >
                      <Play className="h-4 w-4" fill="currentColor" />
                    </CircleButton>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
