import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, ExternalLink } from "lucide-react";

const inp = "w-full bg-void border border-slate2 px-4 py-3 font-display text-sm text-silver outline-none transition-colors placeholder:text-dim focus:border-ozone";

const SECTORS = [
  { value: "fossil_fuel", label: "Fossil fuel" },
  { value: "tobacco", label: "Tobacco" },
  { value: "alcohol", label: "Alcohol" },
  { value: "gambling", label: "Gambling" },
  { value: "ultra_processed_food", label: "UPF / Junk food" },
  { value: "surveillance", label: "Surveillance tech" },
  { value: "finance", label: "Finance / Banking" },
  { value: "real_estate", label: "Real estate" },
  { value: "fashion", label: "Fashion / Luxury" },
  { value: "automotive", label: "Automotive" },
  { value: "pharma", label: "Pharma" },
  { value: "other", label: "Other" },
];

const OOH_OPERATORS = [
  "Clear Channel", "Plan B Media", "JCDecaux", "Ogilvy", "Publicis", "Havas",
  "BBDO", "McCann", "TBWA", "DDB", "Grey", "Leo Burnett", "Other",
];

export default function ReportStep2Identify({ data, onChange }) {
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(null);

  const aiDetect = async () => {
    if (!data.image_url) return;
    setDetecting(true);
    setDetected(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a brand and advertising analyst. Examine this OOH (out-of-home) advertising image and identify:
1. brand_name: The main brand or company being advertised (e.g. "Shell", "McDonald's"). If unclear, say "Unknown".
2. campaign_name: The campaign or tagline if visible (e.g. "Drive The Future").
3. industry_sector: One of: fossil_fuel, tobacco, alcohol, gambling, ultra_processed_food, surveillance, finance, real_estate, fashion, automotive, pharma, other.
4. parent_corp: Parent/holding company if known (e.g. "Shell plc", "Yum! Brands").
5. notes: Any other notable observations about the ad content.
Respond in JSON only.`,
        file_urls: [data.image_url],
        response_json_schema: {
          type: "object",
          properties: {
            brand_name: { type: "string" },
            campaign_name: { type: "string" },
            industry_sector: { type: "string" },
            parent_corp: { type: "string" },
            notes: { type: "string" }
          }
        }
      });
      setDetected(result);
      onChange({
        brand_name: result.brand_name && result.brand_name !== "Unknown" ? result.brand_name : data.brand_name,
        campaign_name: result.campaign_name || data.campaign_name,
        industry_sector: result.industry_sector || data.industry_sector,
        parent_corp: result.parent_corp || data.parent_corp,
      });
    } catch (e) {
      setDetected({ error: true });
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="space-y-7">

      {/* AI Detection CTA */}
      {data.image_url && (
        <div className="border border-ozone/30 bg-ozone/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">AI brand scanner</div>
              <p className="mt-1 font-display text-sm text-darkgray">Analyse your photo to auto-identify the brand, campaign, and sector.</p>
              {detected?.error && <p className="mt-1 font-mono text-[10px] text-flare">Detection failed — fill manually below.</p>}
              {detected && !detected.error && <p className="mt-1 font-mono text-[10px] text-ozone">✓ Detection applied — review and correct below.</p>}
            </div>
            <button type="button" onClick={aiDetect} disabled={detecting}
              className="flex shrink-0 items-center gap-2 bg-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare disabled:opacity-40">
              {detecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {detecting ? "Scanning…" : "Identify"}
            </button>
          </div>
        </div>
      )}

      {/* Brand */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Brand / Advertiser</label>
        <input value={data.brand_name} onChange={(e) => onChange({ brand_name: e.target.value })}
          placeholder="e.g. Shell, McDonald's, Toyota" className={inp} />
      </div>

      {/* Campaign */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Campaign / Tagline <span className="text-dim/50">(optional)</span></label>
        <input value={data.campaign_name} onChange={(e) => onChange({ campaign_name: e.target.value })}
          placeholder="e.g. Drive the Future" className={inp} />
      </div>

      {/* Parent corp */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Parent / Holding company <span className="text-dim/50">(optional)</span></label>
        <input value={data.parent_corp} onChange={(e) => onChange({ parent_corp: e.target.value })}
          placeholder="e.g. Shell plc, Yum! Brands, WPP" className={inp} />
      </div>

      {/* OOH Operator */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">OOH structure owner <span className="text-dim/50">(optional)</span></label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {OOH_OPERATORS.map((op) => (
            <button key={op} type="button" onClick={() => onChange({ ooh_operator: op })}
              className={`px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-colors border ${data.ooh_operator === op ? "border-ozone bg-ozone/10 text-ozone" : "border-slate2 text-darkgray hover:border-ozone/50"}`}>
              {op}
            </button>
          ))}
        </div>
        <input value={data.ooh_operator} onChange={(e) => onChange({ ooh_operator: e.target.value })}
          placeholder="Or type operator name" className={inp} />
      </div>

      {/* Ad Agency */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Ad agency (creative) <span className="text-dim/50">(optional)</span></label>
        <input value={data.ad_agency} onChange={(e) => onChange({ ad_agency: e.target.value })}
          placeholder="e.g. Ogilvy, McCann, BBDO" className={inp} />
        <a href="https://cleancreatives.org/asia-f-list" target="_blank" rel="noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.15em] text-ozone/70 transition-colors hover:text-ozone">
          <ExternalLink className="h-2.5 w-2.5" /> Clean Creatives F-List (Asia)
        </a>
      </div>

      {/* Industry sector */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Industry sector</label>
        <div className="grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40 sm:grid-cols-3">
          {SECTORS.map((s) => (
            <button key={s.value} type="button" onClick={() => onChange({ industry_sector: s.value })}
              className={`px-3 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-colors ${data.industry_sector === s.value ? "bg-ozone text-void" : "bg-card text-darkgray hover:text-silver"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}