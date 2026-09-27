import { Loader2, Check, Clock, Calendar, ShieldCheck } from 'lucide-react';
import { formatResetIn, MISSION_STATE_LABELS } from '@/lib/missions';

// Mission Board — the existing Quest engine presented as real-world
// missions. States come from src/lib/missions.js (same UTC rules the
// claimQuest function enforces); XP is only ever awarded server-side.

const STATE_STYLES = {
  available: 'border-slate2/70 text-dim',
  in_progress: 'border-ozone/50 text-ozone',
  completed: 'border-ozone bg-ozone/10 text-ozone',
  claimed: 'border-brand-green/60 bg-brand-green/10 text-brand-green',
};

function MissionRow({ quest, onClaim, claiming, notice }) {
  const pct = quest.target > 0 ? Math.min(100, (quest.progress / quest.target) * 100) : 0;
  const canClaim = quest.state === 'completed' && !claiming;
  const labelId = `mission-${quest.id}-label`;

  return (
    <li
      data-testid={`mission-${quest.id}`}
      data-state={quest.state}
      className={`border p-3 transition-colors ${
        quest.state === 'claimed'
          ? 'border-brand-green/40 bg-brand-green/5'
          : quest.state === 'completed'
            ? 'border-ozone/60 bg-ozone/[0.04]'
            : 'border-slate2/60 bg-card'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4
            id={labelId}
            className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.15em] text-silver"
          >
            {quest.label}
          </h4>
          <p className="mt-0.5 font-mono text-[0.6875rem] uppercase leading-relaxed tracking-[0.08em] text-dim">
            {quest.desc}
          </p>
        </div>
        <span className="shrink-0 font-mono text-[0.6875rem] tabular text-ozone">
          +{quest.reward_xp} XP
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <div
          role="progressbar"
          aria-labelledby={labelId}
          aria-valuemin={0}
          aria-valuemax={quest.target}
          aria-valuenow={quest.progress}
          aria-valuetext={`${quest.progress} of ${quest.target}`}
          className="h-1.5 flex-1 overflow-hidden bg-slate2/60"
        >
          <div
            className={`h-full transition-all duration-500 ${quest.state === 'claimed' ? 'bg-brand-green' : 'bg-ozone'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[0.6875rem] tabular text-dim">
          {quest.progress}/{quest.target}
        </span>
      </div>

      <div className="mt-2.5 flex min-h-[32px] items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[0.5625rem] font-bold uppercase tracking-[0.15em] ${STATE_STYLES[quest.state]}`}
        >
          {quest.state === 'claimed' && <Check className="h-3 w-3" aria-hidden="true" />}
          {MISSION_STATE_LABELS[quest.state]}
        </span>
        {canClaim ? (
          <button
            type="button"
            onClick={onClaim}
            aria-describedby={labelId}
            className="min-h-[32px] shrink-0 border border-ozone bg-ozone px-3 py-1 font-mono text-[0.625rem] font-bold uppercase tracking-[0.15em] text-void transition-colors hover:border-flare hover:bg-flare focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozone/60 active:scale-95"
          >
            Claim +{quest.reward_xp} XP
          </button>
        ) : claiming ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-ozone" aria-label="Claiming" />
        ) : null}
      </div>
      <p aria-live="polite" className="font-mono text-[0.625rem] uppercase tracking-[0.1em]">
        {notice && (
          <span
            className={`mt-2 block ${notice.tone === 'ok' ? 'text-brand-green' : notice.tone === 'info' ? 'text-silver' : 'text-flare'}`}
          >
            {notice.text}
          </span>
        )}
      </p>
    </li>
  );
}

function MissionGroup({ title, Icon, tone, quests, onClaim, claiming, claimNotice }) {
  if (!quests.length) return null;
  const done = quests.filter((q) => q.claimed).length;
  const resetIn = formatResetIn(quests[0].resetsInMs);
  return (
    <section aria-label={title}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3
          className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] ${tone}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {title}
        </h3>
        <span className="font-mono text-[9px] uppercase tabular tracking-[0.12em] text-dim">
          {done}/{quests.length} claimed · resets in {resetIn}
        </span>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {quests.map((q) => (
          <MissionRow
            key={q.id}
            quest={q}
            onClaim={() => onClaim(q.id)}
            claiming={claiming === q.id}
            notice={claimNotice?.id === q.id ? claimNotice : null}
          />
        ))}
      </ul>
    </section>
  );
}

export default function QuestTracker({ quests, onClaim, claiming, claimNotice = null }) {
  const daily = quests.filter((q) => q.type === 'daily');
  const weekly = quests.filter((q) => q.type === 'weekly');

  if (!quests.length) {
    return (
      <p className="border border-slate2/40 bg-card/30 p-4 font-mono text-[10px] uppercase tracking-[0.15em] text-dim">
        Missions are unavailable right now. Try again shortly.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <MissionGroup
        title="Daily missions"
        Icon={Clock}
        tone="text-ozone"
        quests={daily}
        onClaim={onClaim}
        claiming={claiming}
        claimNotice={claimNotice}
      />
      <MissionGroup
        title="Weekly missions"
        Icon={Calendar}
        tone="text-flare"
        quests={weekly}
        onClaim={onClaim}
        claiming={claiming}
        claimNotice={claimNotice}
      />

      <div className="flex items-start gap-2 border border-slate2/40 bg-void p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ozone" aria-hidden="true" />
        <p className="font-mono text-[0.6875rem] leading-relaxed text-dim">
          Daily missions reset at 00:00 UTC; weekly missions reset Monday 00:00 UTC. Claim completed
          missions to bank bonus XP — unclaimed ones expire at reset. Stay on public ground: never
          trespass, confront anyone, or put yourself at risk for a report.
        </p>
      </div>
    </div>
  );
}
