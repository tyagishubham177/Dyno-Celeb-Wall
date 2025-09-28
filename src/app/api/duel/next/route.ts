import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { selectDuelPair } from "@/lib/duel";

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

    if (roster.length < 2) {
      return NextResponse.json(
        { error: "Not enough celebs to stage a duel" },
        { status: 400 },
      );
    }

    const pair = selectDuelPair(roster);

    return NextResponse.json(
      { pair },
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch next duel", error);
    return NextResponse.json(
      { error: "Failed to fetch next duel" },
      { status: 500 },
    );
  }
}


