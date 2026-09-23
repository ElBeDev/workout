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
 * vercel.json), **una sola vez al día**: el plan gratuito no permite más, y
 * rechaza el deploy entero si se pide un cron más frecuente.
 *
 * El cron está en `0 1 * * *` (UTC), que son las **19:00 en Ciudad de México**
 * — sin horario de verano desde 2022 —, una hora antes de la hora habitual de
 * entrenamiento. Por eso el aviso sale a esa hora y no a
 * una hora elegida por cada usuario. La columna `reminder_hour` se conserva
 * para el día que el plan permita un cron por hora; hoy no se usa para decidir.
 * `reminder_last_sent` garantiza un solo aviso por día aunque el cron se
 * reintente.
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
