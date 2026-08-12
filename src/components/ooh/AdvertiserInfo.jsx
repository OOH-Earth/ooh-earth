import { Tag, Building2, Flag, Megaphone, Ban } from 'lucide-react';
import { BrandIcon } from '@/components/ooh/BrandBadge';

const SECTOR_LABELS = {
  fossil_fuel: 'Fossil Fuel',
  tobacco: 'Tobacco',
  alcohol: 'Alcohol',
  gambling: 'Gambling',
  ultra_processed_food: 'Ultra-processed Food',
  surveillance: 'Surveillance',
  finance: 'Finance',
  real_estate: 'Real Estate',
  fashion: 'Fashion',
  automotive: 'Automotive',
  pharma: 'Pharma',
  other: 'Other',
};

function Field({ icon: Icon = null, label, value, brand = false }) {
  if (!value) return null;
  return (
    <div className="border border-slate2/40 bg-void/50 px-3 py-2">
      <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
        {Icon && <Icon className="h-2.5 w-2.5" />} {label}
      </div>
      <div className="mt-0.5 flex items-center gap-2">
        {brand && <BrandIcon name={value} size={18} />}
        <span className="font-display text-[13px] font-semibold text-silver">{value}</span>
      </div>
    </div>
  );
}

// Compact advertiser intelligence block — renders inline in the detail page's
// right column. No outer border; the parent container provides visual structure.
export default function AdvertiserInfo({ loc }) {
  const isSubverted = loc.adbust_type && loc.adbust_type !== 'none';
  const hasFields =
    loc.brand_name ||
    loc.campaign_name ||
    loc.ad_agency ||
    loc.parent_corp ||
    loc.ooh_operator ||
    loc.industry_sector;
  const hasHarm =
    (loc.harm_tags && loc.harm_tags.length > 0) ||
    loc.harm_statement ||
    (loc.action_flags && loc.action_flags.length > 0);
  if (!hasFields && !hasHarm) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Section label */}
      <div className="flex items-center gap-2">
        {isSubverted ? (
          <Ban className="h-3.5 w-3.5 text-flare" />
        ) : (
          <Megaphone className="h-3.5 w-3.5 text-ozone" />
        )}
        <span
          className={`font-mono text-[9px] font-bold uppercase tracking-[0.25em] ${isSubverted ? 'text-flare' : 'text-ozone'}`}
        >
          {isSubverted ? '// Subverted' : '// Advertiser'}
        </span>
        {isSubverted && (
          <span className="border border-flare/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">
            {loc.adbust_type.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Advertiser fields */}
      {hasFields && (
        <div className="grid gap-2">
          {loc.brand_name && <Field icon={Tag} label="Brand" value={loc.brand_name} brand />}
          {loc.campaign_name && <Field label="Campaign" value={loc.campaign_name} />}
          {loc.ad_agency && <Field label="Agency" value={loc.ad_agency} brand />}
          {loc.parent_corp && <Field label="Parent" value={loc.parent_corp} brand />}
          {loc.ooh_operator && (
            <Field icon={Building2} label="OOH Operator" value={loc.ooh_operator} brand />
          )}
          {loc.industry_sector && (
            <Field
              label="Sector"
              value={SECTOR_LABELS[loc.industry_sector] || loc.industry_sector}
            />
          )}
        </div>
      )}

      {/* Harm tags */}
      {loc.harm_tags && loc.harm_tags.length > 0 && (
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-flare/60">
            // Harm tags
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {loc.harm_tags.map((tag) => (
              <span
                key={tag}
                className="border border-flare/40 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-flare"
              >
                {tag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Harm statement */}
      {loc.harm_statement && (
        <div className="border-l-2 border-flare/50 pl-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-flare/60">
            // Community statement
          </span>
          <p className="mt-1 text-[13px] leading-relaxed text-silver/85">{loc.harm_statement}</p>
        </div>
      )}

      {/* Action flags */}
      {loc.action_flags && loc.action_flags.length > 0 && (
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone/60">
            // Action flags
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {loc.action_flags.map((flag) => (
              <span
                key={flag}
                className="flex items-center gap-1 border border-ozone/40 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ozone"
              >
                <Flag className="h-2.5 w-2.5" /> {flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
