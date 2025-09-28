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

type Tile = {
  w: number; // in cells
  h: number; // in cells
  // scale factor roughly aligned with visual cell coverage
  scale: number;
};

const TILE_XL: Tile = { w: 2, h: 2, scale: 1.42 };
const TILE_H2: Tile = { w: 2, h: 1, scale: 1.18 };
const TILE_V2: Tile = { w: 1, h: 2, scale: 1.18 };
const TILE_1: Tile = { w: 1, h: 1, scale: 1.0 };

const pickTileForIndex = (index: number, rnd: () => number): Tile => {
  if (index === 0) return TILE_XL;
  if (index <= 2) return rnd() < 0.5 ? TILE_H2 : TILE_V2;
  if (index <= 5) return rnd() < 0.35 ? TILE_H2 : TILE_1;
  return rnd() < 0.2 ? (rnd() < 0.5 ? TILE_H2 : TILE_V2) : TILE_1;
};

const computeColumns = (n: number) => {
  // Aim for a landscape wall, more columns as items grow
  return Math.max(5, Math.min(12, Math.ceil(Math.sqrt(n) * 2.2)));
};

const packMasonry = (tiles: Tile[], columns: number) => {
  const grid: number[][] = [];
  const placements: { x: number; y: number; tile: Tile }[] = [];

  const fits = (r: number, c: number, t: Tile) => {
    for (let y = 0; y < t.h; y += 1) {
      for (let x = 0; x < t.w; x += 1) {
        const rr = r + y;
        const cc = c + x;
        if (cc >= columns) return false;
        if (!grid[rr]) grid[rr] = [];
        if (grid[rr][cc]) return false;
      }
    }
    return true;
  };

  const place = (t: Tile) => {
    let r = 0;
    // scan rows for first fit
    // Cap rows to avoid infinite loops
    const MAX_ROWS = 200;
    while (r < MAX_ROWS) {
      for (let c = 0; c <= columns - t.w; c += 1) {
        if (fits(r, c, t)) {
          for (let y = 0; y < t.h; y += 1) {
            for (let x = 0; x < t.w; x += 1) {
              const rr = r + y;
              const cc = c + x;
              if (!grid[rr]) grid[rr] = [];
              grid[rr][cc] = 1;
            }
          }
          placements.push({ x: c, y: r, tile: t });
          return;
        }
      }
      r += 1;
    }
    // Fallback bottom-left
    placements.push({ x: 0, y: r, tile: t });
  };

  tiles.forEach(place);

  const usedRows = grid.length;
  return { placements, usedRows };
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

  // Sort by conservative score (ranked order)
  const sorted = [...input].sort((a, b) => {
    return (
      conservativeScore(b.elo, b.matches) - conservativeScore(a.elo, a.matches)
    );
  });

  const scores = sorted.map((item) => conservativeScore(item.elo, item.matches));
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  // Build stable seed from roster ids so layout is deterministic per set
  const seed = hash(sorted.map((x) => `${x.id}:${x.elo}:${x.matches}`).join("|"));
  const rnd = mulberry32(seed);

  // Decide tile for each item using rank + a touch of randomness
  const tiles: Tile[] = sorted.map((_, i) => pickTileForIndex(i, rnd));
  const columns = computeColumns(sorted.length);
  const { placements, usedRows } = packMasonry(tiles, columns);

  const cx = columns / 2;
  const cy = usedRows / 2;

  return sorted.map((item, index) => {
    const score = scores[index]!;
    const sizePx = computeSizePx(score, minScore, maxScore);
    const { x, y, tile } = placements[index]!;

    // Centered world coordinates with a subtle jitter for organic feel
    const jitterX = (rnd() - 0.5) * 0.15;
    const jitterY = (rnd() - 0.5) * 0.15;

    const worldX = (x + tile.w / 2 - cx) * CELL_W + jitterX;
    const worldY = (cy - (y + tile.h / 2)) * CELL_H + jitterY;

    const position: [number, number, number] = [
      worldX,
      worldY,
      -index * DEPTH_STEP,
    ];

    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, tile.scale));

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
