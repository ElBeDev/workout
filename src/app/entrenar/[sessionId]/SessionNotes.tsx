"use client";

import { useRef } from "react";
import { NotebookPen } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import { saveNotes } from "./actions";

export function SessionNotes({
  sessionId,
  notes,
}: {
  sessionId: string;
  notes: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card className="flex flex-col gap-2 p-4">
      <SectionTitle className="flex items-center gap-2">
        <NotebookPen className="h-4 w-4 text-muted" />
        Notas de hoy
      </SectionTitle>
      <form ref={formRef} action={saveNotes.bind(null, sessionId)}>
        <textarea
          name="notes"
          defaultValue={notes ?? ""}
          rows={3}
          placeholder="¿Cómo te sentiste? ¿Algo que ajustar la próxima vez?"
          onBlur={(e) => {
            if (e.target.value.trim() !== (notes ?? "")) formRef.current?.requestSubmit();
          }}
          className="w-full resize-none rounded-2xl border border-border bg-surface-2 px-4 py-3 text-[15px] text-foreground outline-none focus:ring-2 focus:ring-accent"
        />
      </form>
      <p className="text-[11px] text-muted">Se guarda solo al salir del campo.</p>
    </Card>
  );
}
