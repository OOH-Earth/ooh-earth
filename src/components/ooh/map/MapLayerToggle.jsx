import { Waves, Leaf, Sprout, AlertTriangle, Palette } from "lucide-react";

// Layer groups — four research categories, each with sub-layer toggles.
// ECOLOGY    → Mushrooms, Flora
// VISUAL     → Ad Spots & Art (base marker layer)
// WAR        → War Zones (conflict alerts)
// RIVERS     → Hydrology & Pollution tracking
export const LAYER_GROUPS = [
  {
    id: "ecology",
    label: "Ecology",
    color: "#39FF14",
    layers: [
      { id: "mushrooms", label: "Mushrooms", icon: Leaf, color: "#FF5C00" },
      { id: "flora", label: "Flora", icon: Sprout, color: "#39FF14" },
    ],
  },
  {
    id: "visual",
    label: "Visual Realm",
    color: "#EDFF00",
    layers: [
      { id: "ads", label: "Ad Spots & Art", icon: Palette, color: "#EDFF00", defaultOn: true },
    ],
  },
  {
    id: "war",
    label: "War Zones",
    color: "#FF0040",
    layers: [
      { id: "war", label: "Conflict Alerts", icon: AlertTriangle, color: "#FF0040" },
    ],
  },
  {
    id: "rivers",
    label: "Rivers Spec",
    color: "#1F51FF",
    layers: [
      { id: "rivers", label: "Hydrology", icon: Waves, color: "#39FF14" },
    ],
  },
];

// Flat list of all layer definitions (for quick lookup)
export const ALL_LAYERS = LAYER_GROUPS.flatMap((g) => g.layers);

// Default active layer IDs
export const DEFAULT_LAYERS = ALL_LAYERS.filter((l) => l.defaultOn).map((l) => l.id);

export default function MapLayerToggle({ activeLayers, onToggle }) {
  return (
    <div className="atlas-track flex items-center gap-1 overflow-x-auto border-b border-slate2/40 px-5 py-2 md:px-8">
      <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.25em] text-dim">Layers</span>
      {LAYER_GROUPS.map((group, gi) => (
        <div key={group.id} className="flex shrink-0 items-center gap-1.5">
          {gi > 0 && <span className="h-4 w-px bg-slate2/40" />}
          <span
            className="shrink-0 font-mono text-[7px] font-bold uppercase tracking-[0.2em]"
            style={{ color: group.color }}
          >
            {group.label}
          </span>
          {group.layers.map((l) => {
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
      ))}
    </div>
  );
}