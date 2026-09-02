import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, RotateCcw, Trophy, Skull } from "lucide-react";
import TopBar from "../../components/TopBar";
import ArrowGlyph from "../../components/ArrowGlyph";
import type { Progress } from "../../lib/storage";
import type { Dir } from "../../types";
import { DIR_ROTATION_DEG } from "../../types";
import {
  SLIDE_SIZE,
  hasMovesAvailable,
  maxValue,
  move,
  newGame,
  spawnRandomTile,
  suggestMove,
  type SlideTile,
} from "./logic";

const ACCENT = "#fbbf24";

const TILE_STYLES: Record<number, string> = {
  2: "bg-amber-100/90 text-amber-950",
  4: "bg-amber-200/90 text-amber-950",
  8: "bg-orange-300 text-orange-950",
  16: "bg-orange-400 text-orange-950",
  32: "bg-orange-500 text-white",
  64: "bg-orange-600 text-white",
  128: "bg-yellow-400 text-yellow-950",
  256: "bg-yellow-500 text-yellow-950",
  512: "bg-yellow-600 text-white",
  1024: "bg-rose-500 text-white",
  2048: "bg-rose-600 text-white",
};

function tileStyle(value: number) {
  return TILE_STYLES[value] ?? "bg-fuchsia-700 text-white";
}

function fontSizeFor(value: number) {
  if (value >= 1000) return "text-lg";
  if (value >= 100) return "text-xl";
  return "text-2xl";
}

interface SlideGameProps {
  progress: Progress;
  onProgressChange: (updater: (p: Progress) => Progress) => void;
  onBack: () => void;
}

export default function SlideGame({ progress, onProgressChange, onBack }: SlideGameProps) {
  const [tiles, setTiles] = useState<SlideTile[]>(() => newGame());
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [continued, setContinued] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hintDir, setHintDir] = useState<Dir | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const applyMove = useCallback(
    (dir: Dir) => {
      if (gameOver || (won && !continued)) return;
      setHintDir(null);
      setTiles((prev) => {
        const result = move(prev, dir);
        if (!result.moved) return prev;
        const withSpawn = spawnRandomTile(result.tiles);
        setScore((s) => {
          const newScore = s + result.scoreDelta;
          onProgressChange((p) => ({ ...p, slideBest: Math.max(p.slideBest, newScore) }));
          return newScore;
        });
        const top = maxValue(withSpawn);
        if (top >= 2048 && !won) setWon(true);
        if (!hasMovesAvailable(withSpawn)) setGameOver(true);
        return withSpawn;
      });
    },
    [gameOver, won, continued, onProgressChange]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const map: Record<string, Dir> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        applyMove(dir);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyMove]);

  function restart() {
    setTiles(newGame());
    setScore(0);
    setWon(false);
    setContinued(false);
    setGameOver(false);
    setHintDir(null);
  }

  function showHint() {
    if (gameOver || (won && !continued)) return;
    const dir = suggestMove(tiles);
    setHintDir(dir);
    if (dir) setTimeout(() => setHintDir((cur) => (cur === dir ? null : cur)), 1200);
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      applyMove(dx > 0 ? "right" : "left");
    } else {
      applyMove(dy > 0 ? "down" : "up");
    }
  }

  const cellPct = 100 / SLIDE_SIZE;

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 pb-8">
      <TopBar
        title="Arrow Slide"
        accent={ACCENT}
        onBack={onBack}
        right={
          <div className="text-right leading-tight">
            <div className="text-sm font-semibold text-white">{score}</div>
            <div className="text-[10px] text-white/40">best {progress.slideBest}</div>
          </div>
        }
      />

      <div className="relative mx-auto w-full max-w-[420px]">
        <div
          className="relative mx-auto aspect-square w-full touch-none select-none overflow-hidden rounded-2xl bg-white/[0.04] p-2 ring-1 ring-white/10"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="relative h-full w-full">
            {Array.from({ length: SLIDE_SIZE * SLIDE_SIZE }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-lg bg-white/[0.03]"
                style={{
                  width: `${cellPct}%`,
                  height: `${cellPct}%`,
                  left: `${(i % SLIDE_SIZE) * cellPct}%`,
                  top: `${Math.floor(i / SLIDE_SIZE) * cellPct}%`,
                  padding: 4,
                  backgroundClip: "content-box",
                }}
              />
            ))}

            <AnimatePresence>
              {tiles.map((tile) => (
                <motion.div
                  key={tile.id}
                  className="absolute p-1.5"
                  style={{ width: `${cellPct}%`, height: `${cellPct}%` }}
                  initial={{
                    left: `${tile.c * cellPct}%`,
                    top: `${tile.r * cellPct}%`,
                    opacity: tile.isNew ? 0 : 1,
                    scale: tile.isNew ? 0.4 : 1,
                  }}
                  animate={{
                    left: `${tile.c * cellPct}%`,
                    top: `${tile.r * cellPct}%`,
                    opacity: 1,
                    scale: tile.justMerged ? [1, 1.15, 1] : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{
                    left: { type: "spring", stiffness: 420, damping: 34 },
                    top: { type: "spring", stiffness: 420, damping: 34 },
                    scale: { duration: 0.18 },
                    opacity: { duration: 0.15 },
                  }}
                >
                  <div
                    className={`flex h-full w-full items-center justify-center rounded-xl font-bold shadow-sm ${tileStyle(
                      tile.value
                    )} ${fontSizeFor(tile.value)}`}
                  >
                    {tile.value}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {hintDir && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.7 }}
                  animate={{ scale: [0.9, 1.08, 0.9] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-amber-200 ring-2 ring-amber-300/60"
                >
                  <ArrowGlyph rotation={DIR_ROTATION_DEG[hintDir]} size={30} animate={false} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {gameOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b1020]/85 backdrop-blur-sm"
              >
                <div className="rounded-full bg-white/10 p-4 text-white/70 ring-1 ring-white/20">
                  <Skull size={28} />
                </div>
                <div className="text-lg font-semibold text-white">No more moves</div>
                <div className="text-sm text-white/50">Score: {score}</div>
                <button
                  onClick={restart}
                  className="mt-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-300"
                >
                  Try again
                </button>
              </motion.div>
            )}
            {won && !continued && !gameOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b1020]/85 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 16 }}
                  className="rounded-full bg-amber-400/15 p-4 text-amber-300 ring-1 ring-amber-400/30"
                >
                  <Trophy size={30} />
                </motion.div>
                <div className="text-lg font-semibold text-white">You reached 2048!</div>
                <div className="text-sm text-white/50">Score: {score}</div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={restart}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/15"
                  >
                    New game
                  </button>
                  <button
                    onClick={() => setContinued(true)}
                    className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-300"
                  >
                    Keep going
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={showHint}
              disabled={gameOver || (won && !continued)}
              className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-sm text-white/50 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:opacity-30"
            >
              <Lightbulb size={14} /> Hint
            </button>
            <button
              onClick={restart}
              className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <RotateCcw size={14} /> New game
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:hidden">
            <div />
            <DPadButton dir="up" onPress={applyMove} highlighted={hintDir === "up"} />
            <div />
            <DPadButton dir="left" onPress={applyMove} highlighted={hintDir === "left"} />
            <DPadButton dir="down" onPress={applyMove} highlighted={hintDir === "down"} />
            <DPadButton dir="right" onPress={applyMove} highlighted={hintDir === "right"} />
          </div>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-xs text-center text-xs text-white/30">
        Swipe, use the arrow keys, or tap the pad to push every tile. Matching
        numbers merge into one.
      </p>
    </div>
  );
}

function DPadButton({
  dir,
  onPress,
  highlighted,
}: {
  dir: Dir;
  onPress: (d: Dir) => void;
  highlighted?: boolean;
}) {
  return (
    <button
      onClick={() => onPress(dir)}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition active:scale-90 ${
        highlighted
          ? "bg-amber-400/25 text-amber-200 ring-1 ring-amber-300/60"
          : "bg-white/5 text-white/60 active:bg-white/15"
      }`}
    >
      <ArrowGlyph rotation={DIR_ROTATION_DEG[dir]} size={16} animate={false} />
    </button>
  );
}
