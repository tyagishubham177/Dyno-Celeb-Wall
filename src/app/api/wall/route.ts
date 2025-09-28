import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { resolveWallInstances } from "@/lib/wall";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const db = getDb();
    const roster = await db
      .select({
        id: schema.celebs.id,
        name: schema.celebs.name,
        imageUrl: schema.celebs.imageUrl,
        elo: schema.celebs.elo,
        matches: schema.celebs.matches,
      })
      .from(schema.celebs);

    const wall = resolveWallInstances(roster);

    return NextResponse.json(
      {
        wall,
        roster,
        generatedAt: new Date().toISOString(),
        count: wall.length,
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch wall data", error);
    return NextResponse.json(
      { error: "Failed to fetch wall data" },
      { status: 500 },
    );
  }
}
