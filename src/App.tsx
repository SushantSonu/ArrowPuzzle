import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Home from "./components/Home";
import ClearGame from "./games/clear/ClearGame";
import ConnectGame from "./games/connect/ConnectGame";
import SlideGame from "./games/slide/SlideGame";
import RobotGame from "./games/robot/RobotGame";
import TraceGame from "./games/trace/TraceGame";
import { loadProgress, saveProgress, type Progress } from "./lib/storage";
import type { ModeId } from "./types";

export default function App() {
  const [mode, setMode] = useState<ModeId | null>(null);
  const [progress, setProgress] = useState<Progress>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const onProgressChange = useCallback((updater: (p: Progress) => Progress) => {
    setProgress((p) => updater(p));
  }, []);

  return (
    <div className="bg-app min-h-screen w-full">
      <AnimatePresence mode="wait">
        {mode === null && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Home progress={progress} onSelect={setMode} />
          </motion.div>
        )}
        {mode === "clear" && (
          <motion.div
            key="clear"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ClearGame progress={progress} onProgressChange={onProgressChange} onBack={() => setMode(null)} />
          </motion.div>
        )}
        {mode === "connect" && (
          <motion.div
            key="connect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ConnectGame progress={progress} onProgressChange={onProgressChange} onBack={() => setMode(null)} />
          </motion.div>
        )}
        {mode === "slide" && (
          <motion.div
            key="slide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SlideGame progress={progress} onProgressChange={onProgressChange} onBack={() => setMode(null)} />
          </motion.div>
        )}
        {mode === "robot" && (
          <motion.div
            key="robot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <RobotGame progress={progress} onProgressChange={onProgressChange} onBack={() => setMode(null)} />
          </motion.div>
        )}
        {mode === "trace" && (
          <motion.div
            key="trace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TraceGame progress={progress} onProgressChange={onProgressChange} onBack={() => setMode(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
