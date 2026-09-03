import { db } from "@/db";
import { routines } from "@/db/schema";
import { getCurrentUserId } from "@/db/current-user";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { createRoutine } from "./actions";

export const dynamic = "force-dynamic";

export default async function RutinasPage() {
  const userId = await getCurrentUserId();
  const myRoutines = await db
    .select()
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(routines.sortOrder, routines.createdAt);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Mis rutinas</h1>
      </header>

      {myRoutines.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          Todavía no tienes rutinas. Crea la primera abajo.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {myRoutines.map((routine) => (
            <li key={routine.id}>
              <Link
                href={`/rutinas/${routine.id}`}
                className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3 dark:border-white/10"
              >
                <span className="font-medium">{routine.name}</span>
                <span className="text-black/40 dark:text-white/40">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <form action={createRoutine} className="flex flex-col gap-2">
        <input
          name="name"
          placeholder="Nombre de la rutina (ej. Push Day)"
          required
          className="rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/10 dark:bg-transparent"
        />
        <button
          type="submit"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          + Nueva rutina
        </button>
      </form>
    </div>
  );
}
