import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";

const ADBUST_TYPES = [
  { value: "none", label: "None / Not yet" },
  { value: "subverted", label: "Subverted" },
  { value: "painted_over", label: "Painted over" },
  { value: "stickered", label: "Stickered" },
  { value: "projected", label: "Projected onto" },
  { value: "wheatpasted", label: "Wheatpasted" },
  { value: "removed", label: "Removed / Gone" },
  { value: "other", label: "Other" },
];

const ACTION_FLAGS = [
  { value: "legal_review", label: "🚨 Flag for legal review" },
  { value: "council_submission", label: "🧑‍⚖️ Escalate to council / legal aid" },
  { value: "community_reclaim", label: "🧱 Community reclaim / paint-over" },
  { value: "petition", label: "🗳 Add to petition / removal campaign" },
  { value: "archive", label: "🗂 Archive for case-building" },
  { value: "pressure_campaign", label: "📢 Feed into public pressure campaign" },
];

export default function ReportStep4Adbust({ data, onChange }) {
  const [uploading, setUploading] = useState(false);

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onChange({ adbust_image_url: res.file_url });
    } finally { setUploading(false); }
  };

  const toggleAction = (v) => {
    const flags = data.action_flags || [];
    onChange({ action_flags: flags.includes(v) ? flags.filter((f) => f !== v) : [...flags, v] });
  };

  return (
    <div className="space-y-8">

      <div className="border border-ozone/20 bg-ozone/[0.03] p-4">
        <p className="font-display text-sm leading-[1.5] text-darkgray">
          This isn't just an adbusting site. It's an OOH accountability platform. Log any activist intervention and select the actions you want to take — or simply archive the evidence.
        </p>
      </div>

      {/* Adbust type */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Intervention type <span className="text-dim/50">(if any)</span></label>
        <div className="grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40 sm:grid-cols-4">
          {ADBUST_TYPES.map((t) => (
            <button key={t.value} type="button" onClick={() => onChange({ adbust_type: t.value })}
              className={`px-3 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] transition-colors ${data.adbust_type === t.value ? "bg-ozone text-void" : "bg-card text-darkgray hover:text-silver"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Adbust photo */}
      {data.adbust_type && data.adbust_type !== "none" && (
        <div>
          <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Intervention photo <span className="text-dim/50">(optional)</span></label>
          <label className="flex cursor-pointer items-center gap-3 border border-slate2 bg-card px-4 py-4 transition-colors hover:border-ozone">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin text-ozone" />
              : data.adbust_image_url ? <img src={data.adbust_image_url} alt="" className="h-12 w-12 object-cover" />
              : <Camera className="h-4 w-4 text-dim" />}
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">
              {uploading ? "Uploading…" : data.adbust_image_url ? "Replace photo" : "Upload adbust evidence"}
            </span>
            <input type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
          </label>
        </div>
      )}

      {/* Action flags */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">From witness to action <span className="text-dim/50">(select all that apply)</span></label>
        <div className="space-y-1.5">
          {ACTION_FLAGS.map((f) => {
            const active = (data.action_flags || []).includes(f.value);
            return (
              <button key={f.value} type="button" onClick={() => toggleAction(f.value)}
                className={`flex w-full items-center gap-3 border px-4 py-3 text-left transition-colors ${active ? "border-ozone/40 bg-ozone/5" : "border-slate2/60 bg-card hover:border-slate2"}`}>
                <span className={`h-3.5 w-3.5 shrink-0 border ${active ? "border-ozone bg-ozone" : "border-slate2"}`} />
                <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${active ? "text-ozone" : "text-darkgray"}`}>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}