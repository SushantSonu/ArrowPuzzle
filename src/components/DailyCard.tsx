import { motion } from "framer-motion";
import { Check, ChevronRight, Flame } from "lucide-react";
import { modeForPuzzle, puzzleNumberFor, todayKey } from "../lib/daily";
import { DAILY_MODE_META } from "../games/daily/meta";
import type { Progress } from "../lib/storage";

interface DailyCardProps {
  progress: Progress;
  onPlay: () => void;
}

export default function DailyCard({ progress, onPlay }: DailyCardProps) {
  const dateKey = todayKey();
  const puzzleNumber = puzzleNumberFor();
  const mode = modeForPuzzle(puzzleNumber);
  const meta = DAILY_MODE_META[mode];
  const Icon = meta.icon;
  const completed = Boolean(progress.daily.history[dateKey]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onPlay}
      className="group relative mb-6 flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/25 via-fuchsia-500/15 to-transparent p-5 text-left ring-1 ring-white/15"
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${meta.accent}22`, color: meta.accent }}
      >
        <Icon size={26} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Daily Puzzle #{puzzleNumber}
        </div>
        <div className="mt-0.5 truncate text-lg font-bold text-white">{meta.label}</div>
        <div className="mt-1 flex items-center gap-3 text-xs text-white/50">
          {progress.daily.streak > 0 && (
            <span className="flex items-center gap-1 text-orange-400">
              <Flame size={13} /> {progress.daily.streak}-day streak
            </span>
          )}
          {completed && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Check size={13} /> Completed
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={20} className="shrink-0 text-white/30 transition group-hover:translate-x-1 group-hover:text-white/60" />
    </motion.button>
  );
}
