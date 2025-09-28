const MIN_K = 8;
const MAX_K = 32;
const DEFAULT_ELO = 1200;

export type DuelOutcome = "a" | "b" | "tie";

export const expectedScore = (rating: number, opponentRating: number) => {
  const exponent = (opponentRating - rating) / 400;
  return 1 / (1 + 10 ** exponent);
};

export const computeKFactor = (matches: number) => {
  const clampedMatches = Math.max(matches, 0);
  const dynamicK = MAX_K / Math.sqrt(clampedMatches + 1);
  return Math.max(MIN_K, Math.min(MAX_K, Math.round(dynamicK)));
};

export const conservativeScore = (elo: number, matches: number) => {
  const penalty = 40 / Math.sqrt(Math.max(matches, 0) + 1);
  return elo - penalty;
};

export const updateElo = ({
  ratingA = DEFAULT_ELO,
  ratingB = DEFAULT_ELO,
  matchesA,
  matchesB,
  outcome,
}: {
  ratingA?: number;
  ratingB?: number;
  matchesA: number;
  matchesB: number;
  outcome: DuelOutcome;
}) => {
  const scoreA = expectedScore(ratingA, ratingB);
  const scoreB = expectedScore(ratingB, ratingA);

  let actualA = 0.5;
  let actualB = 0.5;

  if (outcome === "a") {
    actualA = 1;
    actualB = 0;
  } else if (outcome === "b") {
    actualA = 0;
    actualB = 1;
  }

  const kA = computeKFactor(matchesA);
  const kB = computeKFactor(matchesB);

  const newRatingA = Math.round(ratingA + kA * (actualA - scoreA));
  const newRatingB = Math.round(ratingB + kB * (actualB - scoreB));

  return {
    ratingA: newRatingA,
    ratingB: newRatingB,
    deltaA: newRatingA - ratingA,
    deltaB: newRatingB - ratingB,
  };
};

export const clampMovement = (delta: number, maxSwing = 24) => {
  return Math.max(-maxSwing, Math.min(maxSwing, delta));
};

export const applyClampedUpdate = ({
  rating,
  delta,
}: {
  rating: number;
  delta: number;
}) => {
  const clampedDelta = clampMovement(delta);
  return {
    rating: rating + clampedDelta,
    delta: clampedDelta,
  };
};

export const sortByConservativeScore = <T extends { elo: number; matches: number }>(
  list: T[],
) => {
  return [...list].sort((a, b) => {
    return conservativeScore(b.elo, b.matches) - conservativeScore(a.elo, a.matches);
  });
};

export const DEFAULT_ELO_RATING = DEFAULT_ELO;
