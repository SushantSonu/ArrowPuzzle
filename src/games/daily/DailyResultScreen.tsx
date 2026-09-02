import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Copy, Flame, X } from "lucide-react";
import type { DailyResult } from "../../lib/storage";
import { DAILY_MODE_META } from "./meta";
import type { ModeId } from "../../types";

interface DailyResultScreenProps {
  result: DailyResult;
  streak: number;
  bestStreak: number;
  onBack: () => void;
}

function shareText(result: DailyResult, streak: number): string {
  const meta = DAILY_MODE_META[result.mode as ModeId];
  const lines = [
    `Arrow Puzzle Daily #${result.puzzleNumber} — ${meta.label}`,
    result.success ? "✅ Solved" : "❌ Not solved",
    ...result.lines,
    `🔥 ${streak}-day streak`,
  ];
  return lines.join("\n");
}

export default function DailyResultScreen({ result, streak, bestStreak, onBack }: DailyResultScreenProps) {
  const [copied, setCopied] = useState(false);
  const meta = DAILY_MODE_META[result.mode as ModeId];
  const Icon = meta.icon;

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText(result, streak));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 pb-8">
      <div className="flex items-center justify-between px-1 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Menu</span>
        </button>
        <h1 className="text-base font-semibold tracking-wide text-white/80 sm:text-lg">
          Daily Puzzle #{result.puzzleNumber}
        </h1>
        <div className="min-w-[68px]" />
      </div>

      <div className="mx-auto mt-4 w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white/[0.04] p-6 text-center ring-1 ring-white/10"
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${meta.accent}22`, color: meta.accent }}
          >
            {result.success ? <Check size={26} /> : <X size={26} />}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-white/50">
            <Icon size={15} />
            <span className="text-sm font-medium">{meta.label}</span>
          </div>
          <div className="mt-1 text-lg font-bold text-white">
            {result.success ? "Solved!" : "Not solved"}
          </div>

          <div className="mt-4 space-y-1">
            {result.lines.map((line, i) => (
              <div key={i} className="text-sm text-white/70">
                {line}
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-center gap-6 border-t border-white/10 pt-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xl font-bold text-orange-400">
                <Flame size={18} /> {streak}
              </div>
              <div className="text-[11px] text-white/40">streak</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white/70">{bestStreak}</div>
              <div className="text-[11px] text-white/40">best</div>
            </div>
          </div>
        </motion.div>

        <button
          onClick={copy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied!" : "Copy result"}
        </button>

        <p className="mx-auto mt-4 max-w-xs text-center text-xs text-white/30">
          Come back tomorrow for a new puzzle — the mode rotates daily.
        </p>
      </div>
    </div>
  );
}
