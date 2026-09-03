"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";

export function ExerciseThumb({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-black/5 dark:bg-white/10 ${className}`}
      >
        <Dumbbell className="h-1/3 w-1/3 text-black/25 dark:text-white/25" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
