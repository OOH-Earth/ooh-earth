import { MapPin, Leaf, Sprout, AlertTriangle, Droplets } from "lucide-react";
import { POLLUTION_META } from "./layers/riverData";

const LAYER_META = {
  mushrooms: { label: "Mushroom Index", accent: "#FF5C00", Icon: Leaf },
  flora: { label: "Flora Index", accent: "#39FF14", Icon: Sprout },
  war: { label: "Conflict Zone", accent: "#FF0040", Icon: AlertTriangle },
  rivers: { label: "Hydrology", accent: "#1F51FF", Icon: Droplets },
};

// Generic result card for non-ad map layers (mushrooms, flora, war, rivers).
// Ad spots use LocationCard which has richer entity-backed interactions.
export default function LayerResultCard({ item, layer }) {
  const { Icon, accent, label } = LAYER_META[layer] || LAYER_META.mushrooms;

  const title = layer === "war" ? item.title : layer === "rivers" ? item.name : item.region || "Unknown";
  const subtitle = layer === "war" ? item.region : layer === "rivers" ? item.river : item.species;
  const note = layer === "war" ? item.advisory : layer === "rivers" ? item.notes : item.note;

  let tag = null;
  let tagColor = accent;
  if (layer === "war") {
    const critical = item.severity === "critical";
    tag = critical ? "Critical" : "Advisory";
    tagColor = critical ? "#FF0040" : "#FF5C00";
  } else if (layer === "rivers") {
    const pm = POLLUTION_META[item.pollution];
    tag = pm?.label;
    tagColor = pm?.color || "#B2B2B2";
  } else if (layer === "mushrooms" && item.habitat) {
    tag = item.habitat;
  } else if (layer === "flora" && item.ecosystem) {
    tag = item.ecosystem;
  }

  return (
    <div
      className="group flex w-full gap-3 border-b border-slate2/40 p-3 text-left transition-colors hover:bg-card"
      style={{ borderLeft: "2px solid transparent" }}
    >
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center border border-slate2/40 grid-bg" style={{ backgroundColor: "#0a0a0a" }}>
        <Icon className="h-5 w-5" style={{ color: accent }} strokeWidth={1.5} />
        <span className="absolute left-0 top-0 h-2 w-2 border-l border-t" style={{ borderColor: `${accent}99` }} />
        <span className="absolute right-0 top-0 h-2 w-2 border-r border-t" style={{ borderColor: `${accent}99` }} />
        <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l" style={{ borderColor: `${accent}99` }} />
        <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r" style={{ borderColor: `${accent}99` }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: accent }}>{label}</span>
          {tag && (
            <span className="ml-auto border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em]" style={{ color: tagColor, borderColor: `${tagColor}60` }}>
              {tag}
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate font-display text-sm font-semibold leading-tight text-silver">{title}</div>
        {subtitle && <div className="mt-0.5 truncate font-mono text-[10px] italic text-dim">{subtitle}</div>}
        {layer === "rivers" && (
          <div className="mt-1 flex gap-3 font-mono text-[9px]">
            <span className="text-dim">WQI <span className="font-bold" style={{ color: POLLUTION_META[item.pollution]?.color }}>{item.wqi}</span></span>
            <span className="text-dim">pH <span className="text-silver">{item.ph}</span></span>
            <span className="text-dim">NTU <span className="text-silver">{item.turbidity}</span></span>
          </div>
        )}
        {note && (
          <div className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-darkgray">{note}</div>
        )}
        <div className="mt-0.5 flex items-center gap-1 font-mono text-[9px] text-dim/70">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          {Number(item.lat).toFixed(3)}, {Number(item.lng).toFixed(3)}
        </div>
      </div>
    </div>
  );
}