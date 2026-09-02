export type Dir = "up" | "down" | "left" | "right";

export const DIRS: Dir[] = ["up", "right", "down", "left"];

export const DIR_VECTOR: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export const DIR_ROTATION_DEG: Record<Dir, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

export function oppositeDir(d: Dir): Dir {
  return OPPOSITE[d];
}

export type ModeId = "clear" | "connect" | "slide" | "robot" | "trace";

export interface ModeMeta {
  id: ModeId;
  title: string;
  tagline: string;
  accent: string;
  accentSoft: string;
}
