import { Link } from "react-router-dom";
import { ArrowUpRight, Zap, Award, Flame, Target } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";

function LoginPrompt() {
  return (
    <div className="border border-slate2/60 bg-card p-6">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-ozone" />
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">// Member Protocol</span>
      </div>
      <p className="mt-3 font-display text-sm leading-relaxed text-darkgray">
        Log in to track your XP, earn merit badges, complete daily quests, and climb the resistance leaderboard.
      </p>
      <div className="mt-4 flex gap-2">
        <Link to="/login" className="border border-ozone bg-ozone px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare">
          Log in
        </Link>
        <Link to="/register" className="border border-slate2 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
          Register
        </Link>
      </div>
    </div>
  );
}

export default function GamificationWidget() {
  const { user, stats, level, earnedBadges, questStatus, loading } = useGamification();

  if (loading) {
    return (
      <div className="flex items-center gap-3 border border-slate2/60 bg-card p-6 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
        <span className="h-1.5 w-1.5 animate-flicker rounded-full bg-ozone" /> Compiling member data…
      </div>
    );
  }

  if (!user) return <LoginPrompt />;

  const activeQuests = questStatus.filter(q => !q.claimed).slice(0, 3);
  const claimable = questStatus.filter(q => q.complete && !q.claimed).length;

  return (
    <div className="border border-ozone/40 bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">
          <Zap className="h-3.5 w-3.5" /> Member Console
        </span>
        <Link to="/operative" className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:text-ozone">
          Full profile <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Level + XP */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-ozone bg-ozone/10">
          <span className="font-mono text-xl font-bold tabular text-ozone">{level?.level}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-black uppercase tracking-tight text-silver">{level?.title}</span>
            <span className="font-mono text-[9px] tabular text-ozone">{stats?.xp.toLocaleString()} XP</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden bg-slate2/60">
            <div className="h-full bg-gradient-to-r from-ozone to-flare transition-all duration-700" style={{ width: `${level?.progress}%` }} />
          </div>
          <div className="mt-1 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
            <span>{level?.isMax ? "Max" : `${level?.xpIntoLevel}/${level?.xpForNext} to next`}</span>
            <span className="flex items-center gap-1 text-flare">
              <Flame className="h-2.5 w-2.5" /> {stats?.streak}d streak
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="border border-slate2/60 bg-void p-2.5 text-center">
          <Award className="mx-auto h-3.5 w-3.5 text-ozone" />
          <div className="mt-1 font-mono text-sm font-bold tabular text-silver">{earnedBadges.length}</div>
          <div className="font-mono text-[7px] uppercase tracking-[0.15em] text-dim">Badges</div>
        </div>
        <div className="border border-slate2/60 bg-void p-2.5 text-center">
          <Target className="mx-auto h-3.5 w-3.5 text-flare" />
          <div className="mt-1 font-mono text-sm font-bold tabular text-silver">{claimable}</div>
          <div className="font-mono text-[7px] uppercase tracking-[0.15em] text-dim">Claimable</div>
        </div>
        <div className="border border-slate2/60 bg-void p-2.5 text-center">
          <Flame className="mx-auto h-3.5 w-3.5 text-brand-orange" />
          <div className="mt-1 font-mono text-sm font-bold tabular text-silver">{stats?.streak}</div>
          <div className="font-mono text-[7px] uppercase tracking-[0.15em] text-dim">Day streak</div>
        </div>
      </div>

      {/* Active quests */}
      {activeQuests.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">// Active quests</div>
          <div className="space-y-1.5">
            {activeQuests.map(q => {
              const pct = (q.progress / q.target) * 100;
              return (
                <div key={q.id} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 truncate font-mono text-[8px] uppercase tracking-[0.1em] text-darkgray">{q.label}</span>
                  <div className="h-1 flex-1 overflow-hidden bg-slate2/60">
                    <div className="h-full bg-ozone transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="shrink-0 font-mono text-[8px] tabular text-dim">{q.progress}/{q.target}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {claimable > 0 && (
        <Link to="/operative" className="mt-4 block border border-ozone bg-ozone px-4 py-2.5 text-center font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare">
          {claimable} quest{claimable > 1 ? "s" : ""} ready to claim →
        </Link>
      )}
    </div>
  );
}