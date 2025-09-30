"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { loadServerEnv } from "@/lib/env";
import { DUEL_NEXT_CACHE_TAG, WALL_CACHE_TAG, WALL_PATHS_TO_REVALIDATE } from "@/lib/cache";

type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const updateCelebAction = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  const env = loadServerEnv();
  const token = formData.get("token");
  const idRaw = formData.get("id");
  const name = (formData.get("name") ?? "").toString().trim();
  const imageUrl = (formData.get("imageUrl") ?? "").toString().trim();

  if (typeof token !== "string" || token.trim() !== env.ADMIN_SEED_TOKEN) {
    return { status: "error", message: "Invalid admin token" };
  }

  const id = Number(idRaw);
  if (!Number.isFinite(id) || id <= 0) {
    return { status: "error", message: "Invalid celeb id" };
  }
  if (!name || !imageUrl) {
    return { status: "error", message: "Name and image URL are required" };
  }
  if (!/^https?:\/\//i.test(imageUrl)) {
    return { status: "error", message: "Image URL must start with http(s)" };
  }

  try {
    const db = getDb();
    await db.update(schema.celebs).set({ name, imageUrl }).where(eq(schema.celebs.id, id));
    for (const path of WALL_PATHS_TO_REVALIDATE) revalidatePath(path);
    revalidateTag(WALL_CACHE_TAG);
    revalidateTag(DUEL_NEXT_CACHE_TAG);
    return { status: "success", message: "Updated" };
  } catch (error) {
    console.error("updateCelebAction", error);
    return { status: "error", message: "Failed to update celeb" };
  }
};

export const deleteCelebAction = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  const env = loadServerEnv();
  const token = formData.get("token");
  const idRaw = formData.get("id");

  if (typeof token !== "string" || token.trim() !== env.ADMIN_SEED_TOKEN) {
    return { status: "error", message: "Invalid admin token" };
  }
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id <= 0) {
    return { status: "error", message: "Invalid celeb id" };
  }

  try {
    const db = getDb();
    await db.delete(schema.celebs).where(eq(schema.celebs.id, id));
    for (const path of WALL_PATHS_TO_REVALIDATE) revalidatePath(path);
    revalidateTag(WALL_CACHE_TAG);
    revalidateTag(DUEL_NEXT_CACHE_TAG);
    return { status: "success", message: "Deleted" };
  } catch (error) {
    console.error("deleteCelebAction", error);
    return { status: "error", message: "Failed to delete celeb" };
  }
};
