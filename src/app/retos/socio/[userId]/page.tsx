import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CalendarCheck, Flame, Lock } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { fmtDate } from "@/lib/dates";
import { publicName } from "@/db/gym";
import { getWeeklyStats } from "@/db/queries";
import { getGameProfile, getMemberCardUser } from "@/db/gamificacion";
import { getDict } from "@/i18n";
import { Avatar } from "@/components/Avatar";
import { MedalGrid, RankCard } from "@/components/Juego";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { MEDALS } from "@/lib/xp";

export const dynamic = "force-dynamic";

/**
 * Tarjeta de un socio (docs/gamificacion.md §4.3): foto, rango, racha y
 * medallas. Nada de pesos ni sesiones, que son suyos y del coach. Quien se
 * ocultó del ranking no tiene tarjeta para los demás.
 */
export default async function MemberCardPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: targetId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(targetId)) notFound();
  const viewerId = await requireUserId();
  const t = await getDict();

  const [target, [viewer]] = await Promise.all([
    getMemberCardUser(targetId),
    db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, viewerId)),
  ]);
  if (!target) notFound();
  if (!target.showInRanking && targetId !== viewerId && !viewer?.isAdmin) notFound();

  const [game, weekly] = await Promise.all([getGameProfile(targetId), getWeeklyStats(targetId)]);
  const name = publicName(target);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={name} backHref="/retos" capitalize />

      <Card hero className="flex items-center gap-4 p-5">
        <Avatar userId={target.id} name={name} updatedAt={target.avatarUpdatedAt} size={72} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-load">
            <Flame className="h-4 w-4" />
            {weekly.streakWeeks > 0 ? t.juego.racha(weekly.streakWeeks) : t.juego.sinRacha}
          </p>
          <p className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-days">
            <CalendarCheck className="h-4 w-4" />
            {t.juego.dias(game.timeline.stats.days)}
          </p>
          <p className="text-[13px] text-muted">
            {t.perfil.miembroDesde(fmtDate(target.createdAt, { month: "long", year: "numeric" }, t.comun.intl))}
          </p>
        </div>
      </Card>

      <RankCard rank={game.rank} t={t} />

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <SectionTitle>{t.juego.logros}</SectionTitle>
          <p className="text-[13px] font-semibold text-muted">{t.juego.medallasDe(game.medals.length, MEDALS.length)}</p>
        </div>
        {game.medals.length > 0 && <MedalGrid unlocked={game.medals} t={t} showLocked={false} />}
      </section>

      <p className="flex items-start gap-2 text-[12px] text-muted">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t.juego.privado}
      </p>
    </div>
  );
}
