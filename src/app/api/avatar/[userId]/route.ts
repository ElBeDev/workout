import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, userAvatars } from "@/db/schema";
import { getCurrentUserId } from "@/lib/session";
import { esCoachDe } from "@/server/acceso";

/**
 * La foto de perfil de alguien. Sólo con sesión iniciada, y la de quien se
 * ocultó del ranking sólo la ve esa persona o su coach (docs/gamificacion.md §5).
 * La URL lleva `?v=` con la fecha de la foto, así que se puede guardar un año.
 */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/avatar/[userId]">) {
  const viewerId = await getCurrentUserId();
  if (!viewerId) return new Response(null, { status: 401 });

  const { userId } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(userId)) return new Response(null, { status: 404 });

  if (viewerId !== userId) {
    const [target] = await db.select({ show: users.showInRanking }).from(users).where(eq(users.id, userId));
    if (!target) return new Response(null, { status: 404 });
    if (!target.show && !(await esCoachDe(viewerId, userId))) return new Response(null, { status: 404 });
  }

  const [avatar] = await db
    .select({ image: userAvatars.image, mime: userAvatars.mime })
    .from(userAvatars)
    .where(eq(userAvatars.userId, userId));
  if (!avatar) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(avatar.image), {
    headers: {
      "Content-Type": avatar.mime,
      // Privada: depende de quién la pide. Larga: la URL cambia con la foto.
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
