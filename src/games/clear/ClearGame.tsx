import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Lightbulb, RotateCcw, Trophy } from "lucide-react";
import TopBar from "../../components/TopBar";
import ArrowGlyph from "../../components/ArrowGlyph";
import { DIR_ROTATION_DEG, DIR_VECTOR } from "../../types";
import type { Progress } from "../../lib/storage";
import { applyMove, findHint, generateClearLevel, type ClearBoard, type ClearTile } from "./logic";

const ACCENT = "#34d399";

interface ExitingTile extends ClearTile {
  key: string;
}

interface ClearGameProps {
  progress: Progress;
  onProgressChange: (updater: (p: Progress) => Progress) => void;
  onBack: () => void;
}

export default function ClearGame({ progress, onProgressChange, onBack }: ClearGameProps) {
  const [level, setLevel] = useState(1);
  const [board, setBoard] = useState<ClearBoard>(() => generateClearLevel(1));
  const [moves, setMoves] = useState(0);
  const [exiting, setExiting] = useState<ExitingTile[]>([]);
  const [shakeUid, setShakeUid] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [hintUid, setHintUid] = useState<number | null>(null);

  useEffect(() => {
    setBoard(generateClearLevel(level));
    setMoves(0);
    setExiting([]);
    setWon(false);
    setHintUid(null);
  }, [level]);

  const remaining = board.tiles.length;
  const maxUnlocked = progress.clearUnlocked;

  function restart() {
    setBoard(generateClearLevel(level));
    setMoves(0);
    setExiting([]);
    setWon(false);
    setHintUid(null);
  }

  function showHint() {
    const uid = findHint(board);
    setHintUid(uid);
    if (uid !== null) setTimeout(() => setHintUid((cur) => (cur === uid ? null : cur)), 1800);
  }

  function handleTap(tile: ClearTile) {
    if (won) return;
    setHintUid(null);
    const result = applyMove(board, tile.uid);
    if (!result.moved) {
      setShakeUid(tile.uid);
      setTimeout(() => setShakeUid(null), 320);
      return;
    }
    setMoves((m) => m + 1);
    if (result.removed) {
      const exitKey = `${tile.uid}-${Date.now()}`;
      setExiting((prev) => [...prev, { ...tile, key: exitKey }]);
      setTimeout(() => {
        setExiting((prev) => prev.filter((t) => t.key !== exitKey));
      }, 260);
    }
    setBoard({ ...board, tiles: result.tiles });
    if (result.tiles.length === 0) {
      setWon(true);
      onProgressChange((p) => {
        const best = p.clearBestMoves[level];
        const nextMoves = moves + 1;
        return {
          ...p,
          clearBestMoves: {
            ...p.clearBestMoves,
            [level]: best ? Math.min(best, nextMoves) : nextMoves,
          },
          clearUnlocked: Math.max(p.clearUnlocked, level + 1),
        };
      });
    }
  }

  const exitOffset = (dir: ClearTile["dir"]) => {
    const [dx, dy] = DIR_VECTOR[dir];
    return { x: dx * 60, y: dy * 60 };
  };

  const best = progress.clearBestMoves[level];

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 pb-8">
      <TopBar
        title="Arrow Clear"
        accent={ACCENT}
        onBack={onBack}
        right={<span>{moves} moves</span>}
      />

      <div className="mb-4 flex items-center justify-center gap-3">
        <button
          disabled={level <= 1}
          onClick={() => setLevel((l) => Math.max(1, l - 1))}
          className="rounded-full bg-white/5 p-2 text-white/60 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-[110px] text-center">
          <div className="text-sm font-semibold text-white">Level {level}</div>
          <div className="text-xs text-white/40">{best ? `Best: ${best} moves` : "Unsolved"}</div>
        </div>
        <button
          disabled={level + 1 > maxUnlocked}
          onClick={() => setLevel((l) => l + 1)}
          className="rounded-full bg-white/5 p-2 text-white/60 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="relative mx-auto w-full max-w-[420px]">
        <div
          className="relative mx-auto aspect-square w-full overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: `${100 / board.size}% ${100 / board.size}%`,
          }}
        >
          {board.tiles.map((tile) => (
            <motion.button
              key={tile.uid}
              className="absolute flex items-center justify-center p-1.5"
              style={{ width: `${100 / board.size}%`, height: `${100 / board.size}%` }}
              animate={{
                left: `${(tile.x / board.size) * 100}%`,
                top: `${(tile.y / board.size) * 100}%`,
                x: shakeUid === tile.uid ? [0, -5, 5, -3, 3, 0] : 0,
                y: shakeUid === tile.uid ? [0, -5, 5, -3, 3, 0] : 0,
              }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={() => handleTap(tile)}
            >
              <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30 transition hover:bg-emerald-400/25 active:scale-90">
                {hintUid === tile.uid && (
                  <motion.span
                    className="absolute inset-0 rounded-xl ring-2 ring-emerald-300"
                    animate={{ opacity: [0.35, 1, 0.35] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  />
                )}
                <ArrowGlyph rotation={DIR_ROTATION_DEG[tile.dir]} size={26} animate={false} />
              </div>
            </motion.button>
          ))}

          <AnimatePresence>
            {exiting.map((tile) => {
              const offset = exitOffset(tile.dir);
              return (
                <motion.div
                  key={tile.key}
                  className="pointer-events-none absolute flex items-center justify-center p-1.5"
                  style={{
                    width: `${100 / board.size}%`,
                    height: `${100 / board.size}%`,
                    left: `${(tile.x / board.size) * 100}%`,
                    top: `${(tile.y / board.size) * 100}%`,
                  }}
                  initial={{ opacity: 1, x: 0, y: 0 }}
                  animate={{ opacity: 0, x: offset.x, y: offset.y }}
                  transition={{ duration: 0.26, ease: "easeIn" }}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-xl bg-emerald-400/25 text-emerald-200 ring-1 ring-emerald-400/40">
                    <ArrowGlyph rotation={DIR_ROTATION_DEG[tile.dir]} size={26} animate={false} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <AnimatePresence>
            {won && (
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
                  className="rounded-full bg-emerald-400/15 p-4 text-emerald-300 ring-1 ring-emerald-400/30"
                >
                  <Trophy size={30} />
                </motion.div>
                <div className="text-lg font-semibold text-white">Board cleared!</div>
                <div className="text-sm text-white/50">{moves} moves</div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={restart}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/15"
                  >
                    Replay
                  </button>
                  <button
                    onClick={() => setLevel((l) => l + 1)}
                    className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300"
                  >
                    Next level
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-white/50">
          <span>{remaining} arrow{remaining === 1 ? "" : "s"} left</span>
          <div className="flex gap-2">
            <button
              onClick={showHint}
              disabled={won}
              className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:opacity-30"
            >
              <Lightbulb size={14} /> Hint
            </button>
            <button
              onClick={restart}
              className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 transition hover:bg-white/10 hover:text-white"
            >
              <RotateCcw size={14} /> Restart
            </button>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-xs text-center text-xs text-white/30">
        Tap an arrow to slide it. If it flies off the board, it's cleared. If it
        bumps into another arrow, it stops there instead.
      </p>
    </div>
  );
}
