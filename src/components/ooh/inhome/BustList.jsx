import { platformMeta } from './digitalConfig';
import { BadgeCheck } from 'lucide-react';

export default function BustList({ busts = [], selectedId, onSelect }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate2/60 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
          // {busts.length} digital busts
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {busts.length ? (
          busts.map((b) => {
            const meta = platformMeta(b.platform);
            const Icon = meta.Icon;
            const sel = selectedId === b.id;
            const verified = b.status === 'verified';
            return (
              <button
                key={b.id}
                onClick={() => onSelect(b.id)}
                className={`flex w-full items-center gap-3 border-b border-slate2/40 px-4 py-3 text-left transition-colors ${sel ? 'bg-ozone/10' : 'hover:bg-slate2/20'}`}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center border border-slate2/60"
                  style={{ backgroundColor: '#0a0a0a' }}
                >
                  <Icon className="h-4 w-4" style={{ color: meta.accent }} strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-display text-xs font-bold text-silver">
                      {b.target_brand}
                    </span>
                    {verified && <BadgeCheck className="h-3 w-3 shrink-0 text-ozone" />}
                  </span>
                  <span className="block truncate font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
                    {b.platform_name} · {b.surface}
                  </span>
                  {b.operative && (
                    <span className="block truncate font-mono text-[8px] uppercase tracking-[0.15em] text-ozone/60">
                      @{b.operative}
                    </span>
                  )}
                  <span className="block truncate font-mono text-[8px] uppercase tracking-[0.15em] text-dim/70">
                    {b.method} · {b.region || '—'}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
            // no busts
          </div>
        )}
      </div>
    </div>
  );
}
