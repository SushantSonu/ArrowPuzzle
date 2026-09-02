import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface TopBarProps {
  title: string;
  onBack: () => void;
  accent?: string;
  right?: ReactNode;
}

export default function TopBar({ title, onBack, accent = "#818cf8", right }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white active:scale-95"
      >
        <ArrowLeft size={16} />
        <span className="hidden sm:inline">Menu</span>
      </button>
      <h1
        className="text-base font-semibold tracking-wide sm:text-lg"
        style={{ color: accent }}
      >
        {title}
      </h1>
      <div className="min-w-[68px] text-right text-sm text-white/70">{right}</div>
    </div>
  );
}
