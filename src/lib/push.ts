import webpush from "web-push";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

/**
 * Notificaciones push. No existe forma de programar una notificación local en
 * web (Notification Triggers nunca salió de experimental), así que el aviso de
 * "hoy toca" lo manda el servidor desde un cron.
 *
 * En iPhone sólo funciona si la app está **instalada en la pantalla de inicio**
 * (iOS 16.4 en adelante). En Safari normal no se puede, y eso hay que decirlo
 * en la interfaz en vez de dejar al usuario esperando un aviso que no llega.
 */
export function pushConfigurado() {
  return Boolean(
    process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  );
}

function configurar() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:nadie@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

export type Aviso = { titulo: string; cuerpo: string; url: string };

/**
 * Manda el aviso a todos los dispositivos del usuario. Las suscripciones que el
 * navegador ya rechazó (404/410) se borran: si no, se acumulan para siempre y
 * cada envío se vuelve más lento.
 */
export async function enviarAviso(userId: string, aviso: Aviso): Promise<{ enviados: number; borrados: number }> {
  if (!pushConfigurado()) return { enviados: 0, borrados: 0 };
  configurar();

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  let enviados = 0;
  let borrados = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(aviso)
      );
      enviados += 1;
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        await db
          .delete(pushSubscriptions)
          .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, s.endpoint)));
        borrados += 1;
      }
    }
  }
  return { enviados, borrados };
}
