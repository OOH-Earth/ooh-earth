import { useState } from "react";
import { ScanLine, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const VALID_TYPES = ["billboard", "painted", "digital", "projection", "sticker", "mural", "transit", "other"];

/**
 * ReportScanner — beta-stage AI ad detection embedded in the report flow.
 * After the user uploads a field photo (Step 1), this terminal-styled option
 * runs the scanAd backend function to auto-detect brand, agency, sector, harm
 * tags, and surface type — pre-filling the entire remaining form.
 */
export default function ReportScanner({ data, onChange }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const runScan = async () => {
    if (!data.image_url) return;
    setScanning(true);
    setResult(null);
    try {
      const resp = await base44.functions.invoke("scanAd", { file_url: data.image_url });
      const det = resp.data?.detection?.response || resp.data?.detection || resp.data;
      setResult(det);
      if (det.is_advertising) {
        const scannedType = VALID_TYPES.includes(det.surface_type) ? det.surface_type : "other";
        onChange({
          type: scannedType,
          brand_name: det.brand_name && det.brand_name !== "Unknown" ? det.brand_name : data.brand_name,
          ad_agency: det.ad_agency || data.ad_agency,
          parent_corp: det.parent_corp || data.parent_corp,
          campaign_name: det.campaign_name || data.campaign_name,
          ooh_operator: det.ooh_operator || data.ooh_operator,
          industry_sector: det.industry_sector || data.industry_sector,
          harm_tags: det.harm_tags?.length ? det.harm_tags : data.harm_tags,
          notes: det.description ? (data.notes ? `${data.notes}\n\n[Scanner] ${det.description}` : `[Scanner] ${det.description}`) : data.notes,
        });
      }
    } catch {
      setResult({ error: true });
    } finally {
      setScanning(false);
    }
  };

  if (!data.image_url) return null;

  const confidencePct = result?.confidence ? Math.round(result.confidence * 100) : 0;

  return (
    <div className="border border-flare/40 bg-flare/[0.04] grid-bg">
      {/* Terminal header bar */}
      <div className="flex items-center justify-between border-b border-flare/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <ScanLine className="h-3.5 w-3.5 text-flare" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-flare">AI Ad Scanner</span>
        </div>
        <span className="border border-flare/40 px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase tracking-[0.2em] text-flare">BETA</span>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] leading-relaxed text-darkgray">
              Auto-detect brand, agency, sector, harm tags, and surface type from your photo. Pre-fills the remaining steps.
            </p>
            {result?.error && (
              <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-flare">
                <AlertTriangle className="h-3 w-3" /> Scan failed — continue manually below.
              </p>
            )}
            {result?.is_advertising === false && (
              <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-flare">
                <AlertTriangle className="h-3 w-3" /> No advertising detected — continue manually.
              </p>
            )}
            {result?.is_advertising && (
              <div className="mt-2 space-y-1.5">
                <p className="flex items-center gap-1.5 font-mono text-[10px] text-ozone">
                  <CheckCircle2 className="h-3 w-3" /> Scan complete — fields pre-filled. Review in the next steps.
                </p>
                {/* Confidence bar */}
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-24 bg-slate2">
                    <div className="h-full bg-ozone transition-all" style={{ width: `${confidencePct}%` }} />
                  </div>
                  <span className="font-mono text-[9px] tabular text-dim">{confidencePct}% confidence</span>
                </div>
              </div>
            )}
          </div>
          <button type="button" onClick={runScan} disabled={scanning}
            className="flex shrink-0 items-center gap-2 border-2 border-flare bg-flare px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-ozone hover:border-ozone disabled:opacity-40">
            {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanLine className="h-3.5 w-3.5" />}
            {scanning ? "Scanning…" : "Run scan"}
          </button>
        </div>

        {/* Terminal scan animation */}
        {scanning && (
          <div className="mt-3 flex items-center gap-2 border-t border-slate2/40 pt-3">
            <div className="relative h-4 w-4">
              <ScanLine className="h-4 w-4 text-flare animate-pulse" />
              <div className="absolute inset-0 animate-ping rounded-full border border-flare/40" />
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-silver/50">
              Analyzing surface, brand, and harm classification…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}