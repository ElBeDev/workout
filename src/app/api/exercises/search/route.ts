import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const results = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      bodyPart: exercises.bodyPart,
      equipment: exercises.equipment,
      gifUrl: exercises.gifUrl,
    })
    .from(exercises)
    .where(ilike(exercises.name, `%${q}%`))
    .limit(20);

  return NextResponse.json(results);
}
