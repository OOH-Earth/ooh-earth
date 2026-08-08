import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin, accessOf, agencyOf } from "@/lib/clearance";
import { PARENT_CORPS, AGENCIES } from "@/components/ooh/report/advertiserRegistry";
import { ALL_OOH_OPERATORS } from "@/components/ooh/report/oohMediaCorps";
import { BrandBadge } from "@/components/ooh/BrandBadge";
import { Tag, Save, X, ChevronDown, ChevronUp, Loader2, AlertTriangle } from "lucide-react";

const INDUSTRY_SECTORS = [
  { value: "", label: "— None —" },
  { value: "fossil_fuel", label: "Fossil Fuel" },
  { value: "tobacco", label: "Tobacco" },
  { value: "alcohol", label: "Alcohol" },
  { value: "gambling", label: "Gambling" },
  { value: "ultra_processed_food", label: "Ultra-processed Food" },
  { value: "surveillance", label: "Surveillance" },
  { value: "finance", label: "Finance" },
  { value: "real_estate", label: "Real Estate" },
  { value: "fashion", label: "Fashion" },
  { value: "automotive", label: "Automotive" },
  { value: "pharma", label: "Pharma" },
  { value: "other", label: "Other" },
];

const HARM_TAG_OPTIONS = [
  "greenwashing", "child_targeting", "health_harm", "environmental_damage",
  "misinformation", "body_image", "addiction_promotion", "surveillance",
  "cultural_appropriation", "political_propaganda", "gender_stereotyping",
];

const CONDITIONS = [
  { value: "functional", label: "Functional" },
  { value: "neglected", label: "Neglected" },
  { value: "damaged", label: "Damaged" },
  { value: "abandoned", label: "Abandoned" },
  { value: "reclaimed", label: "Reclaimed" },
  { value: "upgraded", label: "Upgraded" },
];

const ACTION_FLAG_OPTIONS = [
  "legal_review", "council_submission", "community_reclaim", "petition", "archive",
];

function canEditLocation(user) {
  return isAdmin(user) || accessOf(user) === "moderator" || agencyOf(user);
}

export default function LocationEditPanel({ loc, onUpdated }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);

  if (!canEditLocation(user)) return null;

  const startEdit = () => {
    setForm({
      brand_name: loc.brand_name || "",
      campaign_name: loc.campaign_name || "",
      ad_agency: loc.ad_agency || "",
      parent_corp: loc.parent_corp || "",
      ooh_operator: loc.ooh_operator || "",
      industry_sector: loc.industry_sector || "",
      condition: loc.condition || "functional",
      status: loc.status || "pending",
      harm_tags: loc.harm_tags || [],
      action_flags: loc.action_flags || [],
      harm_statement: loc.harm_statement || "",
      notes: loc.notes || "",
      graffiti_medium: loc.graffiti_medium || "",
      graffiti_style: loc.graffiti_style || "",
      graffiti_surface_m2: loc.graffiti_surface_m2 || "",
      graffiti_coverage_pct: loc.graffiti_coverage_pct || "",
    });
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form };
      // Numeric fields — API rejects empty strings for number type.
      // Convert "" / null to undefined so the field is omitted entirely.
      ["graffiti_surface_m2", "graffiti_coverage_pct"].forEach((f) => {
        const v = payload[f];
        if (v === "" || v == null) {
          delete payload[f];
        } else {
          payload[f] = Number(v);
        }
      });
      // Also strip empty-string optionals so they don't overwrite existing values with blanks
      ["brand_name", "campaign_name", "ad_agency", "parent_corp", "ooh_operator", "graffiti_medium", "graffiti_style"].forEach((f) => {
        if (payload[f] === "") delete payload[f];
      });
      const updated = await base44.entities.Location.update(loc.id, payload);
      onUpdated(updated);
      setOpen(false);
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const toggleArr = (field, value) =>
    setForm((f) => {
      const arr = f[field] || [];
      return { ...f, [field]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value] };
    });

  const roleLabel = isAdmin(user) ? "Admin" : accessOf(user) === "moderator" ? "Moderator" : "Agency";

  return (
    <div className="mt-8 border border-ozone/30 bg-card">
      {/* Header bar */}
      <button
        onClick={() => (open ? setOpen(false) : startEdit())}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate2/20"
      >
        <span className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-ozone" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone">Edit & Tag</span>
          <span className="border border-ozone/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone/70">{roleLabel}</span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-dim" /> : <ChevronDown className="h-4 w-4 text-dim" />}
      </button>

      {open && form && (
        <div className="space-y-5 border-t border-slate2/40 px-4 py-5">
          {/* Identification */}
          <div>
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-ozone/60">// Advertiser</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Brand</span>
                <input
                  list="dl-brands"
                  value={form.brand_name}
                  onChange={(e) => set("brand_name", e.target.value)}
                  className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone"
                  placeholder="e.g. Shell"
                />
                {form.brand_name && <BrandBadge name={form.brand_name} className="mt-1 self-start" />}
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Campaign</span>
                <input
                  value={form.campaign_name}
                  onChange={(e) => set("campaign_name", e.target.value)}
                  className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone"
                  placeholder="e.g. Drive the Future"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Ad Agency</span>
                <input
                  list="dl-agencies"
                  value={form.ad_agency}
                  onChange={(e) => set("ad_agency", e.target.value)}
                  className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone"
                  placeholder="e.g. Ogilvy"
                />
                {form.ad_agency && <BrandBadge name={form.ad_agency} className="mt-1 self-start" />}
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Parent Corp</span>
                <input
                  list="dl-corps"
                  value={form.parent_corp}
                  onChange={(e) => set("parent_corp", e.target.value)}
                  className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone"
                  placeholder="e.g. WPP"
                />
                {form.parent_corp && <BrandBadge name={form.parent_corp} className="mt-1 self-start" />}
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">OOH Operator (structure owner)</span>
                <input
                  list="dl-operators"
                  value={form.ooh_operator}
                  onChange={(e) => set("ooh_operator", e.target.value)}
                  className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone"
                  placeholder="e.g. Clear Channel"
                />
                {form.ooh_operator && <BrandBadge name={form.ooh_operator} className="mt-1 self-start" />}
              </label>
            </div>
            <datalist id="dl-brands">
              {PARENT_CORPS.map((b) => <option key={b} value={b} />)}
            </datalist>
            <datalist id="dl-agencies">
              {AGENCIES.map((a) => <option key={a} value={a} />)}
            </datalist>
            <datalist id="dl-corps">
              {PARENT_CORPS.map((c) => <option key={c} value={c} />)}
            </datalist>
            <datalist id="dl-operators">
              {ALL_OOH_OPERATORS.map((o) => <option key={o} value={o} />)}
            </datalist>
          </div>

          {/* Classification */}
          <div>
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-ozone/60">// Classification</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Industry Sector</span>
                <select
                  value={form.industry_sector}
                  onChange={(e) => set("industry_sector", e.target.value)}
                  className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone"
                >
                  {INDUSTRY_SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Condition</span>
                <select
                  value={form.condition}
                  onChange={(e) => set("condition", e.target.value)}
                  className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone"
                >
                  {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone"
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
            </div>
          </div>

          {/* Harm tags */}
          <div>
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-ozone/60">// Harm Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {HARM_TAG_OPTIONS.map((tag) => {
                const active = (form.harm_tags || []).includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleArr("harm_tags", tag)}
                    className={`border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${
                      active ? "border-flare bg-flare/15 text-flare" : "border-slate2 text-dim hover:border-ozone/50 hover:text-silver"
                    }`}
                  >
                    {tag.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action flags */}
          <div>
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-ozone/60">// Action Flags</div>
            <div className="flex flex-wrap gap-1.5">
              {ACTION_FLAG_OPTIONS.map((flag) => {
                const active = (form.action_flags || []).includes(flag);
                return (
                  <button
                    key={flag}
                    onClick={() => toggleArr("action_flags", flag)}
                    className={`border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${
                      active ? "border-ozone bg-ozone/15 text-ozone" : "border-slate2 text-dim hover:border-ozone/50 hover:text-silver"
                    }`}
                  >
                    {flag.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Graffiti measurement */}
          <div>
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-flare/60">// Graffiti Assessment</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Medium</span>
                <select value={form.graffiti_medium} onChange={(e) => set("graffiti_medium", e.target.value)} className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone">
                  <option value="">— None —</option>
                  <option value="spray_paint">Spray Paint</option>
                  <option value="marker">Marker</option>
                  <option value="sticker">Sticker</option>
                  <option value="paste_up">Paste-up</option>
                  <option value="stencil">Stencil</option>
                  <option value="installation">Installation</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Style</span>
                <select value={form.graffiti_style} onChange={(e) => set("graffiti_style", e.target.value)} className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone">
                  <option value="">— None —</option>
                  <option value="tag">Tag</option>
                  <option value="throw_up">Throw-up</option>
                  <option value="piece">Piece</option>
                  <option value="mural">Mural</option>
                  <option value="blockbuster">Blockbuster</option>
                  <option value="stencil">Stencil</option>
                  <option value="paste_up">Paste-up</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Surface (m²)</span>
                <input type="number" step="0.1" value={form.graffiti_surface_m2 || ""} onChange={(e) => set("graffiti_surface_m2", e.target.value ? parseFloat(e.target.value) : "")} className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone" placeholder="e.g. 4.5" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Coverage %</span>
                <input type="number" min="0" max="100" value={form.graffiti_coverage_pct || ""} onChange={(e) => set("graffiti_coverage_pct", e.target.value ? parseInt(e.target.value) : "")} className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone" placeholder="0–100" />
              </label>
            </div>
          </div>

          {/* Community statement + notes */}
          <div className="grid gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Harm Statement</span>
              <textarea
                rows={2}
                value={form.harm_statement}
                onChange={(e) => set("harm_statement", e.target.value)}
                className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone resize-y"
                placeholder="What this ad is doing to this space / community"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Field Notes</span>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone resize-y"
                placeholder="Observations, access details, context"
              />
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 border border-flare/40 bg-flare/5 px-3 py-2 font-mono text-[10px] text-flare">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate2/40 pt-4">
            <button
              onClick={() => setOpen(false)}
              disabled={saving}
              className="flex items-center gap-1.5 border border-slate2 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dim transition-colors hover:border-flare hover:text-flare disabled:opacity-40"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 border border-ozone bg-ozone px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}