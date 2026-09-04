import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { and, asc, eq, ilike, or, SQL } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/session";

const PAGE_SIZE = 24;

export async function GET(req: NextRequest) {
  if (!(await getCurrentUserId())) {
    return NextResponse.json({ items: [], hasMore: false }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const bodyPart = req.nextUrl.searchParams.get("bodyPart")?.trim() ?? "";
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? 0);

  if (q.length > 0 && q.length < 2) {
    return NextResponse.json({ items: [], hasMore: false });
  }

  const conditions: SQL[] = [];
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
      gifUrl: exercises.gifUrl,
      instructions: exercises.instructions,
    })
    .from(exercises)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(exercises.nameEs), asc(exercises.name))
    .limit(PAGE_SIZE + 1)
    .offset(offset);

  const hasMore = results.length > PAGE_SIZE;
  return NextResponse.json({
    items: results.slice(0, PAGE_SIZE),
    hasMore,
  });
}
