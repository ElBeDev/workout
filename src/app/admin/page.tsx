import Link from "next/link";
import { sql } from "drizzle-orm";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { users, routines } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Administrador"
        subtitle="Elige un usuario para armarle rutinas"
        backHref="/perfil"
      />

      <ul className="flex flex-col gap-3">
        {allUsers.map((u) => (
          <li key={u.id}>
            <Link href={`/admin/usuarios/${u.id}`}>
              <Card className="flex items-center gap-3 p-3 transition active:scale-[0.99]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-[18px] font-bold text-accent-foreground">
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
    </div>
  );
}
