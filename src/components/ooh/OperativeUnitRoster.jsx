import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, BadgeCheck } from "lucide-react";

const TIER_CLS = {
  recruit: "text-dim",
  field: "text-ozone",
  veteran: "text-flare",
  legend: "text-[#EDFF00]",
};

export default function OperativeUnitRoster() {
  const [ops, setOps] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      base44.entities.Operative.list("-points", 50)
        .then((recs) => { if (!cancelled) setOps(recs || []); })
        .catch(() => { if (!cancelled) setOps([]); });
    load();
    const unsub = base44.entities.Operative.subscribe(load);
    return () => { cancelled = true; if (unsub) unsub(); };
  }, []);

  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-ozone" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// 0101001 operative unit</span>
      </div>
      {ops === null ? (
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          <span className="h-1.5 w-1.5 animate-flicker rounded-full bg-ozone" /> Loading roster…
        </div>
      ) : ops.length === 0 ? (
        <div className="border border-slate2/60 bg-card p-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          // No operatives registered yet
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ops.map((o) => (
            <div key={o.id} className="flex items-center gap-3 border border-slate2/50 bg-card p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-slate2/60 bg-void font-mono text-[10px] font-bold text-ozone">
                {String(o.handle || "??").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-display text-sm font-bold text-silver">{o.handle || "anonymous"}</span>
                  {o.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-ozone" />}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                  {o.region || "field"} · <span className={TIER_CLS[o.tier] || "text-dim"}>{o.tier || "recruit"}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-display text-sm font-black tabular text-silver">{(o.points || 0).toLocaleString()}</div>
                <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">pts</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}