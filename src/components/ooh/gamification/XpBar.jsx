import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { LEVELS, levelFromXp } from "@/components/ooh/gamification/gamification";

export default function XpBar({ xp, compact }) {
  const lvl = levelFromXp(xp || 0);

  if (compact) {
    return (
      <Link to="/operative" className="group flex items-center gap-2" data-tour="xp">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-ozone/50 bg-ozone/10 font-mono text-[10px] font-bold tabular text-ozone">
          {lvl.level}
        </span>
        <div className="hidden w-24 sm:block">
          <div className="h-1.5 w-full overflow-hidden bg-slate2/60">
            <div className="h-full bg-ozone transition-all duration-500" style={{ width: `${lvl.progress}%` }} />
          </div>
          <div className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.2em] text-dim">{lvl.title}</div>
        </div>
      </Link>
    );
  }

  const nextLevel = LEVELS[lvl.level];

  return (
    <div className="border border-slate2/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center border-2 border-ozone bg-ozone/10 font-mono text-lg font-bold tabular text-ozone">
            {lvl.level}
          </span>
          <div>
            <div className="font-display text-lg font-black uppercase tracking-tight text-silver">{lvl.title}</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">Level {lvl.level}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 font-mono text-xl font-bold tabular text-ozone">
            <Zap className="h-4 w-4" /> {lvl.xp.toLocaleString()}
          </div>
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">total XP</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
          <span>{lvl.isMax ? "Max level" : `${lvl.xpIntoLevel} / ${lvl.xpForNext} XP`}</span>
          <span>{lvl.isMax ? "Mythic" : `Next: ${nextLevel?.title || ""}`}</span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden bg-slate2/60">
          <div
            className="h-full bg-gradient-to-r from-ozone to-flare transition-all duration-700"
            style={{ width: `${lvl.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}