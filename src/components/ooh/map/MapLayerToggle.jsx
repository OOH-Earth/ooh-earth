import { Waves, Leaf, Wind, Layers } from "lucide-react";

// Layer toggle chips for the map — toggles environmental research layers
// (rivers, mushrooms, air quality) alongside the advertising spot layer.
export const LAYERS = [
  { id: "ads", label: "Ad Spots", icon: Layers, color: "#EDFF00", defaultOn: true },
  { id: "rivers", label: "Rivers", icon: Waves, color: "#39FF14" },
  { id: "mushrooms", label: "Mushrooms", icon: Leaf, color: "#FF5C00" },
  { id: "air", label: "Air Quality", icon: Wind, color: "#1F51FF" },
];

export default function MapLayerToggle({ activeLayers, onToggle }) {
  return (
    <div className="atlas-track flex items-center gap-1.5 overflow-x-auto px-5 pb-2 md:px-8">
      <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.25em] text-dim">Layers</span>
      {LAYERS.map((l) => {
        const Icon = l.icon;
        const active = activeLayers.includes(l.id);
        return (
          <button
            key={l.id}
            onClick={() => onToggle(l.id)}
            className={`flex shrink-0 items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] transition-colors ${
              active
                ? "border-ozone bg-ozone text-void"
                : "border-slate2/60 text-darkgray hover:border-ozone hover:text-ozone"
            }`}
          >
            <Icon className="h-3 w-3" style={{ color: active ? undefined : l.color }} />
            {l.label}
          </button>
        );
      })}
    </div>
  );
}