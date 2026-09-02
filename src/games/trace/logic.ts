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

export function generateTraceLevel(level: number): TraceBoard {
  const { size } = levelConfig(level);
  const rand = mulberry32(level * 97711 + 31);

  const shape = shapeForLevel(level);
  const { mask, name } = buildMask(size, shape);
  const allowed = (cell: Cell) => mask.has(`${cell[0]},${cell[1]}`);
  const targetLen = Math.min(Math.round(mask.size * 0.6) + level, mask.size - 1);

  let best: Cell[] = [];
  for (let restart = 0; restart < 8; restart++) {
    const candidate = bestSelfAvoidingPath(size, targetLen, rand, 25, allowed);
    if (candidate.length > best.length) best = candidate;
    if (best.length >= targetLen) break;
  }
  if (best.length < 2) best = [[0, 0], [Math.min(1, size - 1), 0]];

  return {
    size,
    path: best,
    mask,
    shape: name,
    difficulty: difficultyForLevel(level),
    lives: livesForLevel(level),
  };
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
