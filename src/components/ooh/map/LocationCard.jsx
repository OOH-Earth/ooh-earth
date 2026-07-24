import { MapPin } from "lucide-react";
import LocationThumb, { metaFor } from "@/components/ooh/map/LocationThumb";

export default function LocationCard({ m, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(m)}
      className={`flex w-full gap-3 border-b border-slate2/40 p-3 text-left transition-colors hover:bg-card ${
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
        </div>
        <div className="mt-0.5 truncate font-display text-sm font-semibold leading-tight text-silver">{m.title}</div>
        <div className="mt-0.5 flex items-center gap-1 truncate font-mono text-[10px] text-dim">
          <MapPin className="h-3 w-3 shrink-0" />
          {m.address || `${m.lat?.toFixed(3)}, ${m.lng?.toFixed(3)}`}
        </div>
      </div>
    </button>
  );
}