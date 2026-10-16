import { randomInt } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { coachClients, coaches, users } from "@/db/schema";
import { publicName } from "@/db/gym";

/**
 * Alta y datos de los coaches (docs/coaches.md §4.5). Sin cookies ni
 * redirects: lo usan la web y, más adelante, la API de la app nativa.
 */

/** Alumnos activos que caben en cada plan; `null` = sin tope. */
const CUPO: Record<string, number | null> = { coach: 30, coach_plus: null, comp: null };

/** Días de prueba antes del primer cobro (negocio.md §4). */
const DIAS_PRUEBA = 14;

// Sin 0/O ni 1/I: el código se dicta y se copia a mano.
const ALFABETO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function codigoNuevo(): string {
  return "GL-" + Array.from({ length: 4 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
}

/** Normaliza lo que alguien teclea: "gl 27de", "27de" o "GL-27DE" → "GL-27DE". */
export function normalizarCodigo(raw: string): string {
  const limpio = raw.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const sinPrefijo = limpio.startsWith("GL") && limpio.length === 6 ? limpio.slice(2) : limpio;
  return `GL-${sinPrefijo}`;
}

export type CrearCoachResultado = { ok: true; code: string } | { ok: false; error: "ya_es_coach" | "tiene_coach" };

/**
 * Convierte una cuenta en coach: rol, fila en `coaches` con su código y la
 * prueba de 14 días. Un alumno con coach activo tiene que dejarlo antes: un
 * coach no tiene coach (§4.5).
 */
export async function crearCoach(userId: string, { brandName }: { brandName: string | null }): Promise<CrearCoachResultado> {
  const [existente] = await db.select({ id: coaches.userId }).from(coaches).where(eq(coaches.userId, userId));
  if (existente) return { ok: false, error: "ya_es_coach" };
  const [abierto] = await db
    .select({ id: coachClients.id })
    .from(coachClients)
    .where(and(eq(coachClients.clientId, userId), eq(coachClients.status, "active")));
  if (abierto) return { ok: false, error: "tiene_coach" };

  const trialEndsAt = new Date(Date.now() + DIAS_PRUEBA * 86400000);
  // El código es único: si choca (1 en ~1 millón por coach), se intenta otro.
  for (let intento = 0; intento < 5; intento++) {
    const code = codigoNuevo();
    try {
      await db.batch([
        db.insert(coaches).values({ userId, code, brandName, plan: "coach", billingStatus: "trialing", trialEndsAt }),
        db.update(users).set({ role: "coach" }).where(eq(users.id, userId)),
      ]);
      return { ok: true, code };
    } catch (err) {
      if (!String(err).includes("coaches_code_unique")) throw err;
    }
  }
  throw new Error("No se pudo generar un código de coach único");
}

export type CoachPublico = {
  userId: string;
  code: string;
  nombre: string;
  marca: string | null;
  plan: string;
  alumnos: number;
  /** null = sin tope. */
  cupo: number | null;
};

async function cargarCoach(where: ReturnType<typeof eq>): Promise<CoachPublico | null> {
  const [row] = await db
    .select({
      userId: coaches.userId,
      code: coaches.code,
      brandName: coaches.brandName,
      plan: coaches.plan,
      username: users.username,
      displayName: users.displayName,
    })
    .from(coaches)
    .innerJoin(users, eq(users.id, coaches.userId))
    .where(and(where, eq(users.role, "coach")));
  if (!row) return null;
  const [{ n }] = await db
    .select({ n: count() })
    .from(coachClients)
    .where(and(eq(coachClients.coachId, row.userId), eq(coachClients.status, "active")));
  return {
    userId: row.userId,
    code: row.code,
    nombre: publicName(row),
    marca: row.brandName,
    plan: row.plan,
    alumnos: Number(n),
    cupo: CUPO[row.plan] ?? CUPO.coach,
  };
}

/** Lo que se puede enseñar de un coach a quien tiene su código o su liga. */
export function coachPorCodigo(code: string): Promise<CoachPublico | null> {
  return cargarCoach(eq(coaches.code, normalizarCodigo(code)));
}

export function coachPorId(coachId: string): Promise<CoachPublico | null> {
  return cargarCoach(eq(coaches.userId, coachId));
}

/** Para pedir unirse por nombre de usuario (§4.3). */
export async function coachPorUsuario(username: string): Promise<CoachPublico | null> {
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()));
  return u ? coachPorId(u.id) : null;
}

export function tieneCupo(c: CoachPublico): boolean {
  return c.cupo === null || c.alumnos < c.cupo;
}
