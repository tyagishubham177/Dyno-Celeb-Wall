"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type DuelContestant = {
  id: number;
  name: string;
  imageUrl: string;
  elo: number;
  matches: number;
};

type DuelPair = {
  a: DuelContestant;
  b: DuelContestant;
};

const VOTE_CACHE_KEY = "dyno-recent-votes";
const VOTE_COOLDOWN_MS = 60_000;

type VoteCache = Record<string, number>;

const getPairKey = (aId: number, bId: number) => {
  return [aId, bId].sort((lhs, rhs) => lhs - rhs).join(":");
};

const readCache = (): VoteCache => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(VOTE_CACHE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as VoteCache;
    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
};

const persistCache = (cache: VoteCache) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(VOTE_CACHE_KEY, JSON.stringify(cache));
};

const pruneCache = (cache: VoteCache) => {
  const now = Date.now();
  let mutated = false;

  for (const key of Object.keys(cache)) {
    const timestamp = cache[key];
    if (!timestamp) {
      delete cache[key];
      mutated = true;
      continue;
    }

    if (now - timestamp > VOTE_COOLDOWN_MS) {
      delete cache[key];
      mutated = true;
    }
  }

  if (mutated) {
    persistCache(cache);
  }

  return cache;
};

const hydrateCache = () => {
  return pruneCache(readCache());
};

const hasRecentVote = (key: string) => {
  if (typeof window === "undefined") {
    return false;
  }

  const cache = hydrateCache();
  const timestamp = cache[key];

  if (!timestamp) {
    return false;
  }

  const isFresh = Date.now() - timestamp < VOTE_COOLDOWN_MS;

  if (!isFresh) {
    delete cache[key];
    persistCache(cache);
  }

  return isFresh;
};

const rememberVote = (key: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const cache = hydrateCache();
  cache[key] = Date.now();
  persistCache(cache);
};

const iconClass = "h-48 w-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-800";

const ContestantCard = ({
  contestant,
  side,
  onVote,
  disabled,
}: {
  contestant: DuelContestant;
  side: "a" | "b";
  onVote: (winner: "a" | "b") => void;
  disabled: boolean;
}) => {
  return (
    <article className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-center">
      <div className={iconClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={contestant.imageUrl}
          alt={contestant.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-100">{contestant.name}</h2>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Elo {contestant.elo} | Matches {contestant.matches}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onVote(side)}
        disabled={disabled}
        className="w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Choose {side.toUpperCase()}
      </button>
    </article>
  );
};

const RateClient = () => {
  const [duel, setDuel] = useState<DuelPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadNextDuel = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/duel/next", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as { pair?: DuelPair };

      if (!data.pair) {
        throw new Error("Response missing duel pair");
      }

      setDuel(data.pair);
      setFeedback(null);
    } catch (err) {
      console.error("Failed to load duel", err);
      setError("Unable to load the next duel. Try again shortly.");
      setDuel(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNextDuel();
  }, [loadNextDuel]);

  const pairKey = useMemo(() => {
    if (!duel) {
      return null;
    }

    return getPairKey(duel.a.id, duel.b.id);
  }, [duel]);

  const handleVote = useCallback(
    async (winner: "a" | "b" | "tie") => {
      if (!duel || !pairKey) {
        return;
      }
      if (hasRecentVote(pairKey)) {
        setFeedback("Vote already recorded for this matchup. Please wait a moment.");
        return;
      }


      try {
        setSubmitting(true);
        setFeedback(null);
        const response = await fetch("/api/duel/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            aId: duel.a.id,
            bId: duel.b.id,
            winner,
          }),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        rememberVote(pairKey);

        if (winner !== "tie") {
          setFeedback(
            winner === "a"
              ? `${duel.a.name} takes the win. Reloading...`
              : `${duel.b.name} takes the win. Reloading...`,
          );
        } else {
          setFeedback("Tie recorded. Serving another duel...");
        }

        await loadNextDuel();
      } catch (err) {
        console.error("Failed to submit duel", err);
        setFeedback("Failed to submit vote. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [duel, pairKey, loadNextDuel],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!duel || submitting) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "a") {
        event.preventDefault();
        void handleVote("a");
      } else if (key === "b") {
        event.preventDefault();
        void handleVote("b");
      } else if (key === "t") {
        event.preventDefault();
        void handleVote("tie");
      } else if (key === "s") {
        event.preventDefault();
        void loadNextDuel();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [duel, handleVote, loadNextDuel, submitting]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          ["A", "B"].map((label) => (
            <article
              key={label}
              className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-6 text-center"
            >
              <div className={iconClass} />
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-400">
                  Loading contestant {label}
                </h2>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Fetching stats...
                </p>
              </div>
              <div className="h-9 w-full rounded-full bg-slate-800/60" />
            </article>
          ))
        ) : duel ? (
          <>
            <ContestantCard
              contestant={duel.a}
              side="a"
              onVote={(winner) => void handleVote(winner)}
              disabled={submitting}
            />
            <ContestantCard
              contestant={duel.b}
              side="b"
              onVote={(winner) => void handleVote(winner)}
              disabled={submitting}
            />
          </>
        ) : (
          <div className="md:col-span-2">
            <div className="rounded-2xl border border-rose-400/50 bg-rose-500/10 p-6 text-center text-sm text-rose-100">
              {error ?? "No duel available. Seed more celebs to continue."}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => void loadNextDuel()}
                  className="rounded-full border border-rose-300/70 px-4 py-2 text-xs font-semibold text-rose-100 transition hover:border-rose-100"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void handleVote("tie")}
          disabled={submitting || !duel || loading}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Call it a tie (T)
        </button>
        <button
          type="button"
          onClick={() => void loadNextDuel()}
          disabled={loading || submitting}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Skip pair (S)
        </button>
      </div>
      <div className="rounded-2xl border border-dashed border-white/20 bg-slate-900/30 p-4 text-xs text-slate-400">
        Keyboard shortcuts: press A or B to vote, T to mark a tie, S to skip. Local storage prevents accidental double votes for one minute.
      </div>
      {feedback ? (
        <div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/10 p-4 text-xs text-emerald-200">
          {feedback}
        </div>
      ) : null}
    </div>
  );
};

export default RateClient;









