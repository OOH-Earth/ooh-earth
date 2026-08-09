import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bot, User, BadgeCheck, Loader2 } from "lucide-react";

const TIER_META = {
  recruit: { label: "Spotter", color: "#B2B2B2" },
  field: { label: "Field", color: "#EDFF00" },
  veteran: { label: "Veteran", color: "#FF5C00" },
  legend: { label: "Legend", color: "#FF007F" },
};

export default function OperativeRoster() {
  const [ops, setOps] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const recs = await base44.entities.Operative.list("-points", 60);
        if (!cancelled) setOps(recs || []);
      } catch {
        if (!cancelled) setOps([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!ops) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-dim" />
      </div>
    );
  }
  if (!ops.length) return null;

  return (
    <div className="flex h-full items-center gap-2 overflow-x-auto px-3 atlas-track">
      <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// Operatives · {ops.length}</span>
      {ops.map((o) => {
        const tier = TIER_META[o.tier] || TIER_META.recruit;
        const isBot = o.kind === "bot";
        return (
          <div key={o.id} className="flex shrink-0 items-center gap-2 border border-slate2/60 bg-card px-2.5 py-1.5">
            <span className="flex h-6 w-6 items-center justify-center border border-slate2/60 bg-void">
              {isBot ? <Bot className="h-3 w-3" style={{ color: tier.color }} /> : <User className="h-3 w-3" style={{ color: tier.color }} />}
            </span>
            <div className="leading-tight">
              <div className="flex items-center gap-1">
                <span className="font-mono text-[10px] font-bold text-silver">@{o.handle}</span>
                {o.verified && <BadgeCheck className="h-3 w-3 text-ozone" />}
              </div>
              <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                {o.region || tier.label} · {o.points ?? 0}pts
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}