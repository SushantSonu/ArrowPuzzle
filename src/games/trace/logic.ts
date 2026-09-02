import { mulberry32 } from "../../lib/rng";
import { bestSelfAvoidingPath, type Cell } from "../../lib/path";
import { type Dir } from "../../types";
import { buildMask, shapeForLevel, type ShapeName } from "./shapes";

export type Difficulty = "Easy" | "Normal" | "Hard";

export interface TraceBoard {
  size: number;
  path: Cell[];
  mask: Set<string>;
  shape: ShapeName;
  difficulty: Difficulty;
  lives: number;
}

function levelConfig(level: number) {
  const size = Math.min(5 + Math.floor((level - 1) / 2), 9);
  return { size };
}

export function difficultyForLevel(level: number): Difficulty {
  if (level <= 4) return "Easy";
  if (level <= 9) return "Normal";
  return "Hard";
}

export function livesForLevel(level: number): number {
  const difficulty = difficultyForLevel(level);
  return difficulty === "Easy" ? 4 : difficulty === "Normal" ? 3 : 2;
}

export function buildTraceBoard(
  size: number,
  shapeIndex: number,
  targetLenBonus: number,
  rand: () => number,
  difficulty: Difficulty,
  lives: number
): TraceBoard {
  const shape = shapeForLevel(shapeIndex);
  const { mask, name } = buildMask(size, shape);
  const allowed = (cell: Cell) => mask.has(`${cell[0]},${cell[1]}`);
  const targetLen = Math.min(Math.round(mask.size * 0.6) + targetLenBonus, mask.size - 1);

  let best: Cell[] = [];
  for (let restart = 0; restart < 8; restart++) {
    const candidate = bestSelfAvoidingPath(size, targetLen, rand, 25, allowed);
    if (candidate.length > best.length) best = candidate;
    if (best.length >= targetLen) break;
  }
  if (best.length < 2) best = [[0, 0], [Math.min(1, size - 1), 0]];

  return { size, path: best, mask, shape: name, difficulty, lives };
}

export function generateTraceLevel(level: number): TraceBoard {
  const { size } = levelConfig(level);
  return buildTraceBoard(
    size,
    level,
    level,
    mulberry32(level * 97711 + 31),
    difficultyForLevel(level),
    livesForLevel(level)
  );
}

export const TRACE_DAILY_SIZE = 7;

/**
 * `shapeCycleIndex` should count how many times Trace has come up as the daily
 * mode so far (not the raw puzzle number) — since the mode rotation and the 5
 * shapes share a period of 5, indexing by puzzle number would always land on
 * the same shape.
 */
export function generateTraceDaily(seed: number, shapeCycleIndex: number): TraceBoard {
  return buildTraceBoard(TRACE_DAILY_SIZE, shapeCycleIndex + 1, 8, mulberry32(seed), "Normal", 3);
}

function dirBetween(a: Cell, b: Cell): Dir {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 1) return "right";
  if (dx === -1) return "left";
  if (dy === 1) return "down";
  return "up";
}

/** direction each non-final path cell should display, pointing at the next cell */
export function pathDirs(path: Cell[]): (Dir | null)[] {
  return path.map((cell, i) => (i < path.length - 1 ? dirBetween(cell, path[i + 1]) : null));
}
