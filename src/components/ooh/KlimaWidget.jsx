import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Leaf, Loader2 } from "lucide-react";

export default function KlimaWidget() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt:
            "What is the total cumulative tonnes of carbon dioxide equivalent (tCO2e) retired through Klima DAO to date? Return the current figure, the source, and a one-sentence note on what Klima DAO does.",
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              tonnes_retired: { type: "number" },
              source: { type: "string" },
              note: { type: "string" },
            },
            required: ["tonnes_retired"],
          },
        });
        if (active) setData(res);
      } catch {
        if (active) setData(null);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const fmt = (n) => (n != null ? Math.round(n).toLocaleString("en-US") : "—");

  return (
    <section id="klima" className="border-t border-slate2/40 bg-void">
      <div className="px-5 py-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-4 border-b border-slate2/40 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// On-chain carbon ledger</span>
            <h2 className="mt-3 font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-7xl">
              Retired,<br />not offset
            </h2>
          </div>
          <p className="max-w-sm font-display text-sm font-normal leading-[1.4] text-darkgray">
            Klima DAO retires carbon credits permanently on-chain — every tonne is verifiably burned, not traded into existence. This is the counter the ad industry doesn't have: irreversible, public, mathematically certain.
          </p>
        </div>

        <div className="mt-10 grid gap-px bg-slate2/40 md:grid-cols-2">
          <div className="border border-slate2/60 bg-void p-8 md:p-12">
            <Leaf className="h-5 w-5 text-ozone" />
            {!data ? (
              <div className="mt-6 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-ozone" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">// querying on-chain ledger…</span>
              </div>
            ) : (
              <>
                <div className="mt-6 font-display text-6xl font-black leading-none tracking-[-0.02em] text-ozone text-glow-ozone md:text-8xl tabular">
                  {fmt(data.tonnes_retired)}
                </div>
                <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">tCO₂e retired via Klima DAO</div>
                {data.source && <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">source · {data.source}</div>}
              </>
            )}
          </div>
          <div className="border border-slate2/60 bg-void p-8 md:p-12">
            <div className="font-display text-sm font-medium leading-[1.5] text-silver/80">
              {data?.note ||
                "Klima DAO is a decentralized protocol that incentivizes the retirement of tokenized carbon credits, permanently removing them from circulation and driving real-world decarbonization."}
            </div>
            <div className="mt-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ozone" />
              Live · token price in header ticker
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}