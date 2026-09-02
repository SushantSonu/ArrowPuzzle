import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  Flag,
  Footprints,
  Heart,
  Lightbulb,
  RotateCcw,
  Settings,
  Skull,
  Trophy,
} from "lucide-react";
import ArrowGlyph from "../../components/ArrowGlyph";
import type { Progress } from "../../lib/storage";
import { DIR_ROTATION_DEG } from "../../types";
import { generateTraceLevel, pathDirs, type TraceBoard } from "./logic";

interface TraceGameProps {
  progress: Progress;
  onProgressChange: (updater: (p: Progress) => Progress) => void;
  onBack: () => void;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TraceGame({ progress, onProgressChange, onBack }: TraceGameProps) {
  const [level, setLevel] = useState(1);
  const [board, setBoard] = useState<TraceBoard>(() => generateTraceLevel(1));
  const [tracedCount, setTracedCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [mistake, setMistake] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [won, setWon] = useState(false);
  const [hintUntil, setHintUntil] = useState<number | null>(null);
  const [lives, setLives] = useState(() => board.lives);
  const [outOfLives, setOutOfLives] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const dirs = useMemo(() => pathDirs(board.path), [board]);
  const indexMap = useMemo(() => {
    const m = new Map<string, number>();
    board.path.forEach(([x, y], i) => m.set(`${x},${y}`, i));
    return m;
  }, [board]);

  useEffect(() => {
    const fresh = generateTraceLevel(level);
    setBoard(fresh);
    setTracedCount(0);
    setDragging(false);
    setSeconds(0);
    setWon(false);
    setHintUntil(null);
    setLives(fresh.lives);
    setOutOfLives(false);
  }, [level]);

  useEffect(() => {
    if (won || outOfLives) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [won, outOfLives, level]);

  function restart() {
    const fresh = generateTraceLevel(level);
    setBoard(fresh);
    setTracedCount(0);
    setDragging(false);
    setSeconds(0);
    setWon(false);
    setHintUntil(null);
    setLives(fresh.lives);
    setOutOfLives(false);
  }

  function showHint() {
    if (won || outOfLives || tracedCount >= board.path.length) return;
    const until = tracedCount + 3;
    setHintUntil(until);
    setTimeout(() => setHintUntil((cur) => (cur === until ? null : cur)), 1500);
  }

  function cellFromEvent(e: { clientX: number; clientY: number }): [number, number] | null {
    const el = boardRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const cell = rect.width / board.size;
    const x = Math.floor((e.clientX - rect.left) / cell);
    const y = Math.floor((e.clientY - rect.top) / cell);
    if (x < 0 || x >= board.size || y < 0 || y >= board.size) return null;
    return [x, y];
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (won || outOfLives) return;
    const cell = cellFromEvent(e);
    if (!cell) return;
    const idx = indexMap.get(`${cell[0]},${cell[1]}`);
    if (idx !== tracedCount) return;
    boardRef.current?.setPointerCapture(e.pointerId);
    setDragging(true);
    setHintUntil(null);
    const next = tracedCount + 1;
    setTracedCount(next);
    if (next === board.path.length) finishWin();
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging || won || outOfLives) return;
    const cell = cellFromEvent(e);
    if (!cell) return;
    const idx = indexMap.get(`${cell[0]},${cell[1]}`);
    if (idx === undefined) return;
    if (idx === tracedCount) {
      const next = tracedCount + 1;
      setTracedCount(next);
      if (next === board.path.length) finishWin();
    } else if (idx === tracedCount - 1) {
      // hovering the last traced cell, no-op
    } else {
      setMistake(true);
      setDragging(false);
      setTracedCount(0);
      setTimeout(() => setMistake(false), 320);
      setLives((l) => {
        const next = l - 1;
        if (next <= 0) setOutOfLives(true);
        return Math.max(0, next);
      });
    }
  }

  function handlePointerUp() {
    setDragging(false);
  }

  function finishWin() {
    setDragging(false);
    setWon(true);
    onProgressChange((p) => {
      const best = p.traceBestSeconds[level];
      return {
        ...p,
        traceBestSeconds: { ...p.traceBestSeconds, [level]: best ? Math.min(best, seconds) : seconds },
        traceUnlocked: Math.max(p.traceUnlocked, level + 1),
      };
    });
  }

  const maxUnlocked = progress.traceUnlocked;
  const cellPct = 100 / board.size;
  const tracedPoints = board.path
    .slice(0, tracedCount)
    .map(([x, y]) => `${x + 0.5},${y + 0.5}`)
    .join(" ");
  const fullPoints = board.path.map(([x, y]) => `${x + 0.5},${y + 0.5}`).join(" ");

  return (
    <div className="min-h-full bg-neutral-50 text-neutral-900">
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 pb-8 pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="text-center">
            <div className="text-lg font-bold text-neutral-900">Level {level}</div>
            <div className="text-[11px] text-neutral-400">{formatTime(seconds)}</div>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100">
            <Settings size={19} />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1 text-sm font-semibold text-neutral-500">
            <Footprints size={15} /> {board.path.length}
          </span>
          <span className="flex items-center gap-1">
            {Array.from({ length: board.lives }).map((_, i) => (
              <Heart
                key={i}
                size={16}
                className={i < lives ? "fill-rose-500 text-rose-500" : "fill-neutral-200 text-neutral-200"}
              />
            ))}
          </span>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500">
            {board.difficulty}
          </span>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={level <= 1}
            onClick={() => setLevel((l) => Math.max(1, l - 1))}
            className="text-xs font-medium text-neutral-300 transition enabled:text-blue-500 disabled:opacity-0"
          >
            ‹ Prev
          </button>
          <button
            disabled={level + 1 > maxUnlocked}
            onClick={() => setLevel((l) => l + 1)}
            className="text-xs font-medium text-neutral-300 transition enabled:text-blue-500 disabled:opacity-0"
          >
            Next ›
          </button>
        </div>

        <div className="relative mx-auto mt-4 w-full max-w-[420px]">
          <motion.div
            ref={boardRef}
            animate={mistake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.32 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative mx-auto aspect-square w-full touch-none select-none overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200"
          >
            {Array.from({ length: board.size * board.size }).map((_, i) => {
              const x = i % board.size;
              const y = Math.floor(i / board.size);
              const key = `${x},${y}`;
              if (!board.mask.has(key)) return null;
              return (
                <div
                  key={`silhouette-${key}`}
                  className="pointer-events-none absolute p-[3px]"
                  style={{
                    width: `${cellPct}%`,
                    height: `${cellPct}%`,
                    left: `${x * cellPct}%`,
                    top: `${y * cellPct}%`,
                  }}
                >
                  <div className="h-full w-full rounded-md bg-neutral-50" />
                </div>
              );
            })}

            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox={`0 0 ${board.size} ${board.size}`}
            >
              <polyline
                points={fullPoints}
                fill="none"
                stroke="#d4d4d8"
                strokeWidth={0.14}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {tracedCount > 1 && (
                <polyline
                  points={tracedPoints}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={0.16}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>

            {board.path.map(([x, y], i) => {
              const isStart = i === 0;
              const isEnd = i === board.path.length - 1;
              const traced = i < tracedCount;
              const isHead = i === tracedCount && !won;
              const isPeeked = hintUntil !== null && i >= tracedCount && i < hintUntil && !traced;
              return (
                <div
                  key={i}
                  className="pointer-events-none absolute flex items-center justify-center"
                  style={{
                    width: `${cellPct}%`,
                    height: `${cellPct}%`,
                    left: `${x * cellPct}%`,
                    top: `${y * cellPct}%`,
                  }}
                >
                  <div
                    className={`relative flex h-full w-full items-center justify-center transition-colors ${
                      traced || won
                        ? "text-blue-600"
                        : isPeeked
                          ? "text-amber-500"
                          : "text-neutral-800"
                    }`}
                  >
                    {isHead && (
                      <motion.span
                        className="absolute h-2/3 w-2/3 rounded-full bg-blue-500/15"
                        animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                    {isStart && (
                      <span className="absolute -top-1 -left-1 z-10 rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                        S
                      </span>
                    )}
                    {isEnd ? (
                      <Flag size={17} strokeWidth={2.4} fill={won ? "currentColor" : "none"} />
                    ) : (
                      <ArrowGlyph rotation={DIR_ROTATION_DEG[dirs[i]!]} size={17} strokeWidth={2.6} animate={false} />
                    )}
                  </div>
                </div>
              );
            })}

            <AnimatePresence>
              {outOfLives && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95 backdrop-blur-sm"
                >
                  <div className="rounded-full bg-neutral-100 p-4 text-neutral-500">
                    <Skull size={28} />
                  </div>
                  <div className="text-lg font-bold text-neutral-900">Out of hearts</div>
                  <div className="text-sm text-neutral-500">Landed on the wrong arrow too many times.</div>
                  <button
                    onClick={restart}
                    className="mt-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    Try again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {won && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 16 }}
                    className="rounded-full bg-blue-50 p-4 text-blue-600"
                  >
                    <Trophy size={30} />
                  </motion.div>
                  <div className="text-lg font-bold text-neutral-900">Path traced!</div>
                  <div className="text-sm text-neutral-500">{formatTime(seconds)}</div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={restart}
                      className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200"
                    >
                      Replay
                    </button>
                    <button
                      onClick={() => setLevel((l) => l + 1)}
                      className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                    >
                      Next level
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="mt-5 flex items-center justify-center gap-6">
            <button
              onClick={showHint}
              disabled={won || outOfLives}
              className="flex flex-col items-center gap-1 text-neutral-500 transition enabled:hover:text-blue-600 disabled:opacity-30"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 shadow-sm">
                <Lightbulb size={20} />
              </span>
              <span className="text-[11px] font-medium">Hint</span>
            </button>
            <button
              onClick={restart}
              className="flex flex-col items-center gap-1 text-neutral-500 transition hover:text-blue-600"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 shadow-sm">
                <RotateCcw size={19} />
              </span>
              <span className="text-[11px] font-medium">Restart</span>
            </button>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-xs text-center text-xs text-neutral-400">
          Press S, then drag through every arrow in order to the flag. Landing
          on the wrong arrow costs a heart.
        </p>
      </div>
    </div>
  );
}
