import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Dumbbell, Layers, Plus } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getRoutineSummaries } from "@/db/queries";
import { requireAdmin } from "@/lib/admin";
import { Card, Input, PageHeader, PrimaryButton, SectionTitle } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { createRoutineForUser } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;

  const [target] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.id, userId));
  if (!target) notFound();

  const userRoutines = await getRoutineSummaries(userId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={target.username ?? "Usuario"}
        subtitle="Rutinas de este usuario"
        backHref="/admin"
        capitalize
      />

      {userRoutines.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {userRoutines.map((r) => (
            <li key={r.id}>
              <Link href={`/rutinas/${r.id}`}>
                <Card className="flex items-center gap-3 p-3 transition active:scale-[0.99]">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                    <ExerciseThumb src={r.thumbUrl} alt={r.name} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold">{r.name}</p>
                    <div className="mt-1 flex items-center gap-3 text-[13px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Dumbbell className="h-3.5 w-3.5" />
                        {r.exerciseCount} ejercicios
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" />
                        {r.totalSets} series
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Este usuario todavía no tiene rutinas.</p>
      )}

      <Card className="flex flex-col gap-3 p-4">
        <SectionTitle>Nueva rutina</SectionTitle>
        <form action={createRoutineForUser.bind(null, userId)} className="flex flex-col gap-3">
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
