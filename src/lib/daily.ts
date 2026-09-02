import type { ModeId } from "../types";
import type { DailyResult, Progress } from "./storage";

/** First daily puzzle date — Puzzle #1. Everything before this doesn't exist. */
const LAUNCH_DATE = new Date(2026, 8, 1); // 2026-09-01, local time

export const DAILY_MODE_ORDER: ModeId[] = ["clear", "connect", "slide", "robot", "trace"];

/** Local-calendar date key, e.g. "2026-09-02". Uses the player's local day, not UTC. */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const aMid = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bMid = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((bMid - aMid) / msPerDay);
}

/** 1-indexed puzzle number for a given date, relative to launch day. */
export function puzzleNumberFor(d: Date = new Date()): number {
  return Math.max(1, daysBetween(LAUNCH_DATE, d) + 1);
}

/** Deterministic 32-bit hash of the date key, used to seed that day's puzzle. */
export function seedFor(dateKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function modeForPuzzle(puzzleNumber: number): ModeId {
  return DAILY_MODE_ORDER[(puzzleNumber - 1) % DAILY_MODE_ORDER.length];
}

/** How many times this puzzle's mode has come up so far (0-indexed) — use this,
 * not the raw puzzle number, to vary anything (like Trace's shape) that would
 * otherwise alias against the mode rotation's own period. */
export function modeOccurrenceIndex(puzzleNumber: number): number {
  return Math.floor((puzzleNumber - 1) / DAILY_MODE_ORDER.length);
}

export function isYesterday(dateKey: string, today: string): boolean {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  return todayKey(date) === today;
}

/**
 * Pure reducer for recording a daily-challenge completion: updates the streak
 * (continuing it only if yesterday was the last completed day), best streak,
 * and history. Already-recorded days are a no-op (first completion wins).
 */
export function applyDailyCompletion(
  progress: Progress,
  dateKey: string,
  puzzleNumber: number,
  mode: ModeId,
  completion: { success: boolean; lines: string[] }
): Progress {
  if (progress.daily.history[dateKey]) return progress;

  const wasYesterday = progress.daily.lastCompletedDate
    ? isYesterday(progress.daily.lastCompletedDate, dateKey)
    : false;
  const newStreak = completion.success ? (wasYesterday ? progress.daily.streak + 1 : 1) : 0;

  const result: DailyResult = {
    dateKey,
    puzzleNumber,
    mode,
    success: completion.success,
    lines: completion.lines,
  };

  return {
    ...progress,
    daily: {
      streak: newStreak,
      bestStreak: Math.max(progress.daily.bestStreak, newStreak),
      lastCompletedDate: dateKey,
      history: { ...progress.daily.history, [dateKey]: result },
    },
  };
}
