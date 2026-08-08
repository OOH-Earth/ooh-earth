import { Image } from "@/components/ui/image";
import { Ban, Megaphone, ExternalLink, Building2, Flag, AlertTriangle, Tag } from "lucide-react";
import { Link } from "react-router-dom";

const SECTOR_LABELS = {
  fossil_fuel: "Fossil Fuel", tobacco: "Tobacco", alcohol: "Alcohol", gambling: "Gambling",
  ultra_processed_food: "Ultra-processed Food", surveillance: "Surveillance", finance: "Finance",
  real_estate: "Real Estate", fashion: "Fashion", automotive: "Automotive", pharma: "Pharma", other: "Other",
};

function Field({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="border border-slate2/40 bg-void/50 px-3 py-2">
      <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
        {Icon && <Icon className="h-2.5 w-2.5" />} {label}
      </div>
      <div className="mt-0.5 font-display text-[13px] font-semibold text-silver">{value}</div>
    </div>
  );
}

export default function SubvertisingPanel({ loc }) {
  const isSubverted = loc.adbust_type && loc.adbust_type !== "none";
  const hasBefore = !!loc.image_url;
  const hasAfter = !!loc.adbust_image_url;
  const showCompare = isSubverted && hasAfter;

  return (
    <div className="mt-8 border border-slate2/60">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate2/60 px-4 py-3">
        {isSubverted ? <Ban className="h-4 w-4 text-flare" /> : <Megaphone className="h-4 w-4 text-ozone" />}
        <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.25em] ${isSubverted ? "text-flare" : "text-ozone"}`}>
          {isSubverted ? "// Subverted" : "// Advertiser"}
        </span>
        {isSubverted && (
          <span className="border border-flare/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">
            {loc.adbust_type.replace(/_/g, " ")}
          </span>
        )}
        {loc.condition && loc.condition !== "functional" && (
          <span className="ml-auto border border-slate2/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-darkgray">
            {loc.condition}
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Before / After comparison */}
        {showCompare && (
          <div className="grid gap-3 sm:grid-cols-2">
            {hasBefore && (
              <div>
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">Original ad</span>
                <div className="relative mt-1 aspect-[4/3] overflow-hidden border border-slate2/60">
                  <Image src={loc.image_url} alt="Original ad" className="h-full w-full" fittingType="fill" />
                </div>
              </div>
            )}
            <div>
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-flare">Subverted state</span>
              <div className="relative mt-1 aspect-[4/3] overflow-hidden border border-flare/40">
                <Image src={loc.adbust_image_url} alt="Subverted" className="h-full w-full" fittingType="fill" />
              </div>
            </div>
          </div>
        )}

        {/* Single subverted image (no original) */}
        {isSubverted && !hasBefore && hasAfter && (
          <div className="relative aspect-[4/3] overflow-hidden border border-flare/40">
            <Image src={loc.adbust_image_url} alt="Subverted" className="h-full w-full" fittingType="fill" />
          </div>
        )}

        {/* Advertiser info grid */}
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {loc.brand_name && <Field icon={Tag} label="Brand" value={loc.brand_name} />}
          {loc.campaign_name && <Field label="Campaign" value={loc.campaign_name} />}
          {loc.ad_agency && <Field label="Agency" value={loc.ad_agency} />}
          {loc.parent_corp && <Field label="Parent" value={loc.parent_corp} />}
          {loc.ooh_operator && <Field icon={Building2} label="OOH Operator" value={loc.ooh_operator} />}
          {loc.industry_sector && <Field label="Sector" value={SECTOR_LABELS[loc.industry_sector] || loc.industry_sector} />}
        </div>

        {/* Harm tags */}
        {loc.harm_tags?.length > 0 && (
          <div className="mt-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-flare/60">// Harm tags</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {loc.harm_tags.map((tag) => (
                <span key={tag} className="border border-flare/40 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-flare">
                  {tag.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Harm statement */}
        {loc.harm_statement && (
          <div className="mt-4 border-l-2 border-flare/50 pl-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-flare/60">// Community statement</span>
            <p className="mt-1 text-[13px] leading-relaxed text-silver/85">{loc.harm_statement}</p>
          </div>
        )}

        {/* Action flags */}
        {loc.action_flags?.length > 0 && (
          <div className="mt-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone/60">// Action flags</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {loc.action_flags.map((flag) => (
                <span key={flag} className="flex items-center gap-1 border border-ozone/40 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ozone">
                  <Flag className="h-2.5 w-2.5" /> {flag.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Subvertising participation note */}
        {!isSubverted && (
          <div className="mt-4 border-t border-slate2/40 pt-3">
            <p className="font-mono text-[10px] leading-relaxed text-dim">
              // This ad structure is part of the open-access subvertising network — a worldwide wave of reactionary media reclamation.
              <a href="https://www.publicadcampaign.com/PublicAccess/participate.html" target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-0.5 text-ozone transition-colors hover:text-flare">
                Participate <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </div>
        )}

        {/* Subverted note */}
        {isSubverted && (
          <div className="mt-4 border-t border-slate2/40 pt-3">
            <p className="flex items-start gap-1.5 font-mono text-[10px] leading-relaxed text-flare/70">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              This ad has been subverted — the original corporate message has been replaced or modified by an activist intervention. Documented on the public record.
            </p>
          </div>
        )}

        {/* Link to MediaCorps registry */}
        {loc.ooh_operator && (
          <Link to="/media-corps" className="mt-4 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-dim transition-colors hover:text-ozone">
            <Building2 className="h-3 w-3" /> View Media Corps registry →
          </Link>
        )}
      </div>
    </div>
  );
}