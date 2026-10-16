import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { coachClients, coaches, users } from "@/db/schema";
import { publicName } from "@/db/gym";
import { DIAS_PRUEBA, PLANES, esPlan } from "@/lib/planes";

/**
 * El panel del dueño de la plataforma (docs/coaches.md §8.1): coaches, no
 * alumnos. Quien llama ya comprobó que es el dueño (`requireOwner`).
 */

export type CoachDelDueno = {
  userId: string;
  nombre: string;
  username: string | null;
  marca: string | null;
  code: string;
  plan: string;
  estado: string;
  trialEndsAt: Date | null;
  /** La prueba ya terminó y no hay pago: hasta el paso 5 nadie paga. */
  pruebaVencida: boolean;
  alumnos: number;
  creado: Date;
};

export type ResumenDueno = {
  coaches: CoachDelDueno[];
  totales: { total: number; enPrueba: number; pagando: number; gratis: number; conProblemas: number };
  /** Lo que entra al mes por los planes activos que pagan, en pesos. */
  ingresoMensual: number;
};

export async function resumenDueno(now = new Date()): Promise<ResumenDueno> {
  const rows = await db
    .select({
      userId: coaches.userId,
      code: coaches.code,
      brandName: coaches.brandName,
      plan: coaches.plan,
      billingStatus: coaches.billingStatus,
      trialEndsAt: coaches.trialEndsAt,
      createdAt: coaches.createdAt,
      username: users.username,
      displayName: users.displayName,
      alumnos: sql<number>`(select count(*)::int from ${coachClients} where ${coachClients.coachId} = ${coaches.userId} and ${coachClients.status} = 'active')`,
    })
    .from(coaches)
    .innerJoin(users, eq(users.id, coaches.userId))
    .orderBy(desc(coaches.createdAt));

  const lista: CoachDelDueno[] = rows.map((r) => ({
    userId: r.userId,
    nombre: publicName(r),
    username: r.username,
    marca: r.brandName,
    code: r.code,
    plan: r.plan,
    estado: r.billingStatus,
    trialEndsAt: r.trialEndsAt,
    pruebaVencida: r.plan !== "comp" && r.billingStatus === "trialing" && r.trialEndsAt !== null && r.trialEndsAt < now,
    alumnos: Number(r.alumnos),
    creado: r.createdAt,
  }));

  const pagan = lista.filter((c) => c.plan !== "comp" && c.estado === "active");
  return {
    coaches: lista,
    totales: {
      total: lista.length,
      enPrueba: lista.filter((c) => c.plan !== "comp" && c.estado === "trialing").length,
      pagando: pagan.length,
      gratis: lista.filter((c) => c.plan === "comp").length,
      conProblemas: lista.filter((c) => c.estado === "past_due" || c.estado === "locked").length,
    },
    ingresoMensual: pagan.reduce((sum, c) => sum + (esPlan(c.plan) ? PLANES[c.plan].precio : 0), 0),
  };
}

/**
 * Dar o quitar el plan gratis (`comp`): para amigos, pilotos o coaches de
 * prueba sin pasar por Stripe. Al quitarlo vuelve a Coach con una prueba de
 * 14 días que empieza ese día, para no dejarlo bloqueado de golpe.
 */
export async function cambiarPlanGratis(coachId: string, gratis: boolean): Promise<void> {
  await db
    .update(coaches)
    .set(
      gratis
        ? { plan: "comp", billingStatus: "active", trialEndsAt: null, pastDueSince: null }
        : { plan: "coach", billingStatus: "trialing", trialEndsAt: new Date(Date.now() + DIAS_PRUEBA * 86400000) }
    )
    .where(eq(coaches.userId, coachId));
}
