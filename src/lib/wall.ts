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

const SMALL_LAYOUT_PATTERNS: Record<number, number[]> = {
  1: [1],
  2: [2],
  3: [1, 2],
  4: [2, 2],
  5: [2, 3],
  6: [3, 3],
  7: [3, 4],
  8: [3, 5],
  9: [3, 3, 3],
};

const SMALL_COL_GAP = 2.45;
const SMALL_ROW_GAP = 2.75;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const BASE_RADIAL_SPACING = 1.85;
const ASPECT_SQUASH = 0.78;
const MIN_SCALE = 0.92;
const MAX_SCALE = 1.45;
const MIN_PX = 88;
const MAX_PX = 280;
const DEPTH_STEP = 0.012;

const buildGridLayoutFromPattern = (pattern: number[]) => {
  const rows = pattern.length;
  const positions: [number, number][] = [];

  pattern.forEach((count, rowIndex) => {
    const y = ((rows - 1) / 2 - rowIndex) * SMALL_ROW_GAP;
    const xOffset = ((count - 1) / 2) * SMALL_COL_GAP;

    for (let column = 0; column < count; column += 1) {
      const x = column * SMALL_COL_GAP - xOffset;
      positions.push([x, y]);
    }
  });

  return positions;
};

const buildRadialLayout = (total: number) => {
  const radius = 2.4 + Math.max(0, total - 6) * 0.22;
  const positions: [number, number][] = [[0, 0]];

  if (total <= 1) {
    return positions;
  }

  for (let index = 1; index < total; index += 1) {
    const theta = index * GOLDEN_ANGLE;
    positions.push([Math.cos(theta) * radius, Math.sin(theta) * radius]);
  }

  return positions;
};

const getSmallLayoutPositions = (total: number) => {
  const pattern = SMALL_LAYOUT_PATTERNS[total];

  if (!pattern) {
    return buildRadialLayout(total);
  }

  return buildGridLayoutFromPattern(pattern);
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
    const basePosition = useSmallLayout
      ? ([...(smallLayout![index] ?? [0, 0]), 0] as [number, number, number])
      : getPhyllotaxisPosition(index);

    const position: [number, number, number] = [
      basePosition[0],
      basePosition[1],
      basePosition[2] - index * DEPTH_STEP,
    ];

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
