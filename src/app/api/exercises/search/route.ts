import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { exerciseGif } from "@/db/exercise-gif";
import { and, asc, desc, eq, ilike, isNull, or, SQL } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/session";

const PAGE_SIZE = 24;

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ items: [], hasMore: false }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const bodyPart = req.nextUrl.searchParams.get("bodyPart")?.trim() ?? "";
  const offsetRaw = Number(req.nextUrl.searchParams.get("offset") ?? 0);
  const offset = Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.min(Math.floor(offsetRaw), 5000) : 0;

  if (q.length > 0 && q.length < 2) {
    return NextResponse.json({ items: [], hasMore: false });
  }

  // Catalog rows plus this user's own custom exercises.
  const conditions: SQL[] = [or(isNull(exercises.userId), eq(exercises.userId, userId)) as SQL];
  if (q.length >= 2) {
    conditions.push(
      or(ilike(exercises.name, `%${q}%`), ilike(exercises.nameEs, `%${q}%`)) as SQL
    );
  }
  if (bodyPart) conditions.push(eq(exercises.bodyPart, bodyPart));

  const results = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      nameEs: exercises.nameEs,
      bodyPart: exercises.bodyPart,
      equipment: exercises.equipment,
      gifUrl: exerciseGif,
      instructions: exercises.instructions,
      isCustom: exercises.isCustom,
    })
    .from(exercises)
    .where(and(...conditions))
    .orderBy(desc(exercises.isCustom), asc(exercises.nameEs), asc(exercises.name), asc(exercises.id))
    .limit(PAGE_SIZE + 1)
    .offset(offset);

  const hasMore = results.length > PAGE_SIZE;
  return NextResponse.json({
    items: results.slice(0, PAGE_SIZE),
    hasMore,
  });
}
