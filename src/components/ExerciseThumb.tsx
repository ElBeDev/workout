"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";

/**
 * Los gifs del catálogo son de 180×180 con el fondo blanco quemado, así que en
 * vez de pelearse con eso se les da un "escenario" propio: una tarjeta clara
 * con degradado y hairline, el dibujo contenido con aire, y un esqueleto
 * mientras carga en lugar del destello blanco. Nunca se amplía más allá de lo
 * que la fuente aguanta (ver docs/diseno-apple-fitness.md §5.1).
 */
export function ExerciseThumb({
  src,
  alt,
  className = "",
  eager = false,
  aire = true,
}: {
  src: string | null;
  alt: string;
  className?: string;
  /** El héroe de la hoja carga de inmediato; las miniaturas de lista, no. */
  eager?: boolean;
  /** Margen interno para que la figura no toque el borde. */
  aire?: boolean;
}) {
  const [estado, setEstado] = useState<"cargando" | "ok" | "falla">(src ? "cargando" : "falla");

  return (
    <div
      /* Blanco plano, no degradado: el gif trae su propio fondo blanco y
         cualquier degradado delata el recuadro. En oscuro se baja el brillo
         para que la lámina no deslumbre sobre el negro. */
      /* El atenuado va en el contenedor, no en la imagen: si solo se atenúa la
         imagen, el relleno del recuadro queda blanco y se ve un marco. */
      className={`relative isolate overflow-hidden bg-white dark:brightness-[0.87] ${className}`}
    >
      {/* Hairline interior: hace que el recuadro claro se lea como parte del
          diseño y no como un hueco blanco, sobre todo en modo oscuro. */}
      <span className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] ring-1 ring-inset ring-black/[0.07]" />

      {estado === "cargando" && (
        <span className="absolute inset-0 z-10 animate-pulse bg-[#e9eaee] dark:bg-[#d2d2d6]" />
      )}

      {estado !== "falla" && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setEstado("ok")}
          onError={() => setEstado("falla")}
          className={`h-full w-full object-contain transition-opacity duration-200 ${
            aire ? "p-[4%]" : ""
          } ${estado === "ok" ? "opacity-100" : "opacity-0"}`}
        />
      ) : (
        <span className="absolute inset-0 z-30 flex items-center justify-center bg-surface-2 text-faint">
          <Dumbbell className="h-1/3 w-1/3" />
        </span>
      )}
    </div>
  );
}
