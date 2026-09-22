import Link from "next/link";
import { sql } from "drizzle-orm";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { users, routines } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { blobConfigured, pendingGifIds } from "@/lib/blob";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { MirrorGifsButton } from "@/components/MirrorGifsButton";

export const dynamic = "force-dynamic";
// Cada tanda de copiado baja unos gifs de ExerciseDB antes de responder.
export const maxDuration = 30;

export default async function AdminPage() {
  const adminId = await requireAdmin();

  const [allUsers, counts] = await Promise.all([
    db
      .select({ id: users.id, username: users.username, createdAt: users.createdAt })
      .from(users)
      .orderBy(users.username),
    db
      .select({ userId: routines.userId, count: sql<number>`count(*)::int` })
      .from(routines)
      .groupBy(routines.userId),
  ]);
  const countByUser = new Map(counts.map((c) => [c.userId, c.count]));
  // Mantenimiento: respaldar los gifs es plomería, no algo de lo que el usuario
  // se tenga que enterar, así que vive aquí y no en Perfil.
  const pendingGifs = blobConfigured() ? (await pendingGifIds(adminId)).length : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Administrador"
        subtitle="Elige un usuario para armarle rutinas"
        backHref="/perfil"
      />

      <SectionTitle>Usuarios</SectionTitle>

      <ul className="flex flex-col gap-3">
        {allUsers.map((u) => (
          <li key={u.id}>
            <Link href={`/admin/usuarios/${u.id}`}>
              <Card className="flex items-center gap-3 p-3 transition active:scale-[0.99]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[18px] font-bold uppercase text-muted">
                  {(u.username ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold capitalize">
                    {u.username ?? "Sin usuario"}
                    {u.id === adminId && (
                      <span className="ml-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-muted">
                        <ShieldCheck className="h-3 w-3" /> tú
                      </span>
                    )}
                  </p>
                  <p className="text-[13px] text-muted">
                    {countByUser.get(u.id) ?? 0} {(countByUser.get(u.id) ?? 0) === 1 ? "rutina" : "rutinas"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      {blobConfigured() && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Mantenimiento</SectionTitle>
          <Card className="flex flex-col gap-3 p-4">
            <p className="text-[13px] text-muted">
              Respaldo de los gifs del catálogo en nuestro propio almacenamiento. Los
              ejercicios nuevos se copian solos al agregarlos; esto alcanza a los viejos.
            </p>
            <MirrorGifsButton pending={pendingGifs} />
          </Card>
        </section>
      )}
    </div>
  );
}
