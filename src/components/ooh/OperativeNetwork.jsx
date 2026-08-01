import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, MapPin, Megaphone, Loader2 } from "lucide-react";
import { MOVEMENT, fmtK } from "@/components/ooh/movementEstimate";

function cityOf(addr) {
  if (!addr) return null;
  const parts = String(addr).split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
}

function Stat({ icon: Icon, value, label, accent }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
      <Icon className={`h-4 w-4 ${accent}`} />
      <div className="font-display text-4xl font-black leading-none tracking-[-0.02em] text-silver md:text-5xl tabular">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">{label}</div>
    </div>
  );
}

export default function OperativeNetwork() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const recs = await base44.listAllLocations();
        const active = (recs || []).filter((r) => r.status !== "rejected");
        const operatives = new Set(active.map((r) => r.created_by_id).filter(Boolean)).size;
        const cities = new Set(active.map((r) => cityOf(r.address)).filter(Boolean)).size;
        setStats({ reports: active.length, operatives, cities });
      } catch {
        setStats({ reports: 0, operatives: 0, cities: 0 });
      }
    })();
  }, []);

  return (
    <section id="network" className="border-t border-slate2/40 bg-void">
      <div className="px-5 py-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-4 border-b border-slate2/40 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Field operative network</span>
            <h2 className="mt-3 font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-7xl">
              The resistance<br />is organized
            </h2>
          </div>
          <p className="max-w-sm font-display text-sm font-normal leading-[1.4] text-darkgray">
            Every report filed is a person who stopped walking past. This is the live count of field operatives, active cities, and documented interventions — the network grows with every submission.
          </p>
        </div>

        {!stats ? (
          <div className="flex items-center gap-3 py-16">
            <Loader2 className="h-5 w-5 animate-spin text-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">// tallying field operatives…</span>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-3 gap-px bg-slate2/40">
            <Stat icon={Megaphone} value={stats.reports} label="Field reports" accent="text-ozone" />
            <Stat icon={Users} value={stats.operatives} label="Active operatives" accent="text-ozone" />
            <Stat icon={MapPin} value={stats.cities} label="Cities active" accent="text-flare" />
          </div>
        )}

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
          // Live tally derived from documented atlas records · grows with every field submission
        </p>

        <p className="mt-2 max-w-2xl font-mono text-[10px] leading-relaxed tracking-[0.1em] text-dim">
          OOH Earth is a day-one platform — early access, seeking founding backers. The counts above are ours and honest. The wider resistance is not new: since ~{MOVEMENT.since} the global subvertising movement has grown to an estimated <span className="text-flare">~{fmtK(MOVEMENT.subvertisers)}+ subverters</span> across <span className="text-flare">{MOVEMENT.collectives}+ collectives</span> in <span className="text-flare">{MOVEMENT.countries}+ countries</span> (est.). We&rsquo;re here to put it on one map.
        </p>
      </div>
    </section>
  );
}