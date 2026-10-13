"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { AVATAR_SIZE } from "@/lib/avatar";
import { deleteAvatar, uploadAvatar } from "@/app/perfil/actions";
import { Avatar } from "./Avatar";

/**
 * Recorta al centro y reduce a 256 × 256 en JPEG antes de subir: una foto del
 * iPhone pesa varios MB y aquí queda en unos 15 KB (docs/gamificacion.md §5).
 * El navegador ya aplica la orientación EXIF al dibujar la imagen.
 */
async function toSquareJpeg(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE
    );
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.85)
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AvatarPicker({
  userId,
  name,
  updatedAt,
}: {
  userId: string;
  name: string;
  updatedAt: Date | null;
}) {
  const t = useT();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("avatar", await toSquareJpeg(file), "avatar.jpg");
        const res = await uploadAvatar(fd);
        if (!res.ok) {
          setError(t.perfil.foto.error);
          return;
        }
        router.refresh();
      } catch {
        setError(t.perfil.foto.noSeLeyo);
      }
    });
  }

  function onRemove() {
    setError(null);
    startTransition(async () => {
      await deleteAvatar();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={pending}
        aria-label={updatedAt ? t.perfil.foto.cambiar : t.perfil.foto.subir}
        className="relative rounded-full transition active:scale-95"
      >
        <Avatar userId={userId} name={name} updatedAt={updatedAt} size={72} />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-primary text-primary-foreground">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </span>
      </button>
      <input ref={input} type="file" accept="image/*" onChange={onPick} className="sr-only" tabIndex={-1} />
      {updatedAt && !pending && (
        <button type="button" onClick={onRemove} className="text-[12px] font-semibold text-muted">
          {t.perfil.foto.quitar}
        </button>
      )}
      {error && <p className="max-w-[9rem] text-center text-[12px] font-semibold text-danger">{error}</p>}
    </div>
  );
}
