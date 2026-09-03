import { db } from "@/db";
import { routines } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { createRoutine } from "./actions";

export const dynamic = "force-dynamic";

export default async function RutinasPage() {
  const userId = await requireUserId();
  const myRoutines = await db
    .select()
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(routines.sortOrder, routines.createdAt);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Mis rutinas</h1>
      </header>

      {myRoutines.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">
          Todavía no tienes rutinas. Crea la primera abajo.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {myRoutines.map((routine) => (
            <li key={routine.id}>
              <Link
                href={`/rutinas/${routine.id}`}
                className="flex items-center justify-between rounded-2xl border border-black/10 bg-surface px-4 py-3.5 shadow-sm transition active:scale-[0.99] dark:border-white/10"
              >
                <span className="text-sm font-semibold">{routine.name}</span>
                <ChevronRight className="h-4 w-4 text-black/30 dark:text-white/30" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <form
        action={createRoutine}
        className="flex flex-col gap-2 rounded-2xl border border-dashed border-black/15 p-3 dark:border-white/15"
      >
        <input
          name="name"
          placeholder="Nombre de la rutina (ej. Push Day)"
          required
          className="rounded-xl border border-black/10 bg-surface px-4 py-3 text-sm dark:border-white/10"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nueva rutina
        </button>
      </form>
    </div>
  );
}
