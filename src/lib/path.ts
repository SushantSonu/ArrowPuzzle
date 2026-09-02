import { DIRS, DIR_VECTOR, type Dir } from "../types";
import { shuffle } from "./rng";

export type Cell = [number, number];

/**
 * Grows a random self-avoiding walk on a size x size grid, starting from a
 * random cell, up to targetLen cells (may stop shorter if it gets boxed in).
 * An optional `allowed` predicate restricts the walk to a subset of cells
 * (e.g. a silhouette mask) — cells outside it are treated like walls.
 */
export function randomSelfAvoidingPath(
  size: number,
  targetLen: number,
  rand: () => number,
  allowed?: (cell: Cell) => boolean
): Cell[] {
  const inBounds = (c: Cell) => c[0] >= 0 && c[0] < size && c[1] >= 0 && c[1] < size && (!allowed || allowed(c));

  const starts: Cell[] = [];
  for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) if (inBounds([x, y])) starts.push([x, y]);
  if (starts.length === 0) return [];
  const start = starts[Math.floor(rand() * starts.length)];

  const visited = new Set<string>([`${start[0]},${start[1]}`]);
  const path: Cell[] = [start];

  while (path.length < targetLen) {
    const [x, y] = path[path.length - 1];
    const options = shuffle(DIRS, rand)
      .map((d) => {
        const [dx, dy] = DIR_VECTOR[d];
        return [x + dx, y + dy] as Cell;
      })
      .filter((c) => inBounds(c) && !visited.has(`${c[0]},${c[1]}`));

    if (options.length === 0) break;
    const next = options[0];
    visited.add(`${next[0]},${next[1]}`);
    path.push(next);
  }

  return path;
}

/** Runs randomSelfAvoidingPath multiple times and keeps the longest result. */
export function bestSelfAvoidingPath(
  size: number,
  targetLen: number,
  rand: () => number,
  attempts = 60,
  allowed?: (cell: Cell) => boolean
): Cell[] {
  let best: Cell[] = [];
  for (let i = 0; i < attempts; i++) {
    const path = randomSelfAvoidingPath(size, targetLen, rand, allowed);
    if (path.length > best.length) best = path;
    if (best.length >= targetLen) break;
  }
  return best;
}

/** BFS shortest route between two cells, avoiding wall cells. Null if unreachable. */
export function shortestPath(size: number, walls: Set<string>, start: Cell, goal: Cell): Dir[] | null {
  const key = (c: Cell) => `${c[0]},${c[1]}`;
  const startKey = key(start);
  const goalKey = key(goal);
  if (walls.has(startKey) || walls.has(goalKey)) return null;
  if (startKey === goalKey) return [];

  const cameFrom = new Map<string, { from: string; dir: Dir }>();
  const seen = new Set<string>([startKey]);
  let frontier: Cell[] = [start];

  while (frontier.length > 0 && !seen.has(goalKey)) {
    const next: Cell[] = [];
    for (const [x, y] of frontier) {
      for (const d of DIRS) {
        const [dx, dy] = DIR_VECTOR[d];
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
        const k = `${nx},${ny}`;
        if (seen.has(k) || walls.has(k)) continue;
        seen.add(k);
        cameFrom.set(k, { from: `${x},${y}`, dir: d });
        next.push([nx, ny]);
      }
    }
    frontier = next;
  }

  if (!cameFrom.has(goalKey)) return null;
  const dirs: Dir[] = [];
  let cur = goalKey;
  while (cur !== startKey) {
    const step = cameFrom.get(cur)!;
    dirs.push(step.dir);
    cur = step.from;
  }
  return dirs.reverse();
}

/** BFS shortest path length (in steps) between two cells, avoiding wall cells. */
export function shortestPathLength(size: number, walls: Set<string>, start: Cell, goal: Cell): number {
  const path = shortestPath(size, walls, start, goal);
  return path ? path.length : Infinity;
}
