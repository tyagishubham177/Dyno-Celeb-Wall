import { conservativeScore } from "./elo";

export type DuelCandidate = {
  id: number;
  name: string;
  imageUrl: string;
  elo: number;
  matches: number;
  createdAt?: Date;
};

type SelectionResult = {
  a: DuelCandidate;
  b: DuelCandidate;
};

const defaultRandom = Math.random;

const pickRandom = <T>(items: T[], rand: () => number) => {
  const index = Math.floor(rand() * items.length);
  return items[index];
};

const scoreCandidate = (
  primary: DuelCandidate,
  candidate: DuelCandidate,
) => {
  const eloGap = Math.abs(candidate.elo - primary.elo);
  const matchesGap = Math.abs(candidate.matches - primary.matches);
  const lowMatchBias = Math.min(primary.matches, candidate.matches);
  const conservativeGap = Math.abs(
    conservativeScore(candidate.elo, candidate.matches) -
      conservativeScore(primary.elo, primary.matches),
  );

  return eloGap + matchesGap * 12 + lowMatchBias * 6 + conservativeGap;
};

export const selectDuelPair = (
  roster: DuelCandidate[],
  options?: {
    random?: () => number;
  },
): SelectionResult => {
  if (roster.length < 2) {
    throw new Error("Need at least two celebs to stage a duel");
  }

  const rand = options?.random ?? defaultRandom;
  const byMatches = [...roster].sort((a, b) => a.matches - b.matches);
  const poolSize = Math.min(6, byMatches.length);
  const candidatePool = byMatches.slice(0, poolSize);
  const primary = pickRandom(candidatePool, rand);

  const opponents = roster.filter((item) => item.id !== primary.id);

  const scored = opponents
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(primary, candidate),
    }))
    .sort((a, b) => a.score - b.score);

  const shortlist = scored.slice(0, Math.min(4, scored.length));
  const chosenOpponent = shortlist.length
    ? pickRandom(shortlist, rand).candidate
    : scored[0]!.candidate;

  let duel: SelectionResult = { a: primary, b: chosenOpponent };

  if (rand() < 0.5) {
    duel = { a: chosenOpponent, b: primary };
  }

  return duel;
};
