import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flag, Lightbulb, RotateCcw, Trophy } from "lucide-react";
import TopBar from "../../components/TopBar";
import ArrowGlyph from "../../components/ArrowGlyph";
import type { Progress } from "../../lib/storage";
import { DIR_ROTATION_DEG } from "../../types";
import { connectedCount, generateConnectLevel, rotateTile, type ConnectBoard } from "./logic";

const ACCENT = "#a78bfa";

interface ConnectGameProps {
  progress: Progress;
  onProgressChange: (updater: (p: Progress) => Progress) => void;
  onBack: () => void;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ConnectGame({ progress, onProgressChange, onBack }: ConnectGameProps) {
  const [level, setLevel] = useState(1);
  const [board, setBoard] = useState<ConnectBoard>(() => generateConnectLevel(1));
  const [seconds, setSeconds] = useState(0);
  const [won, setWon] = useState(false);
  const [hintOn, setHintOn] = useState(false);

  useEffect(() => {
    setBoard(generateConnectLevel(level));
    setSeconds(0);
    setWon(false);
    setHintOn(false);
  }, [level]);

  useEffect(() => {
    if (won) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [won, level]);

  const connected = connectedCount(board);
  const total = board.tiles.length;
  const maxUnlocked = progress.connectUnlocked;

  function restart() {
    setBoard(generateConnectLevel(level));
    setSeconds(0);
    setWon(false);
    setHintOn(false);
  }

  function showHint() {
    if (connected >= total) return;
    setHintOn(true);
    setTimeout(() => setHintOn(false), 1800);
  }

  function handleTap(uid: number) {
    if (won) return;
    setHintOn(false);
    const next = rotateTile(board, uid);
    setBoard(next);
    if (connectedCount(next) === next.tiles.length) {
      setWon(true);
      onProgressChange((p) => {
        const best = p.connectBestSeconds[level];
        return {
          ...p,
          connectBestSeconds: {
            ...p.connectBestSeconds,
            [level]: best ? Math.min(best, seconds) : seconds,
          },
          connectUnlocked: Math.max(p.connectUnlocked, level + 1),
        };
      });
    }
  }

  const best = progress.connectBestSeconds[level];

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 pb-8">
      <TopBar
        title="Arrow Connect"
        accent={ACCENT}
        onBack={onBack}
        right={<span>{formatTime(seconds)}</span>}
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
          <div className="text-xs text-white/40">
            {best !== undefined ? `Best: ${formatTime(best)}` : "Unsolved"}
          </div>
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
              "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: `${100 / board.size}% ${100 / board.size}%`,
            backgroundPosition: `${50 / board.size}% ${50 / board.size}%`,
          }}
        >
          {board.tiles.map((tile, idx) => {
            const isConnected = idx < connected;
            const isStart = idx === 0;
            const isHinted = hintOn && idx === connected;
            return (
              <div
                key={tile.uid}
                className="absolute flex items-center justify-center p-1.5"
                style={{
                  width: `${100 / board.size}%`,
                  height: `${100 / board.size}%`,
                  left: `${(tile.x / board.size) * 100}%`,
                  top: `${(tile.y / board.size) * 100}%`,
                }}
              >
                <button
                  onClick={() => handleTap(tile.uid)}
                  className={`relative flex h-full w-full items-center justify-center rounded-xl transition active:scale-90 ${
                    isConnected
                      ? "bg-violet-400/25 text-violet-200 ring-1 ring-violet-400/50"
                      : "bg-violet-400/10 text-violet-300/80 ring-1 ring-violet-400/20 hover:bg-violet-400/15"
                  }`}
                >
                  {isStart && (
                    <span className="absolute -top-1.5 -left-1.5 rounded-full bg-violet-400 px-1.5 py-0.5 text-[9px] font-bold text-violet-950">
                      S
                    </span>
                  )}
                  {isHinted && (
                    <>
                      <motion.span
                        className="absolute inset-0 rounded-xl ring-2 ring-violet-300"
                        animate={{ opacity: [0.35, 1, 0.35] }}
                        transition={{ duration: 0.9, repeat: Infinity }}
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <ArrowGlyph
                          rotation={DIR_ROTATION_DEG[tile.targetDir]}
                          size={24}
                          animate={false}
                          className="text-violet-200/40"
                        />
                      </div>
                    </>
                  )}
                  <ArrowGlyph rotation={tile.rotation} size={24} />
                </button>
              </div>
            );
          })}

          <div
            className="absolute flex items-center justify-center p-1.5"
            style={{
              width: `${100 / board.size}%`,
              height: `${100 / board.size}%`,
              left: `${(board.end.x / board.size) * 100}%`,
              top: `${(board.end.y / board.size) * 100}%`,
            }}
          >
            <div
              className={`flex h-full w-full items-center justify-center rounded-xl transition ${
                connected === total
                  ? "bg-violet-400/30 text-violet-100 ring-2 ring-violet-300"
                  : "bg-white/5 text-white/30 ring-1 ring-white/10"
              }`}
            >
              <Flag size={22} />
            </div>
          </div>

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
                  className="rounded-full bg-violet-400/15 p-4 text-violet-300 ring-1 ring-violet-400/30"
                >
                  <Trophy size={30} />
                </motion.div>
                <div className="text-lg font-semibold text-white">Path connected!</div>
                <div className="text-sm text-white/50">{formatTime(seconds)}</div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={restart}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/15"
                  >
                    Replay
                  </button>
                  <button
                    onClick={() => setLevel((l) => l + 1)}
                    className="rounded-full bg-violet-400 px-4 py-2 text-sm font-semibold text-violet-950 transition hover:bg-violet-300"
                  >
                    Next level
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-white/50">
          <span>{connected}/{total} connected</span>
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
        Tap an arrow to rotate it. Line them up from S to the flag in one
        unbroken chain.
      </p>
    </div>
  );
}
