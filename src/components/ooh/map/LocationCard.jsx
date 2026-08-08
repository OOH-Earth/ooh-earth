import { MapPin, Hand } from "lucide-react";
import { Link } from "react-router-dom";
import LocationThumb, { metaFor } from "@/components/ooh/map/LocationThumb";
import { BrandIcon } from "@/components/ooh/BrandBadge";

// Terminal reticle corner brackets — wraps a child box with four L-shaped marks.
function Reticle({ children, className = "" }) {
  const corner = "absolute h-2 w-2 border-ozone/70";
  return (
    <div className={`relative ${className}`}>
      {children}
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
    </div>
  );
}

export default function LocationCard({ m, selected, onSelect, onHover, onHoverEnd, claim, onClaim }) {
  const isLead = !m.image && m.status !== "verified";
  const dotColor = m.status === "verified" ? "#39FF14" : "#FF5C00";

  return (
    <div
      onClick={() => onSelect(m)}
      onMouseEnter={() => onHover?.(m)}
      onMouseLeave={() => onHoverEnd?.()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(m); } }}
      className={`group flex w-full cursor-pointer gap-3 border-b border-slate2/40 p-3 text-left transition-colors hover:bg-card ${
        selected ? "bg-card" : ""
      }`}
      style={{ borderLeft: selected ? "2px solid #EDFF00" : "2px solid transparent" }}
    >
      {/* Thumbnail with reticle corners */}
      <Reticle className="shrink-0">
        <LocationThumb m={m} className="h-14 w-20 border border-slate2/40 transition-transform duration-300 group-hover:scale-[1.06]" />
      </Reticle>

      <div className="min-w-0 flex-1">
        {/* Category label + status dot */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ozone">{metaFor(m.type).label}</span>
          <span className="h-1 w-1 rounded-full" style={{ backgroundColor: dotColor }} />
          {m.adbust_type && m.adbust_type !== "none" && (
            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-flare">// busted</span>
          )}
          {isLead && !claim && (
            <button
              onClick={(e) => { e.stopPropagation(); onClaim?.(m); }}
              className="ml-auto flex items-center gap-1 border border-flare/60 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-flare transition-colors hover:bg-flare hover:text-void"
            >
              <Hand className="h-3 w-3" /> Claim
            </button>
          )}
          {claim && (
            <span className="ml-auto flex items-center gap-1 border border-ozone/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-ozone">
              @{claim.operative_handle}
            </span>
          )}
        </div>

        {/* Title — brand logo + title */}
        <div className="mt-0.5 flex items-center gap-1.5">
          {m.brand_name && <BrandIcon name={m.brand_name} size={14} />}
          <span className="truncate font-mono text-[13px] font-bold leading-tight text-silver">{m.title}</span>
        </div>

        {/* Brand / campaign sub-line */}
        {m.brand_name && (
          <div className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
            {m.brand_name}{m.campaign_name ? ` · ${m.campaign_name}` : ""}
          </div>
        )}

        {/* Address */}
        <div className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-dim">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{m.address || `${m.lat?.toFixed(3)}, ${m.lng?.toFixed(3)}`}</span>
        </div>

        {/* Harm tags — compact terminal chips */}
        {m.harm_tags && m.harm_tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {m.harm_tags.slice(0, 3).map((tag) => (
              <span key={tag} className="border border-flare/30 px-1 py-0.5 font-mono text-[7px] uppercase tracking-[0.1em] text-flare/80">
                {tag.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        {claim && (
          <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.15em] text-ozone/70">// claimed · {claim.status}</div>
        )}
      </div>

      {/* PAGE → always visible on the right */}
      <Link
        to={`/location/${m.id}`}
        state={m}
        onClick={(e) => e.stopPropagation()}
        className="hidden shrink-0 items-center self-center font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:text-flare sm:inline-flex"
      >
        Page <span className="ml-0.5">→</span>
      </Link>
    </div>
  );
}