import { conservativeScore } from "./elo";

export type WallDatum = {
  id: number;
  name: string;
  imageUrl: string;
  elo: number;
  matches: number;
};

export type WallInstance = WallDatum & {
  score: number;
  scale: number;
  sizePx: number;
  position: [number, number, number];
  order: number;
};

const SMALL_LAYOUTS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1.8, 0], [1.8, 0]],
  3: [[0, 1.8], [-1.7, -1], [1.7, -1]],
  4: [[-1.9, 1.4], [1.9, 1.4], [-1.9, -1.4], [1.9, -1.4]],
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const BASE_RADIAL_SPACING = 1.5;
const ASPECT_SQUASH = 0.82;
const MIN_SCALE = 0.85;
const MAX_SCALE = 2.6;
const MIN_PX = 64;
const MAX_PX = 320;

const buildRadialLayout = (total: number) => {
  const radius = 2.1 + (total - 5) * 0.18;
  const positions: [number, number][] = [[0, 0]];

  if (total === 0) {
    return positions;
  }

  for (let index = 1; index < total; index += 1) {
    const theta = ((index - 1) / Math.max(1, total - 1)) * Math.PI * 2;
    positions.push([Math.cos(theta) * radius, Math.sin(theta) * radius]);
  }

  return positions;
};

const getSmallLayoutPositions = (total: number) => {
  if (SMALL_LAYOUTS[total]) {
    return SMALL_LAYOUTS[total];
  }

  return buildRadialLayout(total);
};

const getPhyllotaxisPosition = (index: number): [number, number, number] => {
  if (index === 0) {
    return [0, 0, 0];
  }

  const radius = BASE_RADIAL_SPACING * Math.sqrt(index);
  const angle = index * GOLDEN_ANGLE;
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle) * ASPECT_SQUASH;

  return [x, y, 0];
};

const computeScale = (score: number, minScore: number, maxScore: number) => {
  if (!Number.isFinite(score)) {
    return (MIN_SCALE + MAX_SCALE) / 2;
  }

  if (maxScore === minScore) {
    return (MIN_SCALE + MAX_SCALE) / 2;
  }

  const normalized = (score - minScore) / (maxScore - minScore);
  const clamped = Math.min(1, Math.max(0, normalized));
  const logistic = 1 / (1 + Math.exp(-4 * (clamped - 0.5)));

  return MIN_SCALE + logistic * (MAX_SCALE - MIN_SCALE);
};

const computeSizePx = (score: number, minScore: number, maxScore: number) => {
  if (maxScore === minScore) {
    return (MIN_PX + MAX_PX) / 2;
  }

  const normalized = (score - minScore) / (maxScore - minScore);
  const clamped = Math.min(1, Math.max(0, normalized));
  const logistic = 1 / (1 + Math.exp(-4 * (clamped - 0.5)));

  return MIN_PX + logistic * (MAX_PX - MIN_PX);
};

export const resolveWallInstances = (input: WallDatum[]): WallInstance[] => {
  if (!input.length) {
    return [];
  }

  const sorted = [...input].sort((a, b) => {
    return (
      conservativeScore(b.elo, b.matches) - conservativeScore(a.elo, a.matches)
    );
  });

  const scores = sorted.map((item) => conservativeScore(item.elo, item.matches));
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const useSmallLayout = sorted.length <= 9;
  const smallLayout = useSmallLayout ? getSmallLayoutPositions(sorted.length) : null;

  return sorted.map((item, index) => {
    const score = scores[index]!;
    const scale = computeScale(score, minScore, maxScore);
    const sizePx = computeSizePx(score, minScore, maxScore);
    const position = useSmallLayout
      ? ([...(smallLayout![index] ?? [0, 0]), 0] as [number, number, number])
      : getPhyllotaxisPosition(index);

    return {
      ...item,
      score,
      scale,
      sizePx,
      position,
      order: index,
    };
  });
};
