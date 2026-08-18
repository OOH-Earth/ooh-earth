import {
  Ban,
  SprayCan,
  Palette,
  Leaf,
  Sprout,
  AlertTriangle,
  Waves,
  Radio,
  Flame,
} from 'lucide-react';

// Layer groups — ordered by campaign priority.
// STREET     → Adbusting, Graffiti, Ad Spots & Art (base marker layer)
// ECOLOGY    → Mushrooms, Flora
// RIVERS     → Hydrology & Pollution tracking
// WAR        → War Zones (conflict alerts)
// RADIO      → Live Signals
//
// "adbusting" and "graffiti" are filtered views of the Location entity:
//   adbusting = locations with adbust_type !== "none"
//   graffiti  = locations with graffiti_medium set, or type painted/mural/sticker
// They share the same map markers as "ads" but filter the results panel.
export const LAYER_GROUPS = [
  {
    id: 'street',
    label: 'Street',
    color: '#EDFF00',
    layers: [
      { id: 'adbusting', label: 'Adbusting', icon: Ban, color: '#FF5C00' },
      { id: 'graffiti', label: 'Graffiti', icon: SprayCan, color: '#FF5C00' },
      { id: 'ads', label: 'Ad Spots & Art', icon: Palette, color: '#EDFF00', defaultOn: true },
    ],
  },
  {
    id: 'intel',
    label: 'Intelligence',
    color: '#EDFF00',
    layers: [{ id: 'heat', label: 'Activity Heat', icon: Flame, color: '#FF5C00' }],
  },
  {
    id: 'ecology',
    label: 'Ecology',
    color: '#39FF14',
    layers: [
      { id: 'mushrooms', label: 'Mushrooms', icon: Leaf, color: '#FF5C00' },
      { id: 'flora', label: 'Flora', icon: Sprout, color: '#39FF14' },
    ],
  },
  {
    id: 'rivers',
    label: 'Rivers Spec',
    color: '#1F51FF',
    layers: [{ id: 'rivers', label: 'Hydrology', icon: Waves, color: '#39FF14' }],
  },
  {
    id: 'war',
    label: 'War Zones',
    color: '#FF0040',
    layers: [{ id: 'war', label: 'Conflict Alerts', icon: AlertTriangle, color: '#FF0040' }],
  },
  {
    id: 'radio',
    label: 'Radio',
    color: '#EDFF00',
    layers: [{ id: 'radio', label: 'Live Signals', icon: Radio, color: '#EDFF00' }],
  },
];

// Flat list of all layer definitions (for quick lookup)
export const ALL_LAYERS = LAYER_GROUPS.flatMap((g) => g.layers);

// Default active layer IDs
export const DEFAULT_LAYERS = ALL_LAYERS.filter((l) => l.defaultOn).map((l) => l.id);

export default function MapLayerToggle({ activeLayers, onToggle }) {
  return (
    <div className="atlas-track flex items-center gap-1 overflow-x-auto border-b border-slate2/40 px-5 py-2 md:px-8">
      <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.25em] text-dim">
        Layers
      </span>
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
                    ? 'border-ozone bg-ozone text-void'
                    : 'border-slate2/60 text-darkgray hover:border-ozone hover:text-ozone'
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
