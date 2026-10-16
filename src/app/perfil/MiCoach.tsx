import Link from "next/link";
import { ChevronRight, Clock, Users } from "lucide-react";
import { Card, Input, SectionTitle } from "@/components/ui";
import { PendingButton } from "@/components/PendingButton";
import { ConfirmAction } from "@/components/ConfirmAction";
import { getDict } from "@/i18n";
import { fmtDate } from "@/lib/dates";
import { estadoAlumno } from "@/server/vinculos";
import { cancelarMiSolicitud, dejarMiCoach, pedirUnirme, unirmeConCodigo } from "./coach-actions";

const smallButton =
  "flex h-11 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-[15px] font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-70";

/**
 * Perfil → "Mi coach" (docs/coaches.md §4.3): con quién entrenas, la
 * solicitud que está esperando, o cómo unirte. Sólo para alumnos: un coach
 * no tiene coach.
 */
export async function MiCoach({ userId, coach, coachError }: { userId: string; coach?: string; coachError?: string }) {
  const t = await getDict();
  const v = t.vinculos;
  const estado = await estadoAlumno(userId);

  return (
    <section id="mi-coach" className="flex scroll-mt-4 flex-col gap-3">
      <SectionTitle>{v.miCoach.titulo}</SectionTitle>

      {coachError && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-[14px] font-semibold text-danger">
          {v.errores[coachError] ?? t.acceso.errorGenerico}
        </p>
      )}
      {estado.tipo === "activo" && coach === "unido" && (
        <p className="rounded-xl bg-sets/12 px-4 py-3 text-[14px] font-semibold text-sets">
          {v.miCoach.unido(estado.coach.nombre)}
        </p>
      )}
      {estado.tipo === "pendiente" && coach === "enviada" && (
        <p className="rounded-xl bg-sets/12 px-4 py-3 text-[14px] font-semibold text-sets">
          {v.miCoach.enviada(estado.coach.nombre)}
        </p>
      )}

      {estado.tipo === "activo" && (
        <Card className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold capitalize">{estado.coach.nombre}</p>
              {estado.coach.marca && <p className="truncate text-[13px] text-accent">{estado.coach.marca}</p>}
              <p className="text-[13px] text-muted">
                {v.miCoach.desde(fmtDate(estado.desde, { day: "numeric", month: "long", year: "numeric" }, t.comun.intl))}
              </p>
            </div>
          </div>
          <ConfirmAction
            label={v.miCoach.dejar}
            confirmText={v.miCoach.confirmarDejar}
            yesLabel={v.miCoach.siDejar}
            action={dejarMiCoach}
          />
        </Card>
      )}

      {estado.tipo === "pendiente" && (
        <Card className="flex flex-col gap-3 p-4">
          <p className="flex items-start gap-2 text-[15px]">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            <span>{v.miCoach.pendiente(estado.coach.nombre)}</span>
          </p>
          <form action={cancelarMiSolicitud}>
            <PendingButton className="w-full rounded-full border border-border bg-surface px-5 py-3 text-[15px] font-medium text-muted">
              {v.miCoach.cancelar}
            </PendingButton>
          </form>
        </Card>
      )}

      {estado.tipo === "sin_coach" && (
        <Card className="flex flex-col gap-4 p-4">
          <p className="text-[14px] text-muted">{v.miCoach.sinCoach}</p>
          <form action={unirmeConCodigo} className="flex flex-col gap-1.5">
            <label className="label text-muted" htmlFor="coach-code">
              {v.miCoach.codigo}
            </label>
            <div className="flex gap-2">
              <Input
                id="coach-code"
                name="code"
                required
                autoCapitalize="characters"
                placeholder={v.miCoach.codigoPlaceholder}
                className="min-w-0 flex-1 uppercase"
              />
              <PendingButton className={smallButton}>{v.miCoach.unirme}</PendingButton>
            </div>
          </form>
          <form action={pedirUnirme} className="flex flex-col gap-1.5">
            <label className="label text-muted" htmlFor="coach-username">
              {v.miCoach.usuario}
            </label>
            <div className="flex gap-2">
              <Input
                id="coach-username"
                name="username"
                required
                autoCapitalize="none"
                placeholder={v.miCoach.usuarioPlaceholder}
                className="min-w-0 flex-1"
              />
              <PendingButton className={smallButton}>{v.miCoach.pedir}</PendingButton>
            </div>
          </form>
          <Link href="/registro/coach" className="flex items-center justify-between border-t border-border pt-3 text-[15px]">
            <span className="text-muted">{v.miCoach.eresCoach}</span>
            <span className="flex items-center gap-1 font-semibold text-accent">
              {v.miCoach.hazteCoach}
              <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        </Card>
      )}
    </section>
  );
}
