export interface DailyCompletion {
  success: boolean;
  /** shareable summary lines, mode-specific (e.g. "Cleared in 9 moves") */
  lines: string[];
}

export interface DailyGameProps {
  seed: number;
  /** how many times this mode has been the daily pick so far (0-indexed) —
   * only used by modes whose daily variant needs more than one seed input */
  occurrence: number;
  onComplete: (result: DailyCompletion) => void;
}
