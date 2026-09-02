import { DIRS, DIR_VECTOR, type Dir } from "../../types";
import { mulberry32 } from "../../lib/rng";
import { bestSelfAvoidingPath } from "../../lib/path";

export interface ConnectTile {
  uid: number;
  x: number;
  y: number;
  targetDir: Dir;
  dir: Dir;
  /** accumulating raw rotation for smooth clockwise spin animation */
  rotation: number;
}

export interface ConnectBoard {
  size: number;
  tiles: ConnectTile[]; // path tiles, in path order (0 = start)
  end: { x: number; y: number };
}

function levelConfig(level: number) {
  const size = Math.min(4 + Math.floor((level - 1) / 2), 8);
  const targetLen = Math.min(4 + level, size * size - 1);
  return { size, targetLen };
}

function dirBetween(a: [number, number], b: [number, number]): Dir {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return (Object.keys(DIR_VECTOR) as Dir[]).find((d) => {
    const [vx, vy] = DIR_VECTOR[d];
    return vx === dx && vy === dy;
  })!;
}

export function buildConnectBoard(size: number, targetLen: number, rand: () => number): ConnectBoard {
  let best = bestSelfAvoidingPath(size, targetLen, rand);
  if (best.length < 2) best = [[0, 0], [Math.min(1, size - 1), 0]];

  const end = best[best.length - 1];
  const tiles: ConnectTile[] = [];

  for (let i = 0; i < best.length - 1; i++) {
    const targetDir = dirBetween(best[i], best[i + 1]);
    let dir = DIRS[Math.floor(rand() * DIRS.length)];
    if (dir === targetDir) dir = DIRS[(DIRS.indexOf(dir) + 1) % DIRS.length];
    const rotationLookup: Record<Dir, number> = { up: 0, right: 90, down: 180, left: 270 };
    tiles.push({
      uid: i,
      x: best[i][0],
      y: best[i][1],
      targetDir,
      dir,
      rotation: rotationLookup[dir],
    });
  }

  return { size, tiles, end: { x: end[0], y: end[1] } };
}

export function generateConnectLevel(level: number): ConnectBoard {
  const { size, targetLen } = levelConfig(level);
  return buildConnectBoard(size, targetLen, mulberry32(level * 65599 + 7));
}

export const CONNECT_DAILY_SIZE = 6;
export const CONNECT_DAILY_LEN = 13;

export function generateConnectDaily(seed: number): ConnectBoard {
  return buildConnectBoard(CONNECT_DAILY_SIZE, CONNECT_DAILY_LEN, mulberry32(seed));
}

export function rotateTile(board: ConnectBoard, uid: number): ConnectBoard {
  const tiles = board.tiles.map((t) => {
    if (t.uid !== uid) return t;
    const nextDir = DIRS[(DIRS.indexOf(t.dir) + 1) % DIRS.length];
    return { ...t, dir: nextDir, rotation: t.rotation + 90 };
  });
  return { ...board, tiles };
}

/** number of tiles, starting from the first, that are correctly oriented in an unbroken chain */
export function connectedCount(board: ConnectBoard): number {
  let count = 0;
  for (const tile of board.tiles) {
    if (tile.dir === tile.targetDir) count++;
    else break;
  }
  return count;
}
