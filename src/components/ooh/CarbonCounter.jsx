import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, Cloud, TreePine, Loader2 } from "lucide-react";

const KWH_PER_SCREEN_YR = 5200;
const KG_CO2_PER_KWH = 0.42;
const KG_CO2_PER_TREE_YR = 21;

function Stat({ icon: Icon, value, label, sub, accent }) {
  return (
    <div className="border border-slate2/60 p-5 md:p-7">
      <Icon className={`h-4 w-4 ${accent}`} />
      <div className="mt-4 font-display text-4xl font-black leading-none tracking-[-0.02em] text-silver md:text-5xl tabular">{value}</div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">{label}</div>
      {sub && <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">{sub}</div>}
    </div>
  );
}

export default function CarbonCounter() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const recs = await base44.listAllLocations();
        const digital = (recs || []).filter((r) => r.type === "digital" && r.status !== "rejected");
        const count = digital.length;
        const kwh = count * KWH_PER_SCREEN_YR;
        const co2kg = kwh * KG_CO2_PER_KWH;
        setData({ count, kwh, co2kg, trees: Math.round(co2kg / KG_CO2_PER_TREE_YR) });
      } catch {
        setData({ count: 0, kwh: 0, co2kg: 0, trees: 0 });
      }
    })();
  }, []);

  const fmt = (n) => Math.round(n).toLocaleString("en-US");

  return (
    <section id="true-cost" className="relative border-t border-slate2/40 bg-void">
      <div className="px-5 py-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-4 border-b border-slate2/40 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Section 03b — True cost ledger</span>
            <h2 className="mt-3 font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-7xl">
              Every screen<br />has a body count
            </h2>
          </div>
          <p className="max-w-sm font-display text-sm font-normal leading-[1.4] text-darkgray">
            Digital billboards run 24/7 — each one burns thousands of kWh a year and exhales tonnes of CO₂. We tally the documented screens in the atlas against the grid average. This is the invoice the advertisers never send.
          </p>
        </div>

        {!data ? (
          <div className="flex items-center gap-3 py-16">
            <Loader2 className="h-5 w-5 animate-spin text-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">// computing field draw…</span>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-px bg-slate2/40 lg:grid-cols-4">
            <Stat icon={Zap} value={data.count} label="Digital screens logged" sub="in field atlas" accent="text-ozone" />
            <Stat icon={Zap} value={`${fmt(data.kwh / 1000)}k`} label="kWh / year" sub="est. @ 5,200 kWh/screen" accent="text-ozone" />
            <Stat icon={Cloud} value={`${fmt(data.co2kg / 1000)}t`} label="CO₂ / year" sub="est. @ 0.42 kg/kWh" accent="text-flare" />
            <Stat icon={TreePine} value={fmt(data.trees)} label="Trees to offset" sub="@ 21 kg CO₂/yr per tree" accent="text-flare" />
          </div>
        )}

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
          // Estimates derived from documented digital screens only · grid-carbon factor 0.42 kg CO₂/kWh (IEA global avg)
        </p>
      </div>
    </section>
  );
}