import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, routines } from "@/db/schema";
import { enviarAviso, pushConfigurado } from "@/lib/push";
import { localDate, todayWeekday } from "@/lib/dates";
import { DICCIONARIOS } from "@/i18n/dicts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Recordatorio diario de "hoy toca". Lo dispara el cron de Vercel (ver
 * vercel.json).
 *
 * Manda el aviso cuando ya pasó la hora que eligió la persona y todavía no se
 * le ha mandado nada hoy — no exactamente a esa hora. Así funciona igual si el
 * cron corre cada hora o una sola vez al día, que es lo que permite el plan
 * gratuito de Vercel. `reminder_last_sent` garantiza un aviso por día.
 */
export async function GET(request: Request) {
  const esperado = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (esperado && auth !== `Bearer ${esperado}`) {
    return Response.json({ error: "no autorizado" }, { status: 401 });
  }
  if (!pushConfigurado()) {
    return Response.json({ error: "push sin configurar" }, { status: 503 });
  }

  const ahora = localDate(new Date());
  const hoyISO = ahora.toISOString().slice(0, 10);
  const horaActual = ahora.getUTCHours(); // localDate ya trae la hora de México
  const diaSemana = todayWeekday();

  const candidatos = await db
    .select({
      id: users.id,
      username: users.username,
      hora: users.reminderHour,
      ultimo: users.reminderLastSent,
    })
    .from(users)
    .where(and(eq(users.reminderEnabled, true), isNotNull(users.username)));

  let avisados = 0;
  const detalle: { usuario: string; rutina: string; enviados: number }[] = [];

  for (const u of candidatos) {
    if (u.ultimo === hoyISO) continue;
    if (horaActual < u.hora) continue;

    const [rutina] = await db
      .select({ nombre: routines.name })
      .from(routines)
      .where(and(eq(routines.userId, u.id), sql`${diaSemana} = any(${routines.days})`))
      .limit(1);
    if (!rutina) continue;

    // El aviso va en el idioma de la app; la preferencia vive en una cookie del
    // navegador y aquí no hay navegador, así que se manda en español.
    const t = DICCIONARIOS.es.hoy;
    const { enviados } = await enviarAviso(u.id, {
      titulo: t.recordatorioTitulo,
      cuerpo: t.recordatorioCuerpo(rutina.nombre),
      url: "/",
    });

    await db.update(users).set({ reminderLastSent: hoyISO }).where(eq(users.id, u.id));
    if (enviados > 0) avisados += 1;
    detalle.push({ usuario: u.username ?? "", rutina: rutina.nombre, enviados });
  }

  return Response.json({ hoy: hoyISO, horaActual, diaSemana, candidatos: candidatos.length, avisados, detalle });
}
