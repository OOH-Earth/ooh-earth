import { useState } from "react";
import { base44 } from "@/api/base44Client";
import Nav from "@/components/ooh/Nav";
import UpcScanner from "@/components/ooh/truecost/UpcScanner";
import TrueCostResult from "@/components/ooh/truecost/TrueCostResult";
import { History, Barcode, AlertCircle } from "lucide-react";

const SCHEMA = {
  type: "object",
  properties: {
    identified: { type: "boolean" },
    product_name: { type: "string" },
    brand_owner: { type: "string" },
    retail_price_usd: { type: "number" },
    true_cost_usd: { type: "number" },
    externality_usd: { type: "number" },
    carbon_kg: { type: "number" },
    water_liters: { type: "number" },
    labor_risk: { type: "string", enum: ["low", "moderate", "high", "critical"] },
    packaging: { type: "string" },
    packaging_recyclable: { type: "boolean" },
    greenwashing_flags: { type: "array", items: { type: "string" } },
    brand_accountability: { type: "string" },
    verdict: { type: "string" },
  },
  required: ["identified", "product_name", "brand_owner", "retail_price_usd", "true_cost_usd", "externality_usd", "labor_risk", "verdict"],
};

const buildPrompt = (upc, product) =>
  `You are a true-cost economist auditing a consumer product for the OOH.EARTH resistance platform ("Out Of Hell"). Estimate the full social and environmental TRUE COST — what the product actually costs society once externalities are priced in: carbon emissions, water depletion, labor exploitation, packaging waste, brand greenwashing, and supply-chain harm.

UPC/EAN: ${upc}
Known product data: ${product ? JSON.stringify(product) : "none — identify the product from the barcode via web research"}

Provide confident, realistic USD estimates. Name the actual brand owner (parent company). Call out any known greenwashing or labor/supply-chain controversies for that brand. End with a sharp one-line verdict.`;

export default function TrueCost() {
  const [upc, setUpc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const analyze = async (code) => {
    setUpc(code);
    setResult(null);
    setError("");
    setLoading(true);
    let product = null;
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
      const d = await r.json();
      if (d.status === 1 && d.product) {
        const p = d.product;
        product = {
          name: p.product_name,
          brand: p.brands,
          image: p.image_front_small_url || p.image_small_url,
          quantity: p.quantity,
          categories: p.categories,
          ecoscore: p.ecoscore_grade,
          nutriscore: p.nutriscore_grade,
        };
      }
    } catch (e) {
      /* OFF unreachable — fall through to LLM-only */
    }

    try {
      const useWeb = !product;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(code, product),
        response_json_schema: SCHEMA,
        ...(useWeb ? { add_context_from_internet: true, model: "gemini_3_flash" } : {}),
      });
      const out = { upc: code, ...(product || {}), ...res };
      setResult(out);
      setHistory((h) => [out, ...h.filter((x) => x.upc !== code)].slice(0, 12));
    } catch (e) {
      setError(e.message || "Analysis failed — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void">
      <Nav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-24 md:px-8">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Field tool · TrueCost scanner</span>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight2 text-silver md:text-5xl">Scan a product.<br />Reveal the true cost.</h1>
          <p className="mt-2 max-w-xl font-display text-sm leading-relaxed text-darkgray">
            Point the camera at any in-store barcode. We decode the UPC, identify the brand, and price the externalities capitalism leaves off the tag — carbon, water, labor, packaging, greenwashing.
          </p>
        </div>

        <div className="mt-8">
          <UpcScanner onDetected={analyze} />
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
            // live camera scanning needs a published https url — manual entry works in preview.
          </p>
        </div>

        {upc && (
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
              <Barcode className="h-3.5 w-3.5 text-ozone" /> Decoding {upc}
            </div>
            <TrueCostResult data={result} loading={loading} error={error} />
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-10">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
              <History className="h-3.5 w-3.5" /> Session audit log
            </div>
            <div className="divide-y divide-slate2/40 border border-slate2/60">
              {history.map((h, i) => (
                <button key={i} onClick={() => { setUpc(h.upc); setResult(h); setError(""); }} className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-ozone/5">
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-bold text-silver">{h.product_name || h.name || "Unknown product"}</div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">{h.brand_owner || h.brand || "—"} · UPC {h.upc}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    {h.true_cost_usd != null && <div className="font-display text-sm font-black tabular text-flare">${Number(h.true_cost_usd).toFixed(2)}</div>}
                    {h.externality_usd != null && <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">+${Number(h.externality_usd).toFixed(2)} ext</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}