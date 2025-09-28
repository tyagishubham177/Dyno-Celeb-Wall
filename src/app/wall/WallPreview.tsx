"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { WallInstance } from "@/lib/wall";

const DynamicWallScene = dynamic(() => import("@/components/wall/WallScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      Initializing canvas...
    </div>
  ),
});

const statusLabel = (
  wall: WallInstance[],
  loading: boolean,
  error: string | null,
  timestamp: string | null,
) => {
  if (loading) {
    return "Loading wall...";
  }

  if (error) {
    return error;
  }

  if (wall.length === 0) {
    return "No celebs seeded yet.";
  }

  return `${wall.length} on the wall${timestamp ? ` (refreshed ${timestamp})` : ""}`;
};

const formatTimestamp = (value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleTimeString();
  } catch {
    return null;
  }
};

const WallPreview = () => {
  const [wall, setWall] = useState<WallInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const loadWall = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/wall", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as {
        wall?: WallInstance[];
        generatedAt?: string;
      };

      setWall(Array.isArray(data.wall) ? data.wall : []);
      setGeneratedAt(data.generatedAt ?? new Date().toISOString());
    } catch (err) {
      console.error("Failed to load wall", err);
      setWall([]);
      setError("Unable to load wall data. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWall();
  }, [loadWall]);

  const readableTimestamp = useMemo(
    () => formatTimestamp(generatedAt),
    [generatedAt],
  );

  return (
    <div className="relative h-full">
      <DynamicWallScene wall={wall} />
      <div className="pointer-events-none absolute inset-0 flex items-start justify-between p-4 text-xs">
        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-slate-300">
          {statusLabel(wall, loading, error, readableTimestamp)}
        </span>
        <div className="pointer-events-auto flex gap-2">
          <button
            type="button"
            onClick={() => void loadWall()}
            disabled={loading}
            className="rounded-full border border-white/20 bg-slate-900/60 px-3 py-1 text-slate-100 transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
      </div>
      {error ? (
        <div className="pointer-events-auto absolute inset-x-0 bottom-6 mx-auto flex max-w-xs flex-col items-center gap-3 rounded-2xl border border-rose-400/50 bg-rose-500/10 px-4 py-3 text-center text-xs text-rose-100">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadWall()}
            className="rounded-full border border-rose-300/60 px-3 py-1 font-semibold text-rose-100 transition hover:border-rose-100"
          >
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default WallPreview;
