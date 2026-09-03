import Link from "next/link";
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
        <h1 className="text-2xl font-bold">Hoy</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Elige una rutina para empezar.
        </p>
      </header>

      {myRoutines.length === 0 ? (
        <section className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
          <p className="text-sm text-black/60 dark:text-white/60">
            Todavía no tienes rutinas. Crea una para empezar.
          </p>
          <Link
            href="/rutinas"
            className="mt-3 inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            Crear rutina
          </Link>
        </section>
      ) : (
        <ul className="flex flex-col gap-2">
          {myRoutines.map((routine) => (
            <li
              key={routine.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-black/10 p-3 dark:border-white/10"
            >
              <Link href={`/rutinas/${routine.id}`} className="text-sm font-medium">
                {routine.name}
              </Link>
              <form action={startSession.bind(null, routine.id)}>
                <button
                  type="submit"
                  className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                >
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
