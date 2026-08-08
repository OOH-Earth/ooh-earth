import { Image } from "@/components/ui/image";
import { SprayCan, Ruler, Percent, Palette, AlertTriangle } from "lucide-react";

const MEDIUM_LABELS = {
  spray_paint: "Spray Paint", marker: "Marker", sticker: "Sticker",
  paste_up: "Paste-up", stencil: "Stencil", installation: "Installation", other: "Other",
};

const STYLE_LABELS = {
  tag: "Tag", throw_up: "Throw-up", piece: "Piece", mural: "Mural",
  blockbuster: "Blockbuster", stencil: "Stencil", paste_up: "Paste-up", other: "Other",
};

const CONDITION_LABELS = {
  functional: "Functional", neglected: "Neglected", damaged: "Damaged",
  abandoned: "Abandoned", reclaimed: "Reclaimed", upgraded: "Upgraded",
};

function Field({ icon: Icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="border border-slate2/40 bg-void/50 px-3 py-2">
      <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
        <Icon className="h-2.5 w-2.5" /> {label}
      </div>
      <div className="mt-0.5 font-display text-[13px] font-semibold text-silver">{value}</div>
    </div>
  );
}

export default function GraffitiPanel({ loc }) {
  const hasMeasure = loc.graffiti_medium || loc.graffiti_style || loc.graffiti_surface_m2 || loc.graffiti_coverage_pct;
  if (!hasMeasure && !loc.image_url) return null;

  return (
    <div className="mt-8 border border-flare/30">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate2/60 px-4 py-3">
        <SprayCan className="h-4 w-4 text-flare" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-flare">// Graffiti Assessment</span>
        {loc.condition && loc.condition !== "functional" && (
          <span className="ml-auto border border-slate2/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-darkgray">
            {CONDITION_LABELS[loc.condition] || loc.condition}
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Graffiti image */}
        {loc.image_url && (
          <div className="relative aspect-[4/3] overflow-hidden border border-slate2/60">
            <Image src={loc.image_url} alt={loc.title} className="h-full w-full" fittingType="fill" />
          </div>
        )}

        {/* Measurement grid */}
        {hasMeasure && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {loc.graffiti_medium && <Field icon={SprayCan} label="Medium" value={MEDIUM_LABELS[loc.graffiti_medium] || loc.graffiti_medium} />}
            {loc.graffiti_style && <Field icon={Palette} label="Style" value={STYLE_LABELS[loc.graffiti_style] || loc.graffiti_style} />}
            {loc.graffiti_surface_m2 != null && <Field icon={Ruler} label="Surface" value={`${loc.graffiti_surface_m2} m²`} />}
            {loc.graffiti_coverage_pct != null && <Field icon={Percent} label="Coverage" value={`${loc.graffiti_coverage_pct}%`} />}
          </div>
        )}

        {/* If on an ad structure, show the original advertiser */}
        {loc.brand_name && (
          <div className="mt-4 border border-slate2/40 p-3">
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">Originally advertising</span>
            <div className="mt-0.5 font-display text-sm font-semibold text-silver">
              {loc.brand_name}{loc.campaign_name ? ` · ${loc.campaign_name}` : ""}
            </div>
            {loc.adbust_type && loc.adbust_type !== "none" && (
              <span className="mt-1 inline-block font-mono text-[8px] uppercase tracking-[0.1em] text-flare">
                Reclaimed via {loc.adbust_type.replace(/_/g, " ")}
              </span>
            )}
          </div>
        )}

        {/* Harm statement (if present) */}
        {loc.harm_statement && (
          <div className="mt-4 border-l-2 border-flare/50 pl-3">
            <p className="text-[13px] leading-relaxed text-silver/85">{loc.harm_statement}</p>
          </div>
        )}

        {/* Graffiti measurement note */}
        <div className="mt-4 border-t border-slate2/40 pt-3">
          <p className="flex items-start gap-1.5 font-mono text-[10px] leading-relaxed text-dim">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-flare/60" />
            Graffiti and street art as reclamation of the visual commons — measured, classified, and documented for the public record. A dedicated graffiti map is in development.
          </p>
        </div>
      </div>
    </div>
  );
}