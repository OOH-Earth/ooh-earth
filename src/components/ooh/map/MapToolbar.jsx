import { Columns, Map as MapIcon, List } from 'lucide-react';
import CryptoTicker from '@/components/ooh/CryptoTicker';
import DynamicFilterBar from '@/components/ooh/map/DynamicFilterBar';

export const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'billboard', label: 'Billboard' },
  { value: 'digital', label: 'Digital' },
  { value: 'painted', label: 'Painted' },
  { value: 'transit', label: 'Transit' },
  { value: 'projection', label: 'Projection' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'mural', label: 'Mural' },
  { value: 'other', label: 'Other' },
];

const MODES = [
  { value: 'split', label: 'Split', icon: Columns },
  { value: 'map', label: 'Map', icon: MapIcon },
  { value: 'list', label: 'List', icon: List },
];

export default function MapToolbar({
  typeFilter,
  setTypeFilter,
  mode,
  setMode,
  count,
  live,
  counts = {},
  total = 0,
  activeLayers = ['ads'],
  primaryLayer,
  layerFilter,
  setLayerFilter,
}) {
  return (
    <div className="shrink-0 border-b border-slate2/60 bg-void/90 backdrop-blur-md">
      <CryptoTicker />
      <div className="flex items-center gap-3 px-5 py-2.5 md:px-8">
        <span className="font-display text-sm font-black uppercase tracking-[0.25em] text-silver">
          OOH MAP
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
          <span
            className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-ozone animate-flicker' : 'bg-dim'}`}
          />
          {live ? 'live' : 'snapshot'} · {count}
        </span>
        <div data-tour="layout" className="ml-auto flex items-center border border-slate2/60">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                title={m.label}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 transition-colors ${mode === m.value ? 'bg-ozone text-void' : 'text-darkgray hover:text-ozone'}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden font-mono text-[9px] font-bold uppercase tracking-[0.15em] sm:inline">
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <DynamicFilterBar
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        counts={counts}
        total={total}
        primaryLayer={primaryLayer}
        layerFilter={layerFilter}
        setLayerFilter={setLayerFilter}
      />
    </div>
  );
}
