import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flag, Lightbulb, Play, RotateCcw, Star, X } from "lucide-react";
import TopBar from "../../components/TopBar";
import ArrowGlyph from "../../components/ArrowGlyph";
import type { Progress } from "../../lib/storage";
import { DIR_ROTATION_DEG, type Dir } from "../../types";
import {
  generateRobotLevel,
  hintDirection,
  runProgram,
  starsForSolve,
  type RobotLevel,
  type RunStep,
} from "./logic";

const ACCENT = "#38bdf8";

interface RobotGameProps {
  progress: Progress;
  onProgressChange: (updater: (p: Progress) => Progress) => void;
  onBack: () => void;
}

export default function RobotGame({ progress, onProgressChange, onBack }: RobotGameProps) {
  const [levelNum, setLevelNum] = useState(1);
  const level = useMemo<RobotLevel>(() => generateRobotLevel(levelNum), [levelNum]);
  const [program, setProgram] = useState<Dir[]>([]);
  const [running, setRunning] = useState(false);
  const [runSteps, setRunSteps] = useState<RunStep[]>([]);
  const [runIndex, setRunIndex] = useState(0);
  const [runSolved, setRunSolved] = useState(false);
  const [bumped, setBumped] = useState(false);
  const [won, setWon] = useState(false);
  const [earnedStars, setEarnedStars] = useState<1 | 2 | 3>(1);
  const [hintedIndex, setHintedIndex] = useState<number | null>(null);

  useEffect(() => {
    setProgram([]);
    setRunning(false);
    setRunSteps([]);
    setRunIndex(0);
    setBumped(false);
    setWon(false);
    setHintedIndex(null);
  }, [levelNum]);

  useEffect(() => {
    if (!running) return;
    if (runIndex >= runSteps.length - 1) {
      const t = setTimeout(() => {
        if (runSolved) {
          const stars = starsForSolve(level, program.length);
          setEarnedStars(stars);
          setWon(true);
          onProgressChange((p) => ({
            ...p,
            robotStars: { ...p.robotStars, [levelNum]: Math.max(p.robotStars[levelNum] ?? 0, stars) },
            robotUnlocked: Math.max(p.robotUnlocked, levelNum + 1),
          }));
        } else {
          setBumped(true);
          setTimeout(() => {
            setBumped(false);
            setRunning(false);
            setRunIndex(0);
          }, 420);
        }
      }, 180);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRunIndex((i) => i + 1), 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, runIndex, runSteps, runSolved]);

  function addCommand(dir: Dir) {
    if (running || program.length >= level.maxSlots) return;
    setHintedIndex(null);
    setProgram((p) => [...p, dir]);
  }

  function removeAt(idx: number) {
    if (running) return;
    setHintedIndex(null);
    setProgram((p) => p.filter((_, i) => i !== idx));
  }

  function clearProgram() {
    if (running) return;
    setHintedIndex(null);
    setProgram([]);
  }

  function showHint() {
    if (running || program.length >= level.maxSlots) return;
    const dir = hintDirection(level, program);
    if (!dir) return;
    const insertedAt = program.length;
    setProgram((p) => [...p, dir]);
    setHintedIndex(insertedAt);
    setTimeout(() => setHintedIndex((cur) => (cur === insertedAt ? null : cur)), 1800);
  }

  function handleRun() {
    if (running || program.length === 0) return;
    const result = runProgram(level, program);
    setRunSteps(result.steps);
    setRunSolved(result.solved);
    setRunIndex(0);
    setRunning(true);
  }

  function restart() {
    setProgram([]);
    setRunning(false);
    setRunSteps([]);
    setRunIndex(0);
    setBumped(false);
    setWon(false);
    setHintedIndex(null);
  }

  const robotPos = running && runSteps.length > 0 ? runSteps[runIndex].pos : level.start;
  const cellPct = 100 / level.size;
  const stars = progress.robotStars[levelNum] ?? 0;
  const maxUnlocked = progress.robotUnlocked;

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 pb-8">
      <TopBar
        title="Arrow Bot"
        accent={ACCENT}
        onBack={onBack}
        right={
          <div className="flex items-center justify-end gap-0.5">
            {[1, 2, 3].map((n) => (
              <Star
                key={n}
                size={13}
                className={n <= stars ? "fill-sky-300 text-sky-300" : "text-white/15"}
              />
            ))}
          </div>
        }
      />

      <div className="mb-4 flex items-center justify-center gap-3">
        <button
          disabled={levelNum <= 1}
          onClick={() => setLevelNum((l) => Math.max(1, l - 1))}
          className="rounded-full bg-white/5 p-2 text-white/60 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-[110px] text-center">
          <div className="text-sm font-semibold text-white">Level {levelNum}</div>
          <div className="text-xs text-white/40">Best path: {level.optimal} moves</div>
        </div>
        <button
          disabled={levelNum + 1 > maxUnlocked}
          onClick={() => setLevelNum((l) => l + 1)}
          className="rounded-full bg-white/5 p-2 text-white/60 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="relative mx-auto w-full max-w-[420px]">
        <motion.div
          animate={bumped ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.32 }}
          className="relative mx-auto aspect-square w-full overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10"
        >
          {Array.from({ length: level.size * level.size }).map((_, i) => {
            const x = i % level.size;
            const y = Math.floor(i / level.size);
            const isWall = level.walls.has(`${x},${y}`);
            return (
              <div
                key={i}
                className="absolute p-[3px]"
                style={{
                  width: `${cellPct}%`,
                  height: `${cellPct}%`,
                  left: `${x * cellPct}%`,
                  top: `${y * cellPct}%`,
                }}
              >
                <div
                  className={`h-full w-full rounded-md ${isWall ? "bg-white/10" : "bg-white/[0.03]"}`}
                />
              </div>
            );
          })}

          <div
            className="absolute flex items-center justify-center p-1.5"
            style={{
              width: `${cellPct}%`,
              height: `${cellPct}%`,
              left: `${level.goal[0] * cellPct}%`,
              top: `${level.goal[1] * cellPct}%`,
            }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-md bg-sky-400/15 text-sky-300 ring-1 ring-sky-400/30">
              <Flag size={18} />
            </div>
          </div>

          <motion.div
            className="pointer-events-none absolute flex items-center justify-center p-1.5"
            animate={{
              left: `${robotPos[0] * cellPct}%`,
              top: `${robotPos[1] * cellPct}%`,
            }}
            style={{ width: `${cellPct}%`, height: `${cellPct}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-md bg-sky-400 text-sky-950 shadow-lg shadow-sky-400/30">
              <div className="h-2.5 w-2.5 rounded-full bg-sky-950" />
            </div>
          </motion.div>

          <AnimatePresence>
            {won && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b1020]/85 backdrop-blur-sm"
              >
                <div className="flex gap-1">
                  {[1, 2, 3].map((n) => (
                    <motion.div
                      key={n}
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: n * 0.1, type: "spring", stiffness: 300, damping: 14 }}
                    >
                      <Star
                        size={28}
                        className={n <= earnedStars ? "fill-sky-300 text-sky-300" : "text-white/15"}
                      />
                    </motion.div>
                  ))}
                </div>
                <div className="text-lg font-semibold text-white">Bot reached home!</div>
                <div className="text-sm text-white/50">{program.length} commands used</div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={restart}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/15"
                  >
                    Replay
                  </button>
                  <button
                    onClick={() => setLevelNum((l) => l + 1)}
                    className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-sky-950 transition hover:bg-sky-300"
                  >
                    Next level
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-4 flex items-center justify-between text-sm text-white/50">
          <span>Program ({program.length}/{level.maxSlots})</span>
          <div className="flex gap-2">
            <button
              onClick={showHint}
              disabled={running || program.length >= level.maxSlots}
              className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:opacity-30"
            >
              <Lightbulb size={14} /> Hint
            </button>
            <button
              onClick={clearProgram}
              disabled={running || program.length === 0}
              className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:opacity-30"
            >
              <RotateCcw size={14} /> Clear
            </button>
          </div>
        </div>

        <div className="mt-2 flex min-h-[42px] flex-wrap gap-1.5 rounded-xl bg-white/[0.04] p-2 ring-1 ring-white/10">
          {program.length === 0 && (
            <span className="px-1 py-1.5 text-xs text-white/25">
              Tap the arrows below to build a path…
            </span>
          )}
          {program.map((dir, idx) => (
            <button
              key={idx}
              onClick={() => removeAt(idx)}
              disabled={running}
              className={`group relative flex h-8 w-8 items-center justify-center rounded-lg transition enabled:hover:bg-rose-400/20 enabled:hover:text-rose-300 enabled:hover:ring-rose-400/30 ${
                hintedIndex === idx
                  ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-300/60"
                  : "bg-sky-400/15 text-sky-300 ring-1 ring-sky-400/30"
              }`}
            >
              <ArrowGlyph rotation={DIR_ROTATION_DEG[dir]} size={16} animate={false} />
              <X
                size={10}
                className="absolute -right-1 -top-1 hidden rounded-full bg-rose-400 text-rose-950 group-hover:block"
              />
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="grid grid-cols-3 gap-1.5">
            <div />
            <PaletteButton dir="up" onPress={addCommand} disabled={running} />
            <div />
            <PaletteButton dir="left" onPress={addCommand} disabled={running} />
            <PaletteButton dir="down" onPress={addCommand} disabled={running} />
            <PaletteButton dir="right" onPress={addCommand} disabled={running} />
          </div>
          <button
            onClick={handleRun}
            disabled={running || program.length === 0}
            className="flex items-center gap-2 rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-sky-950 transition enabled:hover:bg-sky-300 disabled:opacity-40"
          >
            <Play size={16} fill="currentColor" /> Run
          </button>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-xs text-center text-xs text-white/30">
        Queue up moves, then run the program. Reach the flag without hitting a
        wall to earn up to three stars.
      </p>
    </div>
  );
}

function PaletteButton({
  dir,
  onPress,
  disabled,
}: {
  dir: Dir;
  onPress: (d: Dir) => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={() => onPress(dir)}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/60 transition enabled:active:scale-90 enabled:hover:bg-white/10 enabled:hover:text-white disabled:opacity-30"
    >
      <ArrowGlyph rotation={DIR_ROTATION_DEG[dir]} size={16} animate={false} />
    </button>
  );
}
