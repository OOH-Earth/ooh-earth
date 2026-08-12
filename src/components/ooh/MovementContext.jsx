// Movement + founding context band — the same honest framing as the orbital-atlas
// Field Pulse, for main-system (Tailwind) pages like Campaign. Numbers come from the
// single documented source (movementEstimate.js). Movement figures are tagged EST and
// kept distinct from OOH Earth's own day-one, seeking-backers status.
import { Users, Zap, Flag, Globe2, Clock } from 'lucide-react';
import {
  MOVEMENT,
  MOVEMENT_ANCHORS,
  PLATFORM_STATUS,
  fmtK,
} from '@/components/ooh/movementEstimate';

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="flex flex-col gap-1 border border-slate2/50 bg-void/40 px-4 py-4">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-flare" />
        <span className="font-display text-2xl font-black tabular tracking-[-0.02em] text-flare md:text-3xl">
          {value}
        </span>
        <span className="border border-flare/40 px-1 font-mono text-[8px] uppercase leading-tight tracking-[0.15em] text-flare/80">
          est
        </span>
      </div>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray">{label}</span>
    </div>
  );
}

export default function MovementContext({
  className = '',
  heading = "We're day-one. The movement isn't.",
  intro = "OOH Earth is a new, community-funded, copyleft platform — early access, seeking founding backers. But the resistance we're mapping is not new. Organised subvertising has been reclaiming public space since 2012.",
}) {
  return (
    <section className={`border border-slate2/60 bg-card ${className}`}>
      <div className="flex flex-col gap-3 border-b border-slate2/40 p-6 md:p-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
          // Not starting from zero
        </span>
        <h2 className="font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-5xl">
          {heading}
        </h2>
        <p className="max-w-2xl font-display text-sm leading-[1.6] text-darkgray">{intro}</p>
        <span className="mt-1 inline-flex w-fit items-center gap-2 border border-ozone/50 bg-ozone/5 px-3 py-1.5">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-ozone" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-ozone">
            OOH Earth · {PLATFORM_STATUS}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate2/40 p-6 md:grid-cols-5 md:p-8">
        <Stat icon={Users} value={`~${fmtK(MOVEMENT.subvertisers)}+`} label="Subverters" />
        <Stat icon={Zap} value={`~${fmtK(MOVEMENT.interventions)}+`} label="Interventions" />
        <Stat icon={Flag} value={`${MOVEMENT.collectives}+`} label="Collectives" />
        <Stat icon={Globe2} value={`${MOVEMENT.countries}+`} label="Countries" />
        <Stat icon={Clock} value={`${MOVEMENT.years}`} label="Years active" />
      </div>

      <ul className="divide-y divide-slate2/40 border-t border-slate2/40">
        {MOVEMENT_ANCHORS.map((a, i) => (
          <li key={i} className="flex items-baseline gap-4 px-6 py-3 md:px-8">
            <span className="w-10 shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-flare">
              {a.year}
            </span>
            <span className="flex-1 font-display text-sm leading-[1.5] text-silver/90">
              {a.text}
            </span>
            <span className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.15em] text-dim sm:inline">
              {a.source}
            </span>
          </li>
        ))}
      </ul>

      <p className="border-t border-slate2/40 px-6 py-3 font-mono text-[9px] leading-relaxed tracking-[0.1em] text-dim md:px-8">
        // Movement-wide estimates (est.) since {MOVEMENT.since} — the global subvertising movement,
        not OOH Earth platform metrics. Order-of-magnitude, conservative. OOH Earth&rsquo;s own
        numbers are live and audited elsewhere on the platform.
      </p>
    </section>
  );
}
