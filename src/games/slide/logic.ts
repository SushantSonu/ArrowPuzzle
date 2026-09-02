import type { Dir } from "../../types";

export const SLIDE_SIZE = 4;

export interface SlideTile {
  id: number;
  r: number;
  c: number;
  value: number;
  justMerged?: boolean;
  isNew?: boolean;
}

let nextId = 1;
export function resetIds() {
  nextId = 1;
}

function makeTile(r: number, c: number, value: number, extra: Partial<SlideTile> = {}): SlideTile {
  return { id: nextId++, r, c, value, ...extra };
}

export function emptyCells(tiles: SlideTile[]): [number, number][] {
  const occupied = new Set(tiles.map((t) => `${t.r},${t.c}`));
  const cells: [number, number][] = [];
  for (let r = 0; r < SLIDE_SIZE; r++) {
    for (let c = 0; c < SLIDE_SIZE; c++) {
      if (!occupied.has(`${r},${c}`)) cells.push([r, c]);
    }
  }
  return cells;
}

export function spawnRandomTile(tiles: SlideTile[], rand: () => number = Math.random): SlideTile[] {
  const cells = emptyCells(tiles);
  if (cells.length === 0) return tiles;
  const [r, c] = cells[Math.floor(rand() * cells.length)];
  const value = rand() < 0.9 ? 2 : 4;
  return [...tiles.map((t) => ({ ...t, justMerged: false, isNew: false })), makeTile(r, c, value, { isNew: true })];
}

export function newGame(rand: () => number = Math.random): SlideTile[] {
  resetIds();
  let tiles: SlideTile[] = [];
  tiles = spawnRandomTile(tiles, rand);
  tiles = spawnRandomTile(tiles, rand);
  return tiles;
}

interface LineEntry {
  survivorId: number;
  value: number;
  merged: boolean;
}

function compactLine(sorted: SlideTile[]): LineEntry[] {
  const out: LineEntry[] = [];
  for (const t of sorted) {
    const last = out[out.length - 1];
    if (last && !last.merged && last.value === t.value) {
      last.value *= 2;
      last.merged = true;
    } else {
      out.push({ survivorId: t.id, value: t.value, merged: false });
    }
  }
  return out;
}

export interface MoveResult {
  tiles: SlideTile[];
  moved: boolean;
  scoreDelta: number;
}

export function move(tiles: SlideTile[], dir: Dir): MoveResult {
  const size = SLIDE_SIZE;
  const byPos = new Map(tiles.map((t) => [`${t.r},${t.c}`, t]));
  const resultTiles: SlideTile[] = [];
  let scoreDelta = 0;
  let moved = false;

  const isVertical = dir === "up" || dir === "down";
  const towardStart = dir === "up" || dir === "left"; // destination edge is index 0

  for (let line = 0; line < size; line++) {
    const cellsInLine: [number, number][] = [];
    for (let i = 0; i < size; i++) {
      cellsInLine.push(isVertical ? [i, line] : [line, i]);
    }
    // order cells so the destination edge comes first
    const ordered = towardStart ? cellsInLine : [...cellsInLine].reverse();
    const present = ordered
      .map(([r, c]) => byPos.get(`${r},${c}`))
      .filter((t): t is SlideTile => !!t);

    const compacted = compactLine(present);

    compacted.forEach((entry, idx) => {
      const posIndex = towardStart ? idx : size - 1 - idx;
      const [r, c] = isVertical ? [posIndex, line] : [line, posIndex];
      const original = tiles.find((t) => t.id === entry.survivorId)!;
      if (original.r !== r || original.c !== c || entry.merged) moved = true;
      if (entry.merged) scoreDelta += entry.value;
      resultTiles.push({
        id: entry.survivorId,
        r,
        c,
        value: entry.value,
        justMerged: entry.merged,
        isNew: false,
      });
    });
  }

  return { tiles: resultTiles, moved, scoreDelta };
}

export function hasMovesAvailable(tiles: SlideTile[]): boolean {
  if (emptyCells(tiles).length > 0) return true;
  const grid = new Map(tiles.map((t) => [`${t.r},${t.c}`, t.value]));
  for (let r = 0; r < SLIDE_SIZE; r++) {
    for (let c = 0; c < SLIDE_SIZE; c++) {
      const v = grid.get(`${r},${c}`);
      if (v === undefined) continue;
      if (grid.get(`${r + 1},${c}`) === v) return true;
      if (grid.get(`${r},${c + 1}`) === v) return true;
    }
  }
  return false;
}

export function maxValue(tiles: SlideTile[]): number {
  return tiles.reduce((m, t) => Math.max(m, t.value), 0);
}

/** Lightweight heuristic move suggestion: prefers merges, then keeping more cells open. */
export function suggestMove(tiles: SlideTile[]): Dir | null {
  const dirs: Dir[] = ["up", "down", "left", "right"];
  let best: { dir: Dir; score: number } | null = null;
  for (const dir of dirs) {
    const result = move(tiles, dir);
    if (!result.moved) continue;
    const score = result.scoreDelta * 10 + emptyCells(result.tiles).length;
    if (!best || score > best.score) best = { dir, score };
  }
  return best?.dir ?? null;
}
