import { and, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { users, challenges } from "@/db/schema";
import { getChallengeActivity, isMetric, metricValue, rank as rankRows } from "@/db/gym";
import { getTimeline, getTimelines } from "@/db/timelines";
import { todayYmd } from "@/lib/dates";
import { MEDALS, rankFor, type MedalUnlock, type Rank } from "@/lib/xp";
import { coachesHistoricosDe } from "@/server/acceso";

/** El rango de cada cuenta de una lista (un grupo), para pintar insignias. */
export async function getRanks(userIds: string[]): Promise<Map<string, Rank>> {
  const all = await getTimelines(userIds);
  return new Map([...all].map(([id, t]) => [id, rankFor(t.totalXp)]));
}

/**
 * Las medallas de retos, que no salen de la línea de tiempo: haber cumplido la
 * meta de un reto ya terminado, y haberlo ganado (primer lugar, empates
 * incluidos). Cuentan los retos en los que la persona aparecía en la tabla:
 * los de todos los coaches que ha tenido (y los suyos, si es coach), para que
 * cambiar de coach no le quite medallas.
 */
async function getChallengeMedals(userId: string): Promise<MedalUnlock[]> {
  const coachIds = [...(await coachesHistoricosDe(userId)), userId];
  const finished = await db
    .select()
    .from(challenges)
    .where(and(lt(challenges.endsOn, todayYmd()), inArray(challenges.coachId, coachIds)));
  let completed = 0;
  let won = 0;
  for (const c of finished) {
    const rows = await getChallengeActivity(c, [userId]);
    const metric = isMetric(c.metric) ? c.metric : "days";
    const mine = rows.find((r) => r.userId === userId);
    if (!mine) continue;
    if (c.goal !== null && metricValue(mine, metric) >= c.goal) completed += 1;
    if (rankRows(rows, metric).some((r) => r.userId === userId && r.position === 1)) won += 1;
  }
  return MEDALS.filter(
    (m) =>
      (m.group === "retoCumplido" && completed >= m.threshold) ||
      (m.group === "retoGanado" && won >= m.threshold)
  ).map((m) => ({ id: m.id, at: null, sessionId: null }));
}

/** Todo lo de juego de una persona: XP, rango y medallas (las de retos incluidas). */
export async function getGameProfile(userId: string) {
  const [timeline, challengeMedals] = await Promise.all([getTimeline(userId), getChallengeMedals(userId)]);
  return {
    timeline,
    rank: rankFor(timeline.totalXp),
    medals: [...timeline.medals, ...challengeMedals],
  };
}

/** Lo que pasó en una sesión: XP ganado, si subió de escalón y qué medallas salieron. */
export async function getSessionGame(userId: string, sessionId: string) {
  const t = await getTimeline(userId);
  const gained = t.events.filter((e) => e.sessionId === sessionId).reduce((sum, e) => sum + e.xp, 0);
  const after = rankFor(t.totalXp);
  const before = rankFor(t.totalXp - gained);
  return {
    gained,
    before,
    after,
    rankedUp: after.step > before.step,
    medals: t.medals.filter((m) => m.sessionId === sessionId).map((m) => m.id),
  };
}

/** Para comprobar que alguien sigue existiendo y si se deja ver (tarjeta de socio). */
export async function getMemberCardUser(userId: string) {
  const [u] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUpdatedAt: users.avatarUpdatedAt,
      showInRanking: users.showInRanking,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, userId)));
  return u ?? null;
}
