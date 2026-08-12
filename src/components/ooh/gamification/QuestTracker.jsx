import { Loader2, Check, Gift, Clock, Calendar } from 'lucide-react';

function QuestRow({ quest, onClaim, claiming, claimed }) {
  const pct = quest.target > 0 ? Math.min(100, (quest.progress / quest.target) * 100) : 0;
  const canClaim = quest.complete && !claimed && !claiming;

  return (
    <div
      className={`border p-3 transition-colors ${
        claimed ? 'border-brand-green/40 bg-brand-green/5' : 'border-slate2/60 bg-card'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-silver">
              {quest.label}
            </span>
            {claimed && <Check className="h-3 w-3 text-brand-green" />}
          </div>
          <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-dim">
            {quest.desc}
          </div>
        </div>
        <span className="shrink-0 font-mono text-[9px] tabular text-ozone">
          +{quest.reward_xp} XP
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden bg-slate2/60">
          <div
            className={`h-full transition-all duration-500 ${claimed ? 'bg-brand-green' : 'bg-ozone'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[9px] tabular text-dim">
          {quest.progress}/{quest.target}
        </span>
        {canClaim ? (
          <button
            onClick={onClaim}
            className="shrink-0 border border-ozone bg-ozone px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-void transition-colors hover:bg-flare hover:border-flare active:scale-95"
          >
            Claim
          </button>
        ) : claimed ? (
          <span className="shrink-0 flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-brand-green">
            <Check className="h-3 w-3" /> Done
          </span>
        ) : claiming ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-ozone" />
        ) : null}
      </div>
    </div>
  );
}

export default function QuestTracker({ quests, onClaim, claiming }) {
  const daily = quests.filter((q) => q.type === 'daily');
  const weekly = quests.filter((q) => q.type === 'weekly');
  const dailyDone = daily.filter((q) => q.claimed).length;
  const weeklyDone = weekly.filter((q) => q.claimed).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">
            <Clock className="h-3.5 w-3.5" /> Daily Quests
          </span>
          <span className="font-mono text-[9px] tabular text-dim">
            {dailyDone}/{daily.length} claimed
          </span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {daily.map((q) => (
            <QuestRow
              key={q.id}
              quest={q}
              onClaim={() => onClaim(q.id)}
              claiming={claiming === q.id}
              claimed={q.claimed}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-flare">
            <Calendar className="h-3.5 w-3.5" /> Weekly Quests
          </span>
          <span className="font-mono text-[9px] tabular text-dim">
            {weeklyDone}/{weekly.length} claimed
          </span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {weekly.map((q) => (
            <QuestRow
              key={q.id}
              quest={q}
              onClaim={() => onClaim(q.id)}
              claiming={claiming === q.id}
              claimed={q.claimed}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border border-slate2/40 bg-void p-3">
        <Gift className="h-4 w-4 shrink-0 text-ozone" />
        <p className="font-mono text-[9px] leading-relaxed text-dim">
          Quests reset daily at midnight and weekly on Monday. Claim completed quests to bank bonus
          XP — unclaimed quests expire when the period rolls over.
        </p>
      </div>
    </div>
  );
}
