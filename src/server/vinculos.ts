import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { coachClients, users } from "@/db/schema";
import { publicName } from "@/db/gym";
import { DICCIONARIOS } from "@/i18n/dicts";
import { coachPorCodigo, coachPorId, coachPorUsuario, tieneCupo, type CoachPublico } from "@/server/coaches";

/**
 * El vínculo alumno ↔ coach (docs/coaches.md §4): unirse con liga o código,
 * pedir unirse por nombre de usuario, aceptar, rechazar y desligarse.
 *
 * Los avisos push no se mandan aquí: se devuelven como datos y los manda
 * quien llama (la server action con `after()`, y más adelante la API), así el
 * servicio no depende de Next. Van en español, como el recordatorio y los
 * comentarios: el idioma vive en una cookie del teléfono y aquí no hay.
 */

export type Aviso = { para: string; titulo: string; cuerpo: string; url: string };

const textos = DICCIONARIOS.es.vinculos.avisos;

async function nombreDe(userId: string): Promise<string> {
  const [u] = await db
    .select({ username: users.username, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, userId));
  return u ? publicName(u) : "—";
}

async function esCoachLaCuenta(userId: string): Promise<boolean> {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role === "coach";
}

/** El vínculo abierto (pendiente o activo) de un alumno, si tiene. */
async function vinculoAbierto(clientId: string) {
  const [row] = await db
    .select()
    .from(coachClients)
    .where(and(eq(coachClients.clientId, clientId), inArray(coachClients.status, ["pending", "active"])));
  return row ?? null;
}

export type LigarResultado =
  | { ok: true; coach: CoachPublico; avisos: Aviso[] }
  | {
      ok: false;
      error: "no_existe" | "eres_tu" | "es_coach" | "ya_es_tu_coach" | "tiene_otro" | "sin_cupo";
      /** Con `tiene_otro`: el nombre del coach de hoy, para preguntar si lo cambia. */
      coachActual?: string;
      avisos: Aviso[];
    };

/**
 * Unirse con la liga, el QR o el código. Si el coach compartió su código, ya
 * aceptó: el vínculo nace activo. Si el alumno ya tiene coach, sólo cambia con
 * `cambiar` (la pantalla pregunta antes). Una solicitud pendiente a otro coach
 * se cancela: la liga pesa más.
 */
export async function ligarConCodigo(
  clientId: string,
  code: string,
  { cambiar = false, source = "code" }: { cambiar?: boolean; source?: "link" | "code" } = {}
): Promise<LigarResultado> {
  const coach = await coachPorCodigo(code);
  if (!coach) return { ok: false, error: "no_existe", avisos: [] };
  if (coach.userId === clientId) return { ok: false, error: "eres_tu", avisos: [] };
  if (await esCoachLaCuenta(clientId)) return { ok: false, error: "es_coach", avisos: [] };

  const abierto = await vinculoAbierto(clientId);
  if (abierto?.status === "active" && abierto.coachId === coach.userId) {
    return { ok: false, error: "ya_es_tu_coach", avisos: [] };
  }
  if (abierto?.status === "active" && !cambiar) {
    return { ok: false, error: "tiene_otro", coachActual: await nombreDe(abierto.coachId), avisos: [] };
  }

  const alumno = await nombreDe(clientId);
  if (!tieneCupo(coach)) {
    return {
      ok: false,
      error: "sin_cupo",
      avisos: [{ para: coach.userId, titulo: textos.sinCupoTitulo, cuerpo: textos.sinCupo(alumno), url: "/coach" }],
    };
  }

  const ahora = new Date();
  const nuevo = db
    .insert(coachClients)
    .values({ coachId: coach.userId, clientId, status: "active", source, acceptedAt: ahora });
  if (abierto) {
    // Terminar el de antes y crear el nuevo juntos: el índice único no deja
    // dos abiertos, y a medias el alumno se quedaría sin coach.
    await db.batch([
      db
        .update(coachClients)
        .set({ status: "ended", endedAt: ahora, endedBy: clientId })
        .where(eq(coachClients.id, abierto.id)),
      nuevo,
    ]);
  } else {
    await nuevo;
  }

  const avisos: Aviso[] = [
    { para: coach.userId, titulo: textos.nuevoAlumnoTitulo, cuerpo: textos.nuevoAlumno(alumno), url: "/coach" },
  ];
  if (abierto?.status === "active") {
    avisos.push({ para: abierto.coachId, titulo: textos.seFueTitulo, cuerpo: textos.seFue(alumno), url: "/coach" });
  }
  return { ok: true, coach, avisos };
}

export type SolicitarResultado =
  | { ok: true; coach: CoachPublico; avisos: Aviso[] }
  | { ok: false; error: "no_existe" | "eres_tu" | "es_coach" | "ya_es_tu_coach" | "tiene_otro" | "ya_pendiente" };

/**
 * Pedir unirse a un coach por su nombre de usuario: queda pendiente hasta que
 * el coach acepte. Sólo sin coach: para cambiar de coach está la liga, que
 * pregunta antes (§4.5).
 */
export async function solicitarCoach(clientId: string, usernameCoach: string): Promise<SolicitarResultado> {
  const coach = await coachPorUsuario(usernameCoach);
  if (!coach) return { ok: false, error: "no_existe" };
  if (coach.userId === clientId) return { ok: false, error: "eres_tu" };
  if (await esCoachLaCuenta(clientId)) return { ok: false, error: "es_coach" };

  const abierto = await vinculoAbierto(clientId);
  if (abierto?.status === "active") {
    return { ok: false, error: abierto.coachId === coach.userId ? "ya_es_tu_coach" : "tiene_otro" };
  }
  if (abierto?.status === "pending") return { ok: false, error: "ya_pendiente" };

  try {
    await db.insert(coachClients).values({ coachId: coach.userId, clientId, status: "pending", source: "request" });
  } catch {
    // Dos toques seguidos: el índice único ya tiene la primera.
    return { ok: false, error: "ya_pendiente" };
  }
  const alumno = await nombreDe(clientId);
  return {
    ok: true,
    coach,
    avisos: [{ para: coach.userId, titulo: textos.solicitudTitulo, cuerpo: textos.solicitud(alumno), url: "/coach" }],
  };
}

export type ResponderResultado = { ok: true; avisos: Aviso[] } | { ok: false; error: "no_existe" | "sin_cupo" };

/** El coach acepta o rechaza una solicitud pendiente suya. */
export async function responderSolicitud(
  coachId: string,
  vinculoId: string,
  aceptar: boolean
): Promise<ResponderResultado> {
  const [row] = await db
    .select()
    .from(coachClients)
    .where(and(eq(coachClients.id, vinculoId), eq(coachClients.coachId, coachId), eq(coachClients.status, "pending")));
  if (!row) return { ok: false, error: "no_existe" };

  const coach = await coachPorId(coachId);
  if (aceptar && coach && !tieneCupo(coach)) return { ok: false, error: "sin_cupo" };

  const ahora = new Date();
  await db
    .update(coachClients)
    .set(aceptar ? { status: "active", acceptedAt: ahora } : { status: "ended", endedAt: ahora, endedBy: coachId })
    .where(eq(coachClients.id, row.id));

  const nombreCoach = coach?.nombre ?? (await nombreDe(coachId));
  return {
    ok: true,
    avisos: [
      aceptar
        ? { para: row.clientId, titulo: textos.aceptadoTitulo, cuerpo: textos.aceptado(nombreCoach), url: "/" }
        : { para: row.clientId, titulo: textos.rechazadoTitulo, cuerpo: textos.rechazado(nombreCoach), url: "/perfil" },
    ],
  };
}

/** El alumno retira su solicitud pendiente. */
export async function cancelarSolicitud(clientId: string): Promise<void> {
  await db
    .update(coachClients)
    .set({ status: "ended", endedAt: new Date(), endedBy: clientId })
    .where(and(eq(coachClients.clientId, clientId), eq(coachClients.status, "pending")));
}

/**
 * Terminar un vínculo activo. Lo puede hacer el alumno (deja a su coach) o el
 * coach (quita a un alumno). El alumno conserva todo; el coach deja de verlo
 * al momento (§4.4).
 */
export async function terminarVinculo(
  actorId: string,
  { clientId, coachId }: { clientId: string; coachId?: string }
): Promise<{ ok: boolean; avisos: Aviso[] }> {
  const abierto = await vinculoAbierto(clientId);
  if (!abierto || abierto.status !== "active") return { ok: false, avisos: [] };
  // Sólo el propio alumno o su coach.
  if (actorId !== clientId && actorId !== abierto.coachId) return { ok: false, avisos: [] };
  if (coachId && abierto.coachId !== coachId) return { ok: false, avisos: [] };

  await db
    .update(coachClients)
    .set({ status: "ended", endedAt: new Date(), endedBy: actorId })
    .where(eq(coachClients.id, abierto.id));

  const avisos: Aviso[] =
    actorId === clientId
      ? [{ para: abierto.coachId, titulo: textos.seFueTitulo, cuerpo: textos.seFue(await nombreDe(clientId)), url: "/coach" }]
      : [{ para: clientId, titulo: textos.teQuitoTitulo, cuerpo: textos.teQuito(await nombreDe(abierto.coachId)), url: "/perfil" }];
  return { ok: true, avisos };
}

export type EstadoAlumno =
  | { tipo: "sin_coach" }
  | { tipo: "pendiente" | "activo"; coach: CoachPublico; desde: Date };

/** Lo que ve el alumno en Perfil → "Mi coach". */
export async function estadoAlumno(clientId: string): Promise<EstadoAlumno> {
  const abierto = await vinculoAbierto(clientId);
  if (!abierto) return { tipo: "sin_coach" };
  const coach = await coachPorId(abierto.coachId);
  if (!coach) return { tipo: "sin_coach" };
  return {
    tipo: abierto.status === "active" ? "activo" : "pendiente",
    coach,
    desde: abierto.acceptedAt ?? abierto.createdAt,
  };
}

export type Solicitud = { id: string; clientId: string; nombre: string; username: string | null; desde: Date };

/** Las solicitudes pendientes de un coach, la más vieja primero. */
export async function solicitudesDe(coachId: string): Promise<Solicitud[]> {
  const rows = await db
    .select({
      id: coachClients.id,
      clientId: coachClients.clientId,
      createdAt: coachClients.createdAt,
      username: users.username,
      displayName: users.displayName,
    })
    .from(coachClients)
    .innerJoin(users, eq(users.id, coachClients.clientId))
    .where(and(eq(coachClients.coachId, coachId), eq(coachClients.status, "pending")))
    .orderBy(asc(coachClients.createdAt));
  return rows.map((r) => ({ id: r.id, clientId: r.clientId, nombre: publicName(r), username: r.username, desde: r.createdAt }));
}
