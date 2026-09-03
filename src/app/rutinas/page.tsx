import Link from "next/link";
import { ChevronRight, Dumbbell, Layers, Plus } from "lucide-react";
import { getRoutineSummaries } from "@/db/queries";
import { requireUserId } from "@/lib/session";
import { Card, Input, PageHeader, PrimaryButton, SectionTitle } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { createRoutine } from "./actions";

export const dynamic = "force-dynamic";

export default async function RutinasPage() {
  const userId = await requireUserId();
  const myRoutines = await getRoutineSummaries(userId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mis rutinas"
        subtitle={
          myRoutines.length === 0
            ? "Arma tu primera rutina"
            : `${myRoutines.length} ${myRoutines.length === 1 ? "rutina" : "rutinas"}`
        }
      />

      {myRoutines.length > 0 && (
        <ul className="flex flex-col gap-3">
          {myRoutines.map((routine) => (
            <li key={routine.id}>
              <Link href={`/rutinas/${routine.id}`}>
                <Card className="flex items-center gap-3 p-3 transition active:scale-[0.99]">
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
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Card className="flex flex-col gap-3 p-4">
        <SectionTitle>Nueva rutina</SectionTitle>
        <form action={createRoutine} className="flex flex-col gap-3">
          <Input name="name" placeholder="Nombre (ej. Push Day, Pierna)" required />
          <PrimaryButton type="submit">
            <Plus className="h-4 w-4" />
            Crear rutina
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
