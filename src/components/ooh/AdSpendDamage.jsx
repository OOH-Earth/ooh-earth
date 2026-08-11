import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, Factory, Loader2 } from "lucide-react";

export default function AdSpendDamage() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt:
            "List 6 of the world's largest corporate outdoor-advertising (OOH/billboard) spenders that are also major carbon emitters or plastic polluters. For each, provide: brand name, estimated annual OOH ad spend in USD millions, their primary environmental harm in one short phrase, and estimated annual emissions in millions of tonnes CO2e if known (0 if unknown). Rank by ad spend descending.",
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              brands: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    brand: { type: "string" },
                    ad_spend_musd: { type: "number" },
                    harm: { type: "string" },
                    emissions_mt: { type: "number" },
                  },
                  required: ["brand", "ad_spend_musd", "harm"],
                },
              },
            },
            required: ["brands"],
          },
        });
        // InvokeLLM's SDK type is `string | object`; response_json_schema
        // above guarantees an object at runtime.
        const data = /** @type {{ brands?: any[] }} */ (res);
        if (active) setRows((data?.brands || []).slice(0, 6));
      } catch {
        if (active) setRows([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const maxSpend = rows ? Math.max(...rows.map((r) => r.ad_spend_musd || 0), 1) : 1;

  return (
    <section id="ad-spend" className="border-t border-slate2/40 bg-void">
      <div className="px-5 py-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-4 border-b border-slate2/40 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Ad spend vs. climate damage</span>
            <h2 className="mt-3 font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-7xl">
              The invoice<br />they bury
            </h2>
          </div>
          <p className="max-w-sm font-display text-sm font-normal leading-[1.4] text-darkgray">
            The same corporations buying every billboard are among the world's worst emitters. Here's their outdoor ad spend set against the damage it greenwashes — the cost never appears in their creative briefs.
          </p>
        </div>

        {!rows ? (
          <div className="flex items-center gap-3 py-16">
            <Loader2 className="h-5 w-5 animate-spin text-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">// compiling offender ledger…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// No data available</div>
        ) : (
          <div className="mt-10 divide-y divide-slate2/40 border border-slate2/60">
            {rows.map((r, i) => (
              <div key={r.brand} className="p-5 md:p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-sm font-black text-dim tabular">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display text-xl font-bold tracking-[-0.02em] text-silver md:text-2xl">{r.brand}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-xl font-black tabular text-ozone md:text-2xl">${(r.ad_spend_musd || 0).toLocaleString("en-US")}M</span>
                    <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">OOH spend/yr</span>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full bg-slate2/60">
                  <div className="h-full bg-ozone/70" style={{ width: `${((r.ad_spend_musd || 0) / maxSpend) * 100}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.15em]">
                  <span className="flex items-center gap-1.5 text-flare">
                    <Factory className="h-3 w-3" /> {r.harm}
                  </span>
                  {r.emissions_mt > 0 && (
                    <span className="flex items-center gap-1.5 text-darkgray">
                      <DollarSign className="h-3 w-3" /> ~{r.emissions_mt.toLocaleString("en-US")} Mt CO₂e/yr
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
          // Figures sourced via live web search · estimates for illustration of scale
        </p>
      </div>
    </section>
  );
}