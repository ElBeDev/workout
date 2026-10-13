import { avatarUrl } from "@/lib/avatar";

/** Sin foto: la inicial sobre uno de los colores de los anillos, fijo por persona. */
const TONES = [
  "bg-load/15 text-load",
  "bg-sets/15 text-sets",
  "bg-days/15 text-days",
  "bg-accent/15 text-accent",
];

function toneFor(userId: string): string {
  let h = 0;
  for (const ch of userId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

/** Foto de perfil redonda, o la inicial si no hay (docs/gamificacion.md §5). */
export function Avatar({
  userId,
  name,
  updatedAt,
  size = 40,
  className = "",
}: {
  userId: string;
  name: string;
  updatedAt: Date | null | undefined;
  size?: number;
  className?: string;
}) {
  const src = avatarUrl(userId, updatedAt);
  const style = { width: size, height: size };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        style={style}
        className={`shrink-0 rounded-full bg-surface-2 object-cover ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ ...style, fontSize: Math.round(size * 0.42) }}
      className={`flex shrink-0 items-center justify-center rounded-full font-bold uppercase ${toneFor(userId)} ${className}`}
    >
      {name.trim().charAt(0) || "?"}
    </span>
  );
}
