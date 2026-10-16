import { requireOwner } from "@/lib/coach";
import { getDict } from "@/i18n";
import { blobConfigured, pendingGifIds } from "@/lib/blob";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { MirrorGifsButton } from "@/components/MirrorGifsButton";
import { BlobDiagnostics } from "@/components/BlobDiagnostics";

export const dynamic = "force-dynamic";
// Cada tanda de copiado baja unos gifs de ExerciseDB antes de responder.
export const maxDuration = 30;

/**
 * Panel del dueño de la plataforma (`users.is_admin`, docs/coaches.md §8).
 * Por ahora sólo el mantenimiento: respaldar los gifs es plomería, no algo de
 * lo que un coach o un alumno se tenga que enterar. La lista de coaches y sus
 * planes llega con el paso 6.
 */
export default async function AdminPage() {
  const ownerId = await requireOwner();
  const t = await getDict();
  const pendingGifs = blobConfigured() ? (await pendingGifIds(ownerId)).length : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.admin.dueno.titulo} subtitle={t.admin.dueno.subtitulo} backHref="/perfil" />

      <section className="flex flex-col gap-3">
        <SectionTitle>{t.admin.mantenimiento}</SectionTitle>
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-[13px] text-muted">{t.admin.respaldoExplicacion}</p>
          {blobConfigured() ? (
            <MirrorGifsButton pending={pendingGifs} />
          ) : (
            <p className="rounded-xl bg-warning/12 px-3 py-2 text-[13px] font-semibold text-warning">
              {t.admin.respaldoSinToken}
            </p>
          )}
          <BlobDiagnostics />
        </Card>
      </section>
    </div>
  );
}
