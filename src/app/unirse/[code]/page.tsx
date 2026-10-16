import Link from "next/link";
import { Users } from "lucide-react";
import { ElBeFit } from "@/components/ElBeFit";
import { Card, SecondaryButton } from "@/components/ui";
import { PendingButton } from "@/components/PendingButton";
import { getDict } from "@/i18n";
import { getCurrentUserId } from "@/lib/session";
import { coachPorCodigo } from "@/server/coaches";
import { estadoAlumno } from "@/server/vinculos";
import { irConInvitacion, unirmeDesdeLiga } from "./actions";

export const dynamic = "force-dynamic";

const primaryClass =
  "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-70";

/**
 * La liga que comparte un coach (docs/coaches.md §4.2 y §4.5). Se abre con o
 * sin sesión: sin sesión lleva a crear cuenta o a entrar con el código
 * guardado; con sesión, une al alumno (y si ya tenía coach, pregunta).
 */
export default async function UnirsePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ code }, { error }] = await Promise.all([params, searchParams]);
  const t = await getDict();
  const v = t.vinculos;
  const coach = await coachPorCodigo(decodeURIComponent(code));
  const userId = await getCurrentUserId();

  return (
    <div className="flex min-h-[85vh] flex-col justify-center gap-6">
      {!coach ? (
        <Card className="p-5 text-center text-[15px] text-muted">{v.unirse.noExiste}</Card>
      ) : (
        <>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-card bg-accent text-accent-foreground shadow-hero">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <p className="text-[15px] text-muted">{v.unirse.titulo}</p>
              <h1 className="text-[34px] font-bold capitalize leading-tight tracking-[-0.02em]">{coach.nombre}</h1>
              {coach.marca && <p className="text-[15px] font-semibold text-accent">{coach.marca}</p>}
            </div>
            <p className="max-w-xs text-[15px] text-muted">{v.unirse.subtitulo}</p>
          </div>

          {error && (
            <p className="rounded-xl bg-danger/10 px-4 py-3 text-[14px] font-semibold text-danger">
              {v.errores[error] ?? t.acceso.errorGenerico}
            </p>
          )}

          <Card className="flex flex-col gap-3 p-4">
            {userId ? <ConSesion userId={userId} code={coach.code} coachNombre={coach.nombre} coachId={coach.userId} /> : (
              <>
                <form action={irConInvitacion.bind(null, coach.code, "registro")}>
                  <PendingButton className={primaryClass}>{v.unirse.crearCuenta}</PendingButton>
                </form>
                <form action={irConInvitacion.bind(null, coach.code, "login")}>
                  <SecondaryButton type="submit" className="w-full">
                    {v.unirse.yaTengoCuenta}
                  </SecondaryButton>
                </form>
              </>
            )}
          </Card>
        </>
      )}

      <p className="text-center text-[13px] text-muted">
        GainLine · {t.acceso.hechoPor} <ElBeFit className="text-[16px] text-foreground/70" />
      </p>
    </div>
  );
}

async function ConSesion({
  userId,
  code,
  coachNombre,
  coachId,
}: {
  userId: string;
  code: string;
  coachNombre: string;
  coachId: string;
}) {
  const t = await getDict();
  const v = t.vinculos;
  const estado = await estadoAlumno(userId);

  if (estado.tipo === "activo" && estado.coach.userId === coachId) {
    return (
      <>
        <p className="text-center text-[15px]">{v.errores.ya_es_tu_coach}</p>
        <Link href="/" className={primaryClass}>
          {v.unirse.irAHoy}
        </Link>
      </>
    );
  }

  const cambia = estado.tipo === "activo";
  return (
    <>
      {cambia && <p className="text-[14px] text-muted">{v.unirse.yaEntrenasCon(estado.coach.nombre, coachNombre)}</p>}
      <form action={unirmeDesdeLiga.bind(null, code, cambia)}>
        <PendingButton className={primaryClass}>
          {cambia ? v.unirse.cambiarA(coachNombre) : v.unirse.entrenarCon(coachNombre)}
        </PendingButton>
      </form>
    </>
  );
}
