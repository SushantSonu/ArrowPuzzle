import { DIR_VECTOR, type Dir } from "../../types";
import { mulberry32 } from "../../lib/rng";
import { bestSelfAvoidingPath, shortestPath, shortestPathLength, type Cell } from "../../lib/path";

export interface RobotLevel {
  size: number;
  walls: Set<string>;
  start: Cell;
  goal: Cell;
  maxSlots: number;
  optimal: number;
  twoStarMax: number;
}

function key(c: Cell) {
  return `${c[0]},${c[1]}`;
}

export function generateRobotLevel(level: number): RobotLevel {
  const size = Math.min(5 + Math.floor((level - 1) / 2), 9);
  const targetLen = Math.min(6 + level, size * size - 1);
  const rand = mulberry32(level * 40503 + 11);

  const best = bestSelfAvoidingPath(size, targetLen, rand);
  const pathSet = new Set(best.map(key));
  const walls = new Set<string>();
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const k = key([x, y]);
      if (pathSet.has(k)) continue;
      // leave a few non-path cells open at random so the maze isn't a single corridor
      if (rand() < 0.12) continue;
      walls.add(k);
    }
  }

  const start = best[0];
  const goal = best[best.length - 1];
  const optimal = shortestPathLength(size, walls, start, goal);
  const safeOptimal = Number.isFinite(optimal) ? optimal : best.length - 1;

  return {
    size,
    walls,
    start,
    goal,
    maxSlots: safeOptimal + 5,
    optimal: safeOptimal,
    twoStarMax: safeOptimal + 2,
  };
}

export function starsForSolve(level: RobotLevel, commandsUsed: number): 1 | 2 | 3 {
  if (commandsUsed <= level.optimal) return 3;
  if (commandsUsed <= level.twoStarMax) return 2;
  return 1;
}

export interface RunStep {
  pos: Cell;
  bumped: boolean;
}

/** Simulates a program against the level, stopping early on goal or wall bump. */
export function runProgram(level: RobotLevel, program: Dir[]): { steps: RunStep[]; solved: boolean } {
  const steps: RunStep[] = [{ pos: level.start, bumped: false }];
  let pos = level.start;
  for (const dir of program) {
    const [dx, dy] = DIR_VECTOR[dir];
    const next: Cell = [pos[0] + dx, pos[1] + dy];
    const inBounds = next[0] >= 0 && next[0] < level.size && next[1] >= 0 && next[1] < level.size;
    const blocked = !inBounds || level.walls.has(key(next));
    if (blocked) {
      steps.push({ pos, bumped: true });
      return { steps, solved: false };
    }
    pos = next;
    steps.push({ pos, bumped: false });
    if (pos[0] === level.goal[0] && pos[1] === level.goal[1]) {
      return { steps, solved: true };
    }
  }
  return { steps, solved: pos[0] === level.goal[0] && pos[1] === level.goal[1] };
}

/** Suggests the next command to append: the first step of the shortest route from
 * wherever the currently queued program would leave the bot (stopping the simulation
 * at the first bad command, if any) to the goal. Null once nothing more is needed. */
export function hintDirection(level: RobotLevel, program: Dir[]): Dir | null {
  let pos = level.start;
  for (const dir of program) {
    const [dx, dy] = DIR_VECTOR[dir];
    const next: Cell = [pos[0] + dx, pos[1] + dy];
    const inBounds = next[0] >= 0 && next[0] < level.size && next[1] >= 0 && next[1] < level.size;
    if (!inBounds || level.walls.has(key(next))) break;
    pos = next;
    if (pos[0] === level.goal[0] && pos[1] === level.goal[1]) return null;
  }
  const path = shortestPath(level.size, level.walls, pos, level.goal);
  return path && path.length > 0 ? path[0] : null;
}
