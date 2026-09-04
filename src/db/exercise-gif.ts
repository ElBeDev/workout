import { sql } from "drizzle-orm";
import { exercises } from "./schema";

/** Prefer our mirrored copy, fall back to the ExerciseDB URL. */
export const exerciseGif = sql<string | null>`coalesce(${exercises.gifBlobUrl}, ${exercises.gifUrl})`;

export function pickGif(row: { gifBlobUrl?: string | null; gifUrl?: string | null }) {
  return row.gifBlobUrl ?? row.gifUrl ?? null;
}
