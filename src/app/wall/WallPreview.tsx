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

  const leaders = useMemo(() => wall.slice(0, 5), [wall]);
  const totalMatches = useMemo(
    () =>
      wall.reduce((accumulator, instance) => {
        return accumulator + instance.matches;
      }, 0),
    [wall],
  );

  return (
    <div className="relative h-full">
      <DynamicWallScene wall={wall} />
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="pointer-events-auto min-w-[220px] rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-4 shadow-xl shadow-black/30 backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Wall status
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-50">
              {statusLabel(wall, loading, error, readableTimestamp)}
            </p>
            {wall.length > 0 ? (
              <p className="mt-3 text-xs text-slate-400">
                {totalMatches} total matches represented | data hydrates in real time
              </p>
            ) : null}
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadWall()}
              disabled={loading}
              className="rounded-full border border-white/20 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/40 hover:bg-slate-900/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh
            </button>
          </div>
        </div>
        {leaders.length > 0 && !error ? (
          <div className="pointer-events-auto w-full max-w-xl px-6 pb-6">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                <span>Leaderboard</span>
                {readableTimestamp ? <span>Updated {readableTimestamp}</span> : null}
              </div>
              <ul className="mt-4 space-y-3">
                {leaders.map((instance) => (
                  <li
                    key={instance.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold">
                        {instance.order + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-50">{instance.name}</p>
                        <p className="text-xs text-slate-300">
                          Elo {instance.elo} | Matches {instance.matches}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-200">
                      Score {Math.round(instance.score)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
      {error ? (
        <div className="pointer-events-auto absolute inset-x-0 bottom-6 mx-auto flex max-w-xs flex-col items-center gap-3 rounded-2xl border border-rose-400/50 bg-rose-500/10 px-4 py-3 text-center text-xs text-rose-100 shadow-lg shadow-rose-900/40">
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
