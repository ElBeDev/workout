import { eq } from "drizzle-orm";
import { LogOut } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { Card, PageHeader, SecondaryButton } from "@/components/ui";
import { logoutAction } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const userId = await requireUserId();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const initial = (user?.username ?? "?").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Perfil" />

      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-[32px] font-bold text-accent-foreground">
          {initial}
        </div>
        <div>
          <p className="text-[18px] font-semibold capitalize">{user?.username}</p>
          {user?.createdAt && (
            <p className="text-[13px] text-muted">
              Desde{" "}
              {new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(
                user.createdAt
              )}
            </p>
          )}
        </div>
      </Card>

      <form action={logoutAction}>
        <SecondaryButton type="submit" className="w-full text-danger">
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </SecondaryButton>
      </form>
    </div>
  );
}
