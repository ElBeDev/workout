import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { and, asc, eq, ilike, SQL } from "drizzle-orm";

const PAGE_SIZE = 24;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const bodyPart = req.nextUrl.searchParams.get("bodyPart")?.trim() ?? "";
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? 0);

  if (q.length > 0 && q.length < 2) {
    return NextResponse.json({ items: [], hasMore: false });
  }

  const conditions: SQL[] = [];
  if (q.length >= 2) conditions.push(ilike(exercises.name, `%${q}%`));
  if (bodyPart) conditions.push(eq(exercises.bodyPart, bodyPart));

  const results = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      bodyPart: exercises.bodyPart,
      equipment: exercises.equipment,
      gifUrl: exercises.gifUrl,
    })
    .from(exercises)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(exercises.name))
    .limit(PAGE_SIZE + 1)
    .offset(offset);

  const hasMore = results.length > PAGE_SIZE;
  return NextResponse.json({
    items: results.slice(0, PAGE_SIZE),
    hasMore,
  });
}
