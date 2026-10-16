import Link from "next/link";
import { Users } from "lucide-react";
import { ElBeFit } from "@/components/ElBeFit";
import { Card, Input } from "@/components/ui";
import { PendingButton } from "@/components/PendingButton";
import { getDict } from "@/i18n";
import { getCurrentUserId } from "@/lib/session";
import { registrarCoach } from "./actions";
import { Consentimiento } from "@/components/Consentimiento";

export const dynamic = "force-dynamic";

/** "Soy coach" (docs/coaches.md §4.1): cuenta nueva, o la propia convertida. */
export default async function RegistroCoachPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = await getDict();
  const r = t.vinculos.registroCoach;
  const conSesion = Boolean(await getCurrentUserId());

  return (
    <div className="flex min-h-[85vh] flex-col justify-center gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-card bg-accent text-accent-foreground shadow-hero">
          <Users className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-[34px] font-bold tracking-[-0.02em]">{r.titulo}</h1>
          <p className="text-[15px] text-muted">{conSesion ? r.subtituloConCuenta : r.subtitulo}</p>
        </div>
      </div>

      <Card className="p-4">
        <form action={registrarCoach} className="flex flex-col gap-3">
          {error && (
            <p className="rounded-xl bg-danger/10 px-4 py-3 text-[14px] font-semibold text-danger">
              {r.errores[error] ?? t.acceso.errorGenerico}
            </p>
          )}

          {!conSesion && (
            <>
              <label className="label flex flex-col gap-1.5 text-muted">
                {r.usuario}
                <Input name="username" required minLength={3} autoCapitalize="none" autoComplete="username" />
              </label>
              <label className="label flex flex-col gap-1.5 text-muted">
                {r.contrasena}
                <Input name="password" type="password" required minLength={4} autoComplete="new-password" />
              </label>
              <label className="label flex flex-col gap-1.5 text-muted">
                {r.nombre}
                <Input name="displayName" maxLength={40} placeholder={r.nombrePlaceholder} />
              </label>
            </>
          )}

          <label className="label flex flex-col gap-1.5 text-muted">
            {r.marca}
            <Input name="brandName" maxLength={60} placeholder={r.marcaPlaceholder} />
          </label>

          <PendingButton className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-70">
            {conSesion ? r.convertir : r.crear}
          </PendingButton>

          <p className="text-center text-[12px] text-muted">{r.prueba}</p>
          {!conSesion && <p className="text-center text-[12px] text-muted">{t.acceso.registro.avisoSinCorreo}</p>}
          <Consentimiento t={t} />
        </form>
      </Card>

      {!conSesion && (
        <p className="text-center text-[15px] text-muted">
          {t.acceso.registro.yaTienesCuenta}{" "}
          <Link href="/login" className="font-semibold text-accent">
            {t.acceso.registro.iniciaSesion}
          </Link>
        </p>
      )}

      <p className="text-center text-[13px] text-muted">
        {t.acceso.hechoPor} <ElBeFit className="text-[16px] text-foreground/70" />
      </p>
    </div>
  );
}
