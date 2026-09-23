import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { KeyRound, Scale, Trash2, Plus, ShieldAlert, ShieldCheck, Download, ChevronRight, Target } from "lucide-react";
import { db } from "@/db";
import { users, bodyWeights } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { fmtDate } from "@/lib/dates";
import { getDict } from "@/i18n";
import {
  Card,
  GroupedList,
  Input,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
} from "@/components/ui";
import { BodyWeightChart } from "@/components/BodyWeightChart";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { SoundToggle } from "@/components/SoundToggle";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { LogoutButton } from "@/components/LogoutButton";
import { changePasswordAction, addBodyWeight, deleteBodyWeight, updateGoals } from "./actions";

export const dynamic = "force-dynamic";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const t = await getDict();
  const errores: Record<string, string> = t.perfil.contrasena.errores;
  const userId = await requireUserId();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const initial = (user?.username ?? "?").charAt(0).toUpperCase();

  const weights = await db
    .select()
    .from(bodyWeights)
    .where(eq(bodyWeights.userId, userId))
    .orderBy(desc(bodyWeights.loggedAt))
    .limit(30);

  const chart = [...weights]
    .reverse()
    .map((w) => ({
      date: fmtDate(w.loggedAt, { day: "2-digit", month: "short" }, t.comun.intl),
      weight: Number(w.weight),
    }));

  const latest = weights[0] ? Number(weights[0].weight) : null;
  const first = weights.length > 1 ? Number(weights[weights.length - 1].weight) : null;
  const delta = latest !== null && first !== null ? Math.round((latest - first) * 10) / 10 : null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t.perfil.titulo} />

      <Card className="flex items-center gap-4 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[26px] font-bold uppercase text-muted">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[22px] font-bold capitalize tracking-[-0.02em]">
            {user?.username}
          </p>
          {user?.createdAt && (
            <p className="text-[13px] text-muted">
              {t.perfil.miembroDesde(fmtDate(user.createdAt, { month: "long", year: "numeric" }, t.comun.intl))}
            </p>
          )}
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t.perfil.idioma.titulo}</SectionTitle>
        <LanguageSwitch />
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t.perfil.apariencia.titulo}</SectionTitle>
        <ThemeSwitch />
        <GroupedList>
          <SoundToggle />
        </GroupedList>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t.perfil.metas.titulo}</SectionTitle>
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-[13px] text-muted">{t.perfil.metas.explicacion}</p>
          <form action={updateGoals} className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <label className="label text-load">
                {t.perfil.metas.carga}
                <Input
                  name="volume"
                  type="number"
                  min={100}
                  step={100}
                  defaultValue={user?.goalWeeklyVolumeKg ?? 5000}
                  className="mt-1 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </label>
              <label className="label text-sets">
                {t.perfil.metas.series}
                <Input
                  name="sets"
                  type="number"
                  min={1}
                  defaultValue={user?.goalWeeklySets ?? 60}
                  className="mt-1 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </label>
              <label className="label text-days">
                {t.perfil.metas.dias}
                <Input
                  name="days"
                  type="number"
                  min={1}
                  max={7}
                  defaultValue={user?.goalWeeklyDays ?? 4}
                  className="mt-1 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </label>
            </div>
            <SecondaryButton type="submit" className="w-full">
              <Target className="h-4 w-4" />
              {t.perfil.metas.guardar}
            </SecondaryButton>
          </form>
        </Card>
      </section>

      {user?.isAdmin && (
        <GroupedList>
          <Link href="/admin" className="flex items-center gap-3 p-4 transition active:bg-surface-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-semibold">{t.perfil.admin.titulo}</p>
              <p className="text-[13px] text-muted">{t.perfil.admin.descripcion}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
          </Link>
        </GroupedList>
      )}

      <Card className="flex flex-col gap-3 p-4">
        <SectionTitle className="flex items-center gap-2">
          <Scale className="h-3.5 w-3.5" /> {t.perfil.peso.titulo}
        </SectionTitle>

        {latest !== null && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="label text-muted">{t.perfil.peso.ultimoRegistro}</p>
              <p className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] tabular-nums">
                {latest}
                <span className="ml-1 text-[13px] font-semibold text-muted">{t.perfil.peso.kg}</span>
              </p>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="label text-muted">{t.perfil.peso.desdeElPrimero}</p>
              <p
                className={`mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] tabular-nums ${
                  delta === null || delta === 0 ? "" : delta > 0 ? "text-load" : "text-sets"
                }`}
              >
                {delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
                <span className="ml-1 text-[13px] font-semibold text-muted">{t.perfil.peso.kg}</span>
              </p>
            </div>
          </div>
        )}

        {chart.length > 1 && <BodyWeightChart data={chart} />}

        <form action={addBodyWeight} className="flex gap-2">
          <Input
            name="weight"
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder={t.perfil.peso.placeholder}
            required
            className="flex-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="submit"
            aria-label={t.perfil.peso.guardar}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </form>

        {weights.length > 0 && (
          <ul className="flex flex-col gap-1">
            {weights.slice(0, 5).map((w) => (
              <li key={w.id} className="flex items-center justify-between text-[14px]">
                <span className="text-muted">
                  {fmtDate(w.loggedAt, { dateStyle: "medium" }, t.comun.intl)}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">{t.perfil.peso.enKg(Number(w.weight))}</span>
                  <form action={deleteBodyWeight.bind(null, w.id)}>
                    <button
                      type="submit"
                      aria-label={t.perfil.peso.borrar}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <SectionTitle className="flex items-center gap-2">
          <KeyRound className="h-3.5 w-3.5" /> {t.perfil.contrasena.titulo}
        </SectionTitle>

        {error && errores[error] && (
          <p className="rounded-xl bg-danger/10 px-4 py-3 text-[14px] font-semibold text-danger">
            {errores[error]}
          </p>
        )}
        {ok === "password" && (
          <p className="rounded-xl bg-sets/12 px-4 py-3 text-[14px] font-semibold text-sets">
            {t.perfil.contrasena.actualizada}
          </p>
        )}

        <form action={changePasswordAction} className="flex flex-col gap-2">
          <Input name="current" type="password" placeholder={t.perfil.contrasena.actual} required autoComplete="current-password" />
          <Input name="next" type="password" placeholder={t.perfil.contrasena.nueva} required minLength={4} autoComplete="new-password" />
          <Input name="confirm" type="password" placeholder={t.perfil.contrasena.repetir} required minLength={4} autoComplete="new-password" />
          <PrimaryButton type="submit" className="mt-1">{t.perfil.contrasena.actualizar}</PrimaryButton>
        </form>

        <p className="flex items-start gap-2 text-[12px] text-muted">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t.perfil.contrasena.aviso}
        </p>
      </Card>

      <a
        href="/api/export"
        download
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-surface-2 px-5 text-[15px] font-semibold text-foreground"
      >
        <Download className="h-4 w-4" />
        {t.perfil.exportar}
      </a>

      <LogoutButton />
    </div>
  );
}
