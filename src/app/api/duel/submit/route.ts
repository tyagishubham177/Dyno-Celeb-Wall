import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { getDb, schema } from "@/db";
import { applyClampedUpdate, updateElo, type DuelOutcome } from "@/lib/elo";
import {
  DUEL_NEXT_CACHE_TAG,
  WALL_CACHE_TAG,
  WALL_PATHS_TO_REVALIDATE,
} from "@/lib/cache";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const isValidId = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

const isValidOutcome = (value: unknown): value is DuelOutcome => {
  return value === "a" || value === "b" || value === "tie";
};

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    console.error("Invalid JSON payload", error);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const { aId, bId, winner } = payload as {
    aId?: unknown;
    bId?: unknown;
    winner?: unknown;
  };

  if (!isValidId(aId) || !isValidId(bId) || aId === bId) {
    return NextResponse.json({ error: "Invalid combatant identifiers" }, { status: 400 });
  }

  if (!isValidOutcome(winner)) {
    return NextResponse.json({ error: "Invalid duel outcome" }, { status: 400 });
  }

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
      .from(schema.celebs)
      .where(inArray(schema.celebs.id, [aId, bId]));

    if (roster.length !== 2) {
      return NextResponse.json(
        { error: "Both combatants must exist" },
        { status: 400 },
      );
    }

    const celebA = roster.find((entry) => entry.id === aId)!;
    const celebB = roster.find((entry) => entry.id === bId)!;

    const { deltaA, deltaB } = updateElo({
      ratingA: celebA.elo,
      ratingB: celebB.elo,
      matchesA: celebA.matches,
      matchesB: celebB.matches,
      outcome: winner,
    });

    const nextA = applyClampedUpdate({ rating: celebA.elo, delta: deltaA });
    const nextB = applyClampedUpdate({ rating: celebB.elo, delta: deltaB });

    const updatedMatchesA = celebA.matches + 1;
    const updatedMatchesB = celebB.matches + 1;
    const winnerId =
      winner === "tie" ? null : winner === "a" ? celebA.id : celebB.id;

    await db.transaction(async (tx) => {
      await tx
        .update(schema.celebs)
        .set({ elo: nextA.rating, matches: updatedMatchesA })
        .where(eq(schema.celebs.id, celebA.id));

      await tx
        .update(schema.celebs)
        .set({ elo: nextB.rating, matches: updatedMatchesB })
        .where(eq(schema.celebs.id, celebB.id));

      await tx.insert(schema.duels).values({
        celebAId: celebA.id,
        celebBId: celebB.id,
        winnerId,
      });
    });

    for (const path of WALL_PATHS_TO_REVALIDATE) {
      revalidatePath(path);
    }

    revalidateTag(WALL_CACHE_TAG);
    revalidateTag(DUEL_NEXT_CACHE_TAG);

    return NextResponse.json({
      outcome: winner,
      duel: {
        a: {
          id: celebA.id,
          elo: nextA.rating,
          delta: nextA.delta,
          matches: updatedMatchesA,
        },
        b: {
          id: celebB.id,
          elo: nextB.rating,
          delta: nextB.delta,
          matches: updatedMatchesB,
        },
      },
    });
  } catch (error) {
    console.error("Failed to submit duel", error);
    return NextResponse.json(
      { error: "Failed to submit duel" },
      { status: 500 },
    );
  }
}
