"use client";

import { useRef } from "react";
import { NotebookPen } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import { useT } from "@/i18n/client";
import { saveNotes } from "./actions";

export function SessionNotes({
  sessionId,
  notes,
}: {
  sessionId: string;
  notes: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const t = useT();

  return (
    <Card className="flex flex-col gap-2 p-4">
      <SectionTitle className="flex items-center gap-2">
        <NotebookPen className="h-4 w-4 text-muted" />
        {t.entrenar.notas.titulo}
      </SectionTitle>
      <form ref={formRef} action={saveNotes.bind(null, sessionId)}>
        <textarea
          name="notes"
          defaultValue={notes ?? ""}
          rows={3}
          placeholder={t.entrenar.notas.placeholder}
          onBlur={(e) => {
            if (!navigator.onLine) return; // keep the text; it saves on the next blur with signal
            if (e.target.value.trim() !== (notes ?? "")) formRef.current?.requestSubmit();
          }}
          className="w-full resize-none rounded-xl bg-surface-2 px-4 py-3 text-[17px] text-foreground outline-none focus:ring-2 focus:ring-accent"
        />
      </form>
      <p className="text-[11px] text-muted">{t.entrenar.notas.ayuda}</p>
    </Card>
  );
}
