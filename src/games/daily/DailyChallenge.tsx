import { useMemo } from "react";
import { applyDailyCompletion, modeForPuzzle, modeOccurrenceIndex, puzzleNumberFor, seedFor, todayKey } from "../../lib/daily";
import type { Progress } from "../../lib/storage";
import ClearGame from "../clear/ClearGame";
import ConnectGame from "../connect/ConnectGame";
import SlideGame from "../slide/SlideGame";
import RobotGame from "../robot/RobotGame";
import TraceGame from "../trace/TraceGame";
import DailyResultScreen from "./DailyResultScreen";
import type { DailyCompletion } from "./types";

interface DailyChallengeProps {
  progress: Progress;
  onProgressChange: (updater: (p: Progress) => Progress) => void;
  onBack: () => void;
}

export default function DailyChallenge({ progress, onProgressChange, onBack }: DailyChallengeProps) {
  const dateKey = useMemo(() => todayKey(), []);
  const puzzleNumber = useMemo(() => puzzleNumberFor(), []);
  const seed = useMemo(() => seedFor(dateKey), [dateKey]);
  const mode = useMemo(() => modeForPuzzle(puzzleNumber), [puzzleNumber]);
  const occurrence = useMemo(() => modeOccurrenceIndex(puzzleNumber), [puzzleNumber]);

  const existingResult = progress.daily.history[dateKey];

  function handleComplete(completion: DailyCompletion) {
    onProgressChange((p) => applyDailyCompletion(p, dateKey, puzzleNumber, mode, completion));
  }

  if (existingResult) {
    return (
      <DailyResultScreen
        result={existingResult}
        streak={progress.daily.streak}
        bestStreak={progress.daily.bestStreak}
        onBack={onBack}
      />
    );
  }

  const dailyProps = { seed, occurrence, onComplete: handleComplete };

  switch (mode) {
    case "clear":
      return <ClearGame progress={progress} onProgressChange={onProgressChange} onBack={onBack} daily={dailyProps} />;
    case "connect":
      return <ConnectGame progress={progress} onProgressChange={onProgressChange} onBack={onBack} daily={dailyProps} />;
    case "slide":
      return <SlideGame progress={progress} onProgressChange={onProgressChange} onBack={onBack} daily={dailyProps} />;
    case "robot":
      return <RobotGame progress={progress} onProgressChange={onProgressChange} onBack={onBack} daily={dailyProps} />;
    case "trace":
      return <TraceGame progress={progress} onProgressChange={onProgressChange} onBack={onBack} daily={dailyProps} />;
  }
}
