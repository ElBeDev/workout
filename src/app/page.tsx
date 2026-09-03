import Link from "next/link";
import { Play, Plus, Dumbbell } from "lucide-react";
import { db } from "@/db";
import { routines } from "@/db/schema";
import { getCurrentUserId } from "@/db/current-user";
import { eq } from "drizzle-orm";
import { startSession } from "./entrenar/actions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await getCurrentUserId();
  const myRoutines = await db
    .select()
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(routines.sortOrder, routines.createdAt);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Hoy</h1>
        <p className="text-sm text-black/50 dark:text-white/50">
          Elige una rutina para empezar.
        </p>
      </header>

      {myRoutines.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 bg-surface p-8 text-center shadow-sm dark:border-white/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Dumbbell className="h-6 w-6" />
          </div>
          <p className="text-sm text-black/50 dark:text-white/50">
            Todavía no tienes rutinas. Crea una para empezar.
          </p>
          <Link
            href="/rutinas"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Crear rutina
          </Link>
        </section>
      ) : (
        <ul className="flex flex-col gap-2">
          {myRoutines.map((routine) => (
            <li
              key={routine.id}
              className="flex items-center justify-between gap-2 rounded-2xl border border-black/10 bg-surface p-3 shadow-sm dark:border-white/10"
            >
              <Link href={`/rutinas/${routine.id}`} className="flex-1 px-1">
                <span className="text-sm font-semibold">{routine.name}</span>
              </Link>
              <form action={startSession.bind(null, routine.id)}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-xs font-medium text-white shadow-sm active:scale-[0.98]"
                >
                  <Play className="h-3.5 w-3.5" fill="currentColor" />
                  Empezar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
