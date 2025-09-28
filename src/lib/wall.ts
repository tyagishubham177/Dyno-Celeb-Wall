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

// Layout + scale constants
const MIN_SCALE = 0.92;
const MAX_SCALE = 1.45;
const MIN_PX = 88;
const MAX_PX = 280;
const DEPTH_STEP = 0.012;

// World-space cell spacing for the wall grid
const CELL_W = 1.4;
const CELL_H = 1.6;
const JITTER_MAX = 0.18;

// Simple seeded RNG for stable "ordered-disorder"
const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hash = (str: string) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const shuffle = <T,>(array: T[], rnd: () => number) => {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

type Tile = {
  w: number; // in cells
  h: number; // in cells
};

const TILE_XL: Tile = { w: 2, h: 2 };
const TILE_H2: Tile = { w: 2, h: 1 };
const TILE_V2: Tile = { w: 1, h: 2 };
const TILE_1: Tile = { w: 1, h: 1 };

const pickTileForScale = (scale: number, rnd: () => number): Tile => {
  if (scale >= 1.3) {
    return TILE_XL;
  }

  if (scale >= 1.16) {
    return rnd() > 0.5 ? TILE_H2 : TILE_V2;
  }

  if (scale >= 1.05) {
    return rnd() > 0.7 ? (rnd() > 0.5 ? TILE_H2 : TILE_V2) : TILE_1;
  }

  return TILE_1;
};

const computeColumns = (n: number) => {
  // Aim for a landscape wall, more columns as items grow
  return Math.max(5, Math.min(14, Math.ceil(Math.sqrt(n) * 2.4)));
};

type Placement = { x: number; y: number; tile: Tile };
type PlacementResult = {
  placements: Placement[];
  bounds: {
    minCol: number;
    maxCol: number;
    minRow: number;
    maxRow: number;
  };
};

const packMasonry = (tiles: Tile[], columns: number, rnd: () => number): PlacementResult => {
  const grid: number[][] = [];
  const placements: Placement[] = [];
  let minCol = Number.POSITIVE_INFINITY;
  let maxCol = Number.NEGATIVE_INFINITY;
  let minRow = Number.POSITIVE_INFINITY;
  let maxRow = Number.NEGATIVE_INFINITY;

  const fits = (r: number, c: number, t: Tile) => {
    for (let y = 0; y < t.h; y += 1) {
      for (let x = 0; x < t.w; x += 1) {
        const rr = r + y;
        const cc = c + x;
        if (cc < 0 || cc >= columns) {
          return false;
        }
        if (!grid[rr]) {
          grid[rr] = [];
        }
        if (grid[rr][cc]) {
          return false;
        }
      }
    }
    return true;
  };

  const place = (t: Tile) => {
    let r = 0;
    const MAX_ROWS = 200;

    while (r < MAX_ROWS) {
      const candidates = shuffle(
        Array.from({ length: Math.max(1, columns - t.w + 1) }, (_, index) => index),
        rnd,
      );
      for (const c of candidates) {
        if (fits(r, c, t)) {
          for (let y = 0; y < t.h; y += 1) {
            for (let x = 0; x < t.w; x += 1) {
              const rr = r + y;
              const cc = c + x;
              if (!grid[rr]) {
                grid[rr] = [];
              }
              grid[rr][cc] = 1;
            }
          }
          placements.push({ x: c, y: r, tile: t });
          minCol = Math.min(minCol, c);
          maxCol = Math.max(maxCol, c + t.w);
          minRow = Math.min(minRow, r);
          maxRow = Math.max(maxRow, r + t.h);
          return;
        }
      }
      r += 1;
    }

    placements.push({ x: 0, y: r, tile: t });
    minCol = Math.min(minCol, 0);
    maxCol = Math.max(maxCol, t.w);
    minRow = Math.min(minRow, r);
    maxRow = Math.max(maxRow, r + t.h);
  };

  tiles.forEach(place);

  if (!Number.isFinite(minCol)) {
    minCol = 0;
    maxCol = columns;
    minRow = 0;
    maxRow = grid.length;
  }

  return {
    placements,
    bounds: {
      minCol,
      maxCol,
      minRow,
      maxRow,
    },
  };
};

const computeScale = (score: number, minScore: number, maxScore: number) => {
  if (!Number.isFinite(score) || maxScore === minScore) {
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

const combineSeeds = (base: number, override: number) => {
  return (base ^ (override >>> 0)) >>> 0;
};

export const resolveWallInstances = (
  input: WallDatum[],
  seedOverride: number = 0,
): WallInstance[] => {
  if (!input.length) {
    return [];
  }

  // Sort by conservative score (ranked order)
  const sorted = [...input].sort((a, b) => {
    return (
      conservativeScore(b.elo, b.matches) - conservativeScore(a.elo, a.matches)
    );
  });

  const scores = sorted.map((item) => conservativeScore(item.elo, item.matches));
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  const seedBase = hash(sorted.map((x) => `${x.id}:${x.elo}:${x.matches}`).join("|"));
  const seed = combineSeeds(seedBase, seedOverride);
  const rnd = mulberry32(seed);

  const scales = scores.map((score) => computeScale(score, minScore, maxScore));
  const tiles: Tile[] = scales.map((scale) => pickTileForScale(scale, rnd));
  const columns = computeColumns(sorted.length);
  const { placements, bounds } = packMasonry(tiles, columns, rnd);

  const colCenter = (bounds.minCol + bounds.maxCol) / 2;
  const rowCenter = (bounds.minRow + bounds.maxRow) / 2;

  return sorted.map((item, index) => {
    const score = scores[index]!;
    const sizePx = computeSizePx(score, minScore, maxScore);
    const scale = scales[index]!;
    const { x, y, tile } = placements[index]!;

    const jitterX = (rnd() - 0.5) * JITTER_MAX;
    const jitterY = (rnd() - 0.5) * JITTER_MAX;

    const worldX = ((x + tile.w / 2) - colCenter) * CELL_W + jitterX;
    const worldY = (rowCenter - (y + tile.h / 2)) * CELL_H + jitterY;

    const position: [number, number, number] = [
      worldX,
      worldY,
      -index * DEPTH_STEP,
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
