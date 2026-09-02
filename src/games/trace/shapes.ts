import type { Cell } from "../../lib/path";

export type ShapeName = "square" | "diamond" | "heart" | "ring" | "cross";

interface Shape {
  name: ShapeName;
  label: string;
  test: (nx: number, ny: number) => boolean;
}

// nx, ny are normalized coordinates in roughly [-1, 1], centered on the grid,
// with ny flipped so positive is "up" (screen y grows downward).
const SHAPES: Shape[] = [
  { name: "square", label: "Grid", test: () => true },
  { name: "diamond", label: "Diamond", test: (nx, ny) => Math.abs(nx) + Math.abs(ny) <= 1.05 },
  {
    name: "heart",
    label: "Heart",
    test: (nx, ny) => {
      const x = nx * 1.0;
      const y = ny * 1.15;
      return Math.pow(x * x + y * y - 1, 3) - x * x * Math.pow(y, 3) <= 0;
    },
  },
  {
    name: "ring",
    label: "Ring",
    test: (nx, ny) => {
      const d = Math.sqrt(nx * nx + ny * ny);
      return d >= 0.45 && d <= 1.05;
    },
  },
  { name: "cross", label: "Cross", test: (nx, ny) => Math.abs(nx) <= 0.4 || Math.abs(ny) <= 0.4 },
];

export function shapeForLevel(level: number): Shape {
  return SHAPES[(level - 1) % SHAPES.length];
}

/** Builds the set of in-shape cells for a size x size grid, with a fallback
 * to the full square if the requested shape leaves too few cells to play on. */
export function buildMask(size: number, shape: Shape): { mask: Set<string>; name: ShapeName } {
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const radius = (size - 1) / 2;

  const cellsFor = (test: (nx: number, ny: number) => boolean) => {
    const set = new Set<string>();
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const nx = (x - cx) / radius;
        const ny = -(y - cy) / radius;
        if (test(nx, ny)) set.add(`${x},${y}`);
      }
    }
    return set;
  };

  let mask = cellsFor(shape.test);
  let name = shape.name;
  if (mask.size < size * 1.5) {
    mask = cellsFor(() => true);
    name = "square";
  }
  return { mask, name };
}

export function isAllowed(mask: Set<string>, cell: Cell): boolean {
  return mask.has(`${cell[0]},${cell[1]}`);
}
