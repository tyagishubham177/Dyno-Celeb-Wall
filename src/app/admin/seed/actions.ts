"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getDb, schema } from "@/db";
import { loadServerEnv } from "@/lib/env";
import {
  DUEL_NEXT_CACHE_TAG,
  WALL_CACHE_TAG,
  WALL_PATHS_TO_REVALIDATE,
} from "@/lib/cache";

export type SeedActionState = {
  status: "idle" | "success" | "error";
  message: string;
  inserted?: number;
  skipped?: number;
  warnings?: string[];
};

export const initialSeedState: SeedActionState = {
  status: "idle",
  message: "",
};

type ParsedEntry = {
  name: string;
  imageUrl: string;
};

const parseCsvRows = (csv: string) => {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const entries: ParsedEntry[] = [];
  const warnings: string[] = [];
  const dedupe = new Set<string>();

  lines.forEach((line, index) => {
    const normalized = line.toLowerCase().replace(/\s+/g, "");
    if (index === 0 && (normalized === "name,image_url" || normalized === "name,imageurl")) {
      return;
    }

    const [rawName, ...rest] = line.split(",");
    const name = rawName?.trim();
    const imageUrl = rest.join(",").trim();

    if (!name || !imageUrl) {
      warnings.push(`Row ${index + 1}: expected "name,image_url"`);
      return;
    }

    if (!/^https?:\/\//i.test(imageUrl)) {
      warnings.push(`Row ${index + 1}: image URL must start with http(s)`);
      return;
    }

    try {
      new URL(imageUrl);
    } catch {
      warnings.push(`Row ${index + 1}: invalid image URL`);
      return;
    }

    const key = `${name.toLowerCase()}::${imageUrl}`;

    if (dedupe.has(key)) {
      warnings.push(`Row ${index + 1}: duplicate entry skipped`);
      return;
    }

    dedupe.add(key);
    entries.push({ name, imageUrl });
  });

  return { entries, warnings };
};

export const seedRosterAction = async (
  _prevState: SeedActionState,
  formData: FormData,
): Promise<SeedActionState> => {
  const env = loadServerEnv();
  const submittedToken = formData.get("token");

  if (typeof submittedToken !== "string" || submittedToken.trim().length === 0) {
    return {
      status: "error",
      message: "Admin token is required.",
    };
  }

  if (submittedToken.trim() !== env.ADMIN_SEED_TOKEN) {
    return {
      status: "error",
      message: "Invalid admin token.",
    };
  }

  const csvRaw = formData.get("csv");

  if (typeof csvRaw !== "string" || csvRaw.trim().length === 0) {
    return {
      status: "error",
      message: "CSV rows are required.",
    };
  }

  const { entries, warnings } = parseCsvRows(csvRaw);

  if (!entries.length) {
    return {
      status: "error",
      message: warnings.length ? "No valid rows found." : "No rows provided.",
      warnings: warnings.length ? warnings : undefined,
    };
  }

  try {
    const db = getDb();
    const inserted = await db
      .insert(schema.celebs)
      .values(entries)
      .returning({ id: schema.celebs.id });

    for (const path of WALL_PATHS_TO_REVALIDATE) {
      revalidatePath(path);
    }

    revalidateTag(WALL_CACHE_TAG);
    revalidateTag(DUEL_NEXT_CACHE_TAG);

    return {
      status: "success",
      message: `Inserted ${inserted.length} celeb${inserted.length === 1 ? "" : "s"}.`,
      inserted: inserted.length,
      skipped: warnings.length,
      warnings: warnings.length ? warnings : undefined,
    };
  } catch (error) {
    console.error("Failed to seed roster", error);
    return {
      status: "error",
      message: "Failed to seed roster. Check server logs.",
    };
  }
};
