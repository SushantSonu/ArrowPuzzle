import { Bot, Grid3x3, Route, Rows3, Waypoints } from "lucide-react";
import type { ModeId } from "../../types";

export const DAILY_MODE_META: Record<ModeId, { label: string; icon: typeof Grid3x3; accent: string }> = {
  clear: { label: "Arrow Clear", icon: Grid3x3, accent: "#34d399" },
  connect: { label: "Arrow Connect", icon: Route, accent: "#a78bfa" },
  slide: { label: "Arrow Slide", icon: Rows3, accent: "#fbbf24" },
  robot: { label: "Arrow Bot", icon: Bot, accent: "#38bdf8" },
  trace: { label: "Arrow Trace", icon: Waypoints, accent: "#fb7185" },
};
