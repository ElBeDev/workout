import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { routines } from "@/db/schema";
import { requireCoach } from "@/lib/coach";
import { alumnosDe, puedeEditarRutinasDe } from "@/server/acceso";
import { getMemberStatuses } from "@/db/gym";
import { getDict } from "@/i18n";
import { Avatar } from "@/components/Avatar";
import { Card, GroupedList, PageHeader } from "@/components/ui";
import { PendingButton } from "@/components/PendingButton";
import { copiarRutina } from "./actions";

export const dynamic = "force-dynamic";

/** Elegir a qué alumnos se copia una rutina (docs/coaches.md §4.5). */
export default async function CopiarRutinaPage({
  params,
  searchParams,
}: {
  params: Promise<{ routineId: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const coachId = await requireCoach();
  const [{ routineId }, { ok, error }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/.test(routineId)) notFound();
  const t = await getDict();
  const c = t.vinculos.copiar;

  const [routine] = await db.select().from(routines).where(eq(routines.id, routineId));
  if (!routine || !(await puedeEditarRutinasDe(coachId, routine.userId))) notFound();

  // Todos sus alumnos menos el dueño de la rutina (copiársela a sí mismo
  // sería duplicarla, y eso ya está en los ajustes de la rutina).
  const members = (await getMemberStatuses(await alumnosDe(coachId)))
    .filter((m) => m.userId !== routine.userId)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={c.titulo} subtitle={c.subtitulo(routine.name)} backHref={`/rutinas/${routineId}`} />

      {ok && (
        <p className="rounded-xl bg-sets/12 px-4 py-3 text-[14px] font-semibold text-sets">{c.listo(Number(ok))}</p>
      )}
      {error === "ninguno" && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-[14px] font-semibold text-danger">{c.ninguno}</p>
      )}

      {members.length === 0 ? (
        <Card className="p-4 text-[15px] text-muted">{c.sinAlumnos}</Card>
      ) : (
        <form action={copiarRutina.bind(null, routineId)} className="flex flex-col gap-4">
          <GroupedList>
            {members.map((m) => (
              <label key={m.userId} className="flex cursor-pointer items-center gap-3 p-3">
                <Avatar userId={m.userId} name={m.name} updatedAt={m.avatarUpdatedAt} size={36} />
                <span className="min-w-0 flex-1 truncate text-[16px] font-semibold capitalize">{m.name}</span>
                <input type="checkbox" name="clientId" value={m.userId} className="h-5 w-5 accent-[var(--accent)]" />
              </label>
            ))}
          </GroupedList>
          <PendingButton className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-70">
            {c.copiar}
          </PendingButton>
        </form>
      )}
    </div>
  );
}
