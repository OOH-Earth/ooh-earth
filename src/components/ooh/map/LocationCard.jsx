import { MapPin, Hand } from "lucide-react";
import LocationThumb, { metaFor } from "@/components/ooh/map/LocationThumb";

export default function LocationCard({ m, selected, onSelect, claim, onClaim }) {
  const isLead = !m.image && m.status !== "verified";
  return (
    <div
      onClick={() => onSelect(m)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(m); } }}
      className={`flex w-full cursor-pointer gap-3 border-b border-slate2/40 p-3 text-left transition-colors hover:bg-card ${
        selected ? "bg-card" : ""
      }`}
      style={selected ? { borderLeft: "2px solid #EDFF00" } : undefined}
    >
      <LocationThumb m={m} className="h-14 w-20 border border-slate2/40" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ozone">{metaFor(m.type).label}</span>
          <span
            className="h-1 w-1 rounded-full"
            style={{ backgroundColor: m.status === "verified" ? "#39FF14" : "#FF5C00" }}
          />
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
        <div className="mt-0.5 truncate font-display text-sm font-semibold leading-tight text-silver">{m.title}</div>
        <div className="mt-0.5 flex items-center gap-1 truncate font-mono text-[10px] text-dim">
          <MapPin className="h-3 w-3 shrink-0" />
          {m.address || `${m.lat?.toFixed(3)}, ${m.lng?.toFixed(3)}`}
        </div>
        {claim && (
          <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.15em] text-ozone/70">// claimed · {claim.status}</div>
        )}
      </div>
    </div>
  );
}