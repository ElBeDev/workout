import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Card, Input, PrimaryButton } from "@/components/ui";
import { getDict } from "@/i18n";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = await getDict();
  const errores: Record<string, string | undefined> = t.acceso.login.errores;

  return (
    <div className="flex min-h-[85vh] flex-col justify-center gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-card bg-primary text-primary-foreground shadow-hero">
          <Dumbbell className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-[34px] font-bold tracking-[-0.02em]">Workout</h1>
          <p className="text-[15px] text-muted">{t.acceso.login.subtitulo}</p>
        </div>
      </div>

      <Card className="p-4">
        <form action={loginAction} className="flex flex-col gap-3">
          {error && (
            <p className="rounded-xl bg-danger/10 px-4 py-3 text-[14px] font-semibold text-danger">
              {errores[error] ?? t.acceso.errorGenerico}
            </p>
          )}

          <label className="label flex flex-col gap-1.5 text-muted">
            {t.acceso.login.usuario}
            <Input name="username" required autoCapitalize="none" autoComplete="username" />
          </label>

          <label className="label flex flex-col gap-1.5 text-muted">
            {t.acceso.login.contrasena}
            <Input name="password" type="password" required autoComplete="current-password" />
          </label>

          <PrimaryButton type="submit" className="mt-1">
            {t.acceso.login.entrar}
          </PrimaryButton>
        </form>
      </Card>

      <p className="text-center text-[15px] text-muted">
        {t.acceso.login.sinCuenta}{" "}
        <Link href="/registro" className="font-semibold text-accent">
          {t.acceso.login.registrate}
        </Link>
      </p>
    </div>
  );
}
