import { DIRS, DIR_VECTOR, type Dir } from "../../types";
import { mulberry32, shuffle } from "../../lib/rng";

export interface ClearTile {
  uid: number;
  x: number;
  y: number;
  dir: Dir;
}

export interface ClearBoard {
  size: number;
  tiles: ClearTile[];
}

export function levelConfig(level: number) {
  const size = Math.min(4 + Math.floor((level - 1) / 3), 7);
  const cells = size * size;
  const count = Math.min(4 + level, cells - 2);
  return { size, count };
}

/**
 * Builds a board that is guaranteed solvable: arrows are placed in reverse
 * removal order, each requiring a clear straight path to the edge against
 * only the tiles already on the board (i.e. the ones that would still be
 * present when this arrow's turn comes up).
 */
export function generateClearLevel(level: number): ClearBoard {
  const { size, count } = levelConfig(level);
  const rand = mulberry32(level * 104729 + 17);
  const occupied = new Set<string>();
  const placed: ClearTile[] = [];

  const key = (x: number, y: number) => `${x},${y}`;

  const pathClear = (x: number, y: number, dir: Dir): boolean => {
    const [dx, dy] = DIR_VECTOR[dir];
    let cx = x + dx;
    let cy = y + dy;
    while (cx >= 0 && cx < size && cy >= 0 && cy < size) {
      if (occupied.has(key(cx, cy))) return false;
      cx += dx;
      cy += dy;
    }
    return true;
  };

  const emptyCells: [number, number][] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) emptyCells.push([x, y]);
  }

  let uid = 1;
  for (let i = count - 1; i >= 0; i--) {
    const candidates = shuffle(emptyCells, rand).filter(([x, y]) => !occupied.has(key(x, y)));
    let placedOk = false;
    for (const [x, y] of candidates) {
      const dirsShuffled = shuffle(DIRS, rand);
      const dir = dirsShuffled.find((d) => pathClear(x, y, d));
      if (dir) {
        occupied.add(key(x, y));
        placed.push({ uid: uid++, x, y, dir });
        placedOk = true;
        break;
      }
    }
    if (!placedOk) break; // board is as full as it can usefully be
  }

  return { size, tiles: placed };
}

export interface MoveResult {
  tiles: ClearTile[];
  removed: boolean;
  moved: boolean;
}

export function applyMove(board: ClearBoard, uid: number): MoveResult {
  const tile = board.tiles.find((t) => t.uid === uid);
  if (!tile) return { tiles: board.tiles, removed: false, moved: false };

  const [dx, dy] = DIR_VECTOR[tile.dir];
  const occupied = new Map(board.tiles.filter((t) => t.uid !== uid).map((t) => [`${t.x},${t.y}`, t]));

  let cx = tile.x;
  let cy = tile.y;
  let lastFree: [number, number] | null = null;

  while (true) {
    const nx = cx + dx;
    const ny = cy + dy;
    if (nx < 0 || nx >= board.size || ny < 0 || ny >= board.size) {
      // exits cleanly -> removed
      return {
        tiles: board.tiles.filter((t) => t.uid !== uid),
        removed: true,
        moved: true,
      };
    }
    if (occupied.has(`${nx},${ny}`)) break;
    cx = nx;
    cy = ny;
    lastFree = [cx, cy];
  }

  if (!lastFree || (lastFree[0] === tile.x && lastFree[1] === tile.y)) {
    return { tiles: board.tiles, removed: false, moved: false };
  }

  const tiles = board.tiles.map((t) =>
    t.uid === uid ? { ...t, x: lastFree![0], y: lastFree![1] } : t
  );
  return { tiles, removed: false, moved: true };
}

/** A tile that can be cleanly removed right now, based on the current board — always
 * correct regardless of move history, since it re-checks live occupancy rather than
 * trusting the original generation order. Null if no tile currently has a clear exit. */
export function findHint(board: ClearBoard): number | null {
  for (const tile of board.tiles) {
    if (applyMove(board, tile.uid).removed) return tile.uid;
  }
  return null;
}
