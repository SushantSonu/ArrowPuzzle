const NS = "arrow-puzzle:";

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode, quota) — ignore
  }
}

export interface Progress {
  clearBestMoves: Record<number, number>; // level -> best move count
  clearUnlocked: number;
  connectBestSeconds: Record<number, number>;
  connectUnlocked: number;
  slideBest: number;
  robotStars: Record<number, number>; // level -> stars 0-3
  robotUnlocked: number;
  traceBestSeconds: Record<number, number>;
  traceUnlocked: number;
}

export const defaultProgress: Progress = {
  clearBestMoves: {},
  clearUnlocked: 1,
  connectBestSeconds: {},
  connectUnlocked: 1,
  slideBest: 0,
  robotStars: {},
  robotUnlocked: 1,
  traceBestSeconds: {},
  traceUnlocked: 1,
};

export function loadProgress(): Progress {
  return loadJSON("progress", defaultProgress);
}

export function saveProgress(p: Progress) {
  saveJSON("progress", p);
}
