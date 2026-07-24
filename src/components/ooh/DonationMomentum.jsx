import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CAMPAIGN } from "@/components/ooh/fundConfig";
import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";

export default function DonationMomentum() {
  const [raised, setRaised] = useState(CAMPAIGN.raisedUsd);

  useEffect(() => {
    (async () => {
      try {
        const recs = await base44.entities.FundingLead.list("-created_date", 500);
        const sum = (recs || []).reduce((acc, r) => acc + (r.amount || 0), 0);
        if (sum > 0) setRaised(sum);
      } catch {
        /* keep config default */
      }
    })();
  }, []);

  const goal = CAMPAIGN.goalUsd;
  const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
  const fmt = (n) => "$" + Math.round(n).toLocaleString("en-US");

  return (
    <section id="momentum" className="border-t border-slate2/40 bg-void">
      <div className="hi-vis-stripes h-1 w-full opacity-60" />
      <div className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Field offensive — live</span>
              <h2 className="mt-2 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-5xl">{CAMPAIGN.tagline}</h2>
            </div>
            <Link to="/campaign" className="flex shrink-0 items-center gap-2 border-2 border-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare" style={{ backgroundColor: "#EDFF00" }}>
              <Rocket className="h-3.5 w-3.5" /> Fund the offensive
            </Link>
          </div>

          <div className="mt-8">
            <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
              <span className="text-ozone">{fmt(raised)} raised</span>
              <span className="text-dim">{fmt(goal)} goal</span>
            </div>
            <div className="mt-2 h-3 w-full bg-slate2/60">
              <div className="h-full bg-ozone transition-all duration-700" style={{ width: `${pct}%`, boxShadow: "0 0 12px rgba(237,255,0,0.4)" }} />
            </div>
            <div className="mt-2 text-right font-display text-sm font-bold tabular text-flare">{pct.toFixed(0)}% funded</div>
          </div>

          <p className="mt-6 max-w-xl font-display text-sm font-normal leading-[1.5] text-darkgray">{CAMPAIGN.urgency}</p>
        </div>
      </div>
    </section>
  );
}