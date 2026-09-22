import Link from "next/link";
import { ChevronRight, Dumbbell } from "lucide-react";
import { getRoutineSummaries } from "@/db/queries";
import { requireUserId } from "@/lib/session";
import { daysAgoLabel, WEEKDAYS } from "@/lib/dates";
import { Card, GroupedList, PageHeader } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { NewRoutineSheet } from "./NewRoutineSheet";

export const dynamic = "force-dynamic";

export default async function RutinasPage() {
  const userId = await requireUserId();
  const myRoutines = await getRoutineSummaries(userId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Rutinas"
        subtitle={
          myRoutines.length === 0
            ? "Arma tu primera rutina"
            : `${myRoutines.length} ${myRoutines.length === 1 ? "rutina" : "rutinas"}`
        }
        right={<NewRoutineSheet />}
      />

      {myRoutines.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-muted">
            <Dumbbell className="h-6 w-6" />
          </div>
          <p className="text-[15px] text-muted">
            Toca el + de arriba para crear tu primera rutina.
          </p>
        </Card>
      ) : (
        <GroupedList>
          {myRoutines.map((routine) => {
            const days = routine.days
              .map((d) => WEEKDAYS.find((w) => w.value === d)?.short)
              .filter(Boolean)
              .join(" · ");
            return (
              <Link
                key={routine.id}
                href={`/rutinas/${routine.id}`}
                className="flex items-center gap-3 p-3 transition active:bg-surface-2"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  <ExerciseThumb
                    src={routine.thumbUrl}
                    alt={routine.name}
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] font-semibold">{routine.name}</p>
                  <p className="text-[13px] text-muted">
                    {routine.exerciseCount} ejercicios · {routine.totalSets} series
                  </p>
                  <p className="text-[13px] text-faint">
                    {days ? `${days} · ` : ""}
                    {daysAgoLabel(routine.lastDoneAt)}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
              </Link>
            );
          })}
        </GroupedList>
      )}
    </div>
  );
}
