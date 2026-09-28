import Link from "next/link";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import type { CoachComment } from "@/db/gym";
import type { Dict } from "@/i18n";
import { fmtDate } from "@/lib/dates";
import { Card, SectionTitle } from "@/components/ui";
import { PendingButton } from "@/components/PendingButton";
import { addCoachComment, deleteCoachComment } from "@/app/admin/coach-actions";
import { markCoachCommentsRead } from "@/app/comentarios/actions";

/**
 * Comentarios del coach (docs/coach-y-retos.md). Componentes de servidor: el
 * diccionario tiene funciones y no cruza al cliente, así que viene por prop.
 */

function CommentBody({ c, t }: { c: CoachComment; t: Dict }) {
  return (
    <>
      <p className="whitespace-pre-wrap text-[15px] leading-snug">{c.body}</p>
      <p className="mt-1 text-[12px] text-muted">
        {c.authorName ?? t.coach.tuCoach} ·{" "}
        {fmtDate(c.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }, t.comun.intl)}
      </p>
    </>
  );
}

/** Los comentarios sobre una sesión, en su detalle. Nada si no hay. */
export function CoachCommentList({
  comments,
  t,
  deletable = false,
}: {
  comments: CoachComment[];
  t: Dict;
  /** El coach puede borrar lo que escribió; el socio no. */
  deletable?: boolean;
}) {
  if (comments.length === 0) return null;
  return (
    <Card className="flex flex-col gap-3 p-4">
      <SectionTitle className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4" /> {t.coach.comentariosSesion}
      </SectionTitle>
      <ul className="flex flex-col gap-3">
        {comments.map((c) => (
          <CommentItem key={c.id} c={c} t={t} deletable={deletable} />
        ))}
      </ul>
    </Card>
  );
}

function CommentItem({
  c,
  t,
  deletable,
  sessionHref,
}: {
  c: CoachComment;
  t: Dict;
  deletable: boolean;
  sessionHref?: string;
}) {
  return (
    <li className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <CommentBody c={c} t={t} />
        {sessionHref && c.sessionId && (
          <Link href={`${sessionHref}/${c.sessionId}`} className="text-[12px] font-semibold text-accent">
            {t.coach.sobreSesion(
              c.routineName ?? t.progreso.rutinaEliminada,
              c.sessionStartedAt ? fmtDate(c.sessionStartedAt, { day: "numeric", month: "short" }, t.comun.intl) : ""
            )}
          </Link>
        )}
        {deletable && (
          <p className={`mt-0.5 text-[12px] font-semibold ${c.readAt ? "text-sets" : "text-faint"}`}>
            {c.readAt ? t.coach.leido : t.coach.sinLeer}
          </p>
        )}
      </div>
      {deletable && (
        <form action={deleteCoachComment.bind(null, c.id)}>
          <button
            type="submit"
            aria-label={t.coach.borrar}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </form>
      )}
    </li>
  );
}

/** Tarjeta de Hoy con lo que el coach escribió y el socio no ha visto. */
export function CoachInbox({ comments, t }: { comments: CoachComment[]; t: Dict }) {
  if (comments.length === 0) return null;
  return (
    <Card className="border-accent/40 p-4">
      <p className="label flex items-center gap-2 text-accent">
        <MessageCircle className="h-4 w-4" /> {t.coach.deTuCoach}
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {comments.map((c) => (
          <li key={c.id} className="flex flex-col">
            <CommentBody c={c} t={t} />
            {c.sessionId && (
              <Link
                href={`/progreso/sesion/${c.sessionId}`}
                className="mt-1 text-[13px] font-semibold text-accent"
              >
                {t.coach.sobreSesion(
                  c.routineName ?? t.progreso.rutinaEliminada,
                  c.sessionStartedAt ? fmtDate(c.sessionStartedAt, { day: "numeric", month: "short" }, t.comun.intl) : ""
                )}
              </Link>
            )}
          </li>
        ))}
      </ul>
      <form action={markCoachCommentsRead} className="mt-4">
        <PendingButton className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-surface-2 text-[15px] font-semibold text-foreground transition active:scale-[0.98]">
          {t.coach.entendido}
        </PendingButton>
      </form>
    </Card>
  );
}

/** Lo que usa el coach para escribir: suelto (sessionId null) o sobre una sesión. */
export function CoachCommentForm({
  userId,
  sessionId = null,
  t,
}: {
  userId: string;
  sessionId?: string | null;
  t: Dict;
}) {
  return (
    <form action={addCoachComment.bind(null, userId, sessionId)} className="flex flex-col gap-2">
      <textarea
        name="body"
        rows={3}
        required
        maxLength={1000}
        placeholder={sessionId ? t.coach.escribirSesion : t.coach.escribir}
        className="w-full resize-none rounded-xl bg-surface-2 px-4 py-3 text-[17px] text-foreground outline-none focus:ring-2 focus:ring-accent"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-muted">{t.coach.avisoPush}</p>
        <PendingButton className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-[15px] font-semibold text-accent-foreground transition active:scale-95 disabled:opacity-60">
          <Send className="h-4 w-4" />
          {t.coach.enviar}
        </PendingButton>
      </div>
    </form>
  );
}

/** Todo lo que el coach le ha escrito a un socio, en su ficha. */
export function CoachCommentHistory({
  comments,
  userId,
  t,
}: {
  comments: CoachComment[];
  userId: string;
  t: Dict;
}) {
  if (comments.length === 0) {
    return <p className="text-[13px] text-muted">{t.coach.sinComentarios}</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {comments.map((c) => (
        <CommentItem key={c.id} c={c} t={t} deletable sessionHref={`/admin/usuarios/${userId}/sesion`} />
      ))}
    </ul>
  );
}
