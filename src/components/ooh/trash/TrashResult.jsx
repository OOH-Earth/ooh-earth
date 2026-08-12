import { Trash2, Recycle, AlertTriangle, Building2 } from 'lucide-react';

const sevColor = { low: '#39FF14', moderate: '#EDFF00', high: '#FF5C00', severe: '#FF007F' };

function scoreColor(s) {
  const n = Number(s);
  if (n >= 75) return '#FF007F';
  if (n >= 50) return '#FF5C00';
  if (n >= 25) return '#EDFF00';
  return '#39FF14';
}

export default function TrashResult({ data }) {
  if (!data) return null;
  const sev = data.severity || 'low';
  const sc = sevColor[sev] || '#B2B2B2';
  const brands = Array.isArray(data.brands) ? data.brands : [];

  return (
    <div className="space-y-4">
      <div className="border border-slate2/60 bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" style={{ color: sc }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
              Dump severity
            </span>
          </div>
          <span
            className="font-display text-sm font-black uppercase tracking-[0.2em]"
            style={{ color: sc }}
          >
            {sev}
          </span>
        </div>
        {data.dump_type && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">
            {data.dump_type}
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="border border-slate2/60 bg-void p-2">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
              Est. volume
            </div>
            <div className="font-display text-sm font-bold text-silver">
              {data.estimated_volume || '—'}
            </div>
          </div>
          <div className="border border-slate2/60 bg-void p-2">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
              Recyclable fraction
            </div>
            <div className="font-display text-sm font-bold text-silver">
              {Number(data.recyclable_fraction_pct || 0).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {data.top_offender && (
        <div className="border border-flare/40 bg-flare/5 p-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-flare">
            // Top offender
          </div>
          <div className="font-display text-lg font-black text-silver">{data.top_offender}</div>
        </div>
      )}

      {brands.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
            <Building2 className="h-3.5 w-3.5" /> Brand attribution ({brands.length})
          </div>
          <div className="space-y-2">
            {brands.map((b, i) => {
              const col = scoreColor(b.accountability_score);
              return (
                <div key={i} className="border border-slate2/60 bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-display text-base font-bold text-silver">
                        {b.name}
                      </div>
                      {b.parent_company && (
                        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                          {b.parent_company}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className="font-display text-lg font-black tabular"
                        style={{ color: col }}
                      >
                        {Number(b.accountability_score || 0).toFixed(0)}
                      </div>
                      <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
                        acct
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                    <span className="flex items-center gap-1">
                      <Trash2 className="h-3 w-3" /> ~{b.estimated_pieces || 0} pcs
                    </span>
                    {b.material && <span>{b.material}</span>}
                    <span
                      className="flex items-center gap-1"
                      style={{ color: b.recyclable ? '#39FF14' : '#FF5C00' }}
                    >
                      <Recycle className="h-3 w-3" /> {b.recyclable ? 'recyclable' : 'landfill'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.summary && (
        <div className="border border-slate2/60 bg-card p-4">
          <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
            // Field assessment
          </div>
          <p className="font-display text-sm leading-relaxed text-darkgray">{data.summary}</p>
        </div>
      )}
    </div>
  );
}
