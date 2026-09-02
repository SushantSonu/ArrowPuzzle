import { motion } from "framer-motion";
import { Bot, Grid3x3, Route, Rows3, Waypoints, ChevronRight } from "lucide-react";
import type { ModeId } from "../types";
import type { Progress } from "../lib/storage";

interface Mode {
  id: ModeId;
  title: string;
  tagline: string;
  icon: typeof Grid3x3;
  from: string;
  to: string;
  ring: string;
  text: string;
}

const MODES: Mode[] = [
  {
    id: "clear",
    title: "Arrow Clear",
    tagline: "Tap arrows to slide them off the board. Clear every tile.",
    icon: Grid3x3,
    from: "from-emerald-500/25",
    to: "to-emerald-500/5",
    ring: "ring-emerald-400/30",
    text: "text-emerald-300",
  },
  {
    id: "connect",
    title: "Arrow Connect",
    tagline: "Rotate arrows to link the path from start to finish.",
    icon: Route,
    from: "from-violet-500/25",
    to: "to-violet-500/5",
    ring: "ring-violet-400/30",
    text: "text-violet-300",
  },
  {
    id: "slide",
    title: "Arrow Slide",
    tagline: "Push tiles with the arrow keys and merge your way to 2048.",
    icon: Rows3,
    from: "from-amber-500/25",
    to: "to-amber-500/5",
    ring: "ring-amber-400/30",
    text: "text-amber-300",
  },
  {
    id: "robot",
    title: "Arrow Bot",
    tagline: "Program a sequence of arrows to guide the bot home.",
    icon: Bot,
    from: "from-sky-500/25",
    to: "to-sky-500/5",
    ring: "ring-sky-400/30",
    text: "text-sky-300",
  },
  {
    id: "trace",
    title: "Arrow Trace",
    tagline: "Drag through the arrows in order, start to finish.",
    icon: Waypoints,
    from: "from-rose-500/25",
    to: "to-rose-500/5",
    ring: "ring-rose-400/30",
    text: "text-rose-300",
  },
];

function modeSubtitle(mode: ModeId, progress: Progress): string {
  switch (mode) {
    case "clear": {
      const solved = Object.keys(progress.clearBestMoves).length;
      return solved > 0 ? `${solved} level${solved === 1 ? "" : "s"} solved` : "New";
    }
    case "connect": {
      const solved = Object.keys(progress.connectBestSeconds).length;
      return solved > 0 ? `${solved} level${solved === 1 ? "" : "s"} solved` : "New";
    }
    case "slide":
      return progress.slideBest > 0 ? `Best tile: ${progress.slideBest}` : "New";
    case "robot": {
      const stars = Object.values(progress.robotStars).reduce((a, b) => a + b, 0);
      return stars > 0 ? `${stars} star${stars === 1 ? "" : "s"} earned` : "New";
    }
    case "trace": {
      const solved = Object.keys(progress.traceBestSeconds).length;
      return solved > 0 ? `${solved} level${solved === 1 ? "" : "s"} solved` : "New";
    }
  }
}

interface HomeProps {
  progress: Progress;
  onSelect: (mode: ModeId) => void;
}

export default function Home({ progress, onSelect }: HomeProps) {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col px-5 pb-10 pt-10 sm:pt-16">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 text-center"
      >
        <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <ArrowMark />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Arrow Puzzle</h1>
        <p className="mt-2 text-sm text-white/50 sm:text-base">
          Five small games, one direction at a time.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODES.map((mode, i) => {
          const Icon = mode.icon;
          return (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 * i }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(mode.id)}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${mode.from} ${mode.to} p-5 text-left ring-1 ${mode.ring} backdrop-blur-sm transition-shadow hover:shadow-lg hover:shadow-black/20 ${
                i === MODES.length - 1 && MODES.length % 2 === 1 ? "sm:col-span-2" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`rounded-xl bg-white/10 p-2.5 ${mode.text}`}>
                  <Icon size={22} />
                </div>
                <ChevronRight
                  size={18}
                  className="mt-1 text-white/30 transition group-hover:translate-x-1 group-hover:text-white/60"
                />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-white">{mode.title}</h2>
              <p className="mt-1 text-sm leading-snug text-white/55">{mode.tagline}</p>
              <p className={`mt-3 text-xs font-medium ${mode.text}`}>
                {modeSubtitle(mode.id, progress)}
              </p>
            </motion.button>
          );
        })}
      </div>

      <p className="mt-10 text-center text-xs text-white/25">
        Progress saves automatically on this device.
      </p>
    </div>
  );
}

function ArrowMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3.5L12 19.5"
        stroke="#a5b4fc"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M5.5 10.5L12 3.5L18.5 10.5"
        stroke="#a5b4fc"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
