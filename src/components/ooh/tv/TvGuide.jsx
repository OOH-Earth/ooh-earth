import { Play, Radio } from 'lucide-react';
import { PROGRAMS } from './programs';

export default function TvGuide({ index, onSelect }) {
  return (
    <div className="border border-slate2 bg-void">
      <div className="flex items-center gap-2 border-b border-slate2/60 px-4 py-3">
        <Radio className="h-3.5 w-3.5 text-ozone" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-ozone">
          // Channel Guide · {PROGRAMS.length} programs
        </span>
      </div>
      <ul className="divide-y divide-slate2/40">
        {PROGRAMS.map((p, i) => {
          const active = i === index;
          return (
            <li key={p.id}>
              <button
                onClick={() => onSelect(i)}
                className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  active ? 'bg-ozone/10' : 'hover:bg-slate2/30'
                }`}
              >
                <span className="font-mono text-[9px] tabular text-dim/60">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate font-display text-[13px] font-semibold tracking-[-0.02em] ${
                      active ? 'text-ozone' : 'text-silver/85'
                    }`}
                  >
                    {p.title}
                  </span>
                  <span className="block truncate font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60">
                    {p.channel} · {p.runtime}
                  </span>
                </span>
                <span
                  className={`font-mono text-[8px] uppercase tracking-[0.25em] ${
                    active ? 'text-ozone' : 'text-dim/40'
                  }`}
                >
                  {p.topic}
                </span>
                {active && <Play className="h-3 w-3 animate-blink text-ozone" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
