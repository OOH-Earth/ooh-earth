import { useState } from 'react';
import { usePersistentState } from '@/hooks/usePersistentState';
import { Loader2, Map as MapIcon, Globe, Search, RotateCcw } from 'lucide-react';
import Nav from '@/components/ooh/Nav';
import Globe3D from '@/components/ooh/Globe3D';
import LocationMap from '@/components/ooh/LocationMap';
import PullToRefresh from '@/components/ooh/PullToRefresh';
import { OOH_FUTURES } from '@/components/ooh/map/futures';
import MapStyleSwitcher from '@/components/ooh/map/MapStyleSwitcher';
import { useMapStyle } from '@/lib/mapStyleContext';

// Shared layout for dedicated map portals. Each portal passes its layer config,
// data results, filter tags, and a renderCard function. PortalShell handles the
// Nav, toolbar (search + layout modes), filter tag bar, results sidebar, and
// the flat/globe map toggle.
export default function PortalShell({
  title,
  accent = '#EDFF00',
  activeLayers = [],
  markers = [],
  results = [],
  loading = false,
  renderCard,
  query = '',
  setQuery,
  filterTags = [],
  filterValue = 'all',
  onFilterChange,
  onRefresh = null,
  mapActions = null,
  live = undefined,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [view, setView] = usePersistentState('ooh-portal-view', 'globe');
  const [mode, setMode] = usePersistentState('ooh-portal-mode', 'split');
  const { style: mapStyle } = useMapStyle();

  const cardsClass =
    mode === 'map'
      ? 'hidden'
      : mode === 'list'
        ? 'flex w-full lg:flex-1'
        : 'hidden lg:flex lg:w-[340px]';
  const mapClass = mode === 'list' ? 'hidden' : 'flex-1';

  const resultsContent = (
    <div className="space-y-px">
      {loading ? (
        <div className="p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
          // Loading…
        </div>
      ) : results.length ? (
        results.map((item, i) =>
          renderCard(item, i, { selectedId, setSelectedId, hoverId, setHoverId }),
        )
      ) : (
        <div className="p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
          // No matches
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-void pt-[calc(7rem_+_env(safe-area-inset-top))] md:pt-[calc(8rem_+_env(safe-area-inset-top))] pb-[calc(76px_+_env(safe-area-inset-bottom))] lg:pb-0">
      <Nav />

      {/* Portal header */}
      <div className="flex items-center gap-3 border-b border-slate2/40 px-4 py-2 md:px-8">
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[0.25em]"
          style={{ color: accent }}
        >
          // {title}
        </span>
        {loading && <Loader2 className="h-3 w-3 animate-spin text-dim" />}
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
          {results.length} results
        </span>
        {live !== undefined && (
          <span
            className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-dim"
            title={live ? 'Live public reports' : 'No live reports yet — showing sample locations'}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-ozone animate-flicker' : 'bg-dim'}`}
            />
            {live ? 'live' : 'sample data'}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 border border-slate2 bg-card px-3 py-1.5 sm:flex">
            <Search className="h-3 w-3 text-dim" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-28 bg-transparent font-mono text-[11px] text-silver outline-none placeholder:text-dim lg:w-48"
            />
          </div>
          <button
            onClick={() => {
              setQuery('');
              onFilterChange?.('all');
            }}
            className="flex items-center justify-center border border-slate2 px-2 py-1.5 font-mono text-[9px] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <div className="flex border border-slate2">
            {[
              { v: 'split', label: 'Split' },
              { v: 'map', label: 'Map' },
              { v: 'list', label: 'List' },
            ].map((m) => (
              <button
                key={m.v}
                onClick={() => setMode(m.v)}
                className={`px-2 py-1.5 font-mono text-[9px] font-bold uppercase ${mode === m.v ? 'bg-ozone text-void' : 'text-darkgray hover:text-ozone'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter tags */}
      {filterTags.length > 1 && (
        <div className="atlas-track flex items-center gap-1.5 overflow-x-auto border-b border-slate2/40 px-4 py-1.5 md:px-8">
          {filterTags.map((t) => {
            const active = filterValue === t.value;
            return (
              <button
                key={t.value}
                onClick={() => onFilterChange?.(t.value)}
                className={`flex shrink-0 items-center gap-1.5 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${active ? 'text-void' : 'text-darkgray hover:text-silver'}`}
                style={active ? { backgroundColor: accent } : {}}
              >
                {t.label}
                <span className={`text-[9px] ${active ? 'text-void/70' : 'text-dim'}`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Results sidebar */}
        <div className={`min-h-0 flex-col border-r border-slate2/60 ${cardsClass}`}>
          <div className="flex items-center justify-between border-b border-slate2/60 px-4 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
              // {results.length} results
            </span>
          </div>
          {onRefresh ? (
            <PullToRefresh onRefresh={onRefresh} className="min-h-0 flex-1">
              {resultsContent}
            </PullToRefresh>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">{resultsContent}</div>
          )}
        </div>

        {/* Map */}
        <div className={`relative min-h-0 isolate ${mapClass}`}>
          <div className="absolute left-3 top-3 z-[1000] flex items-center gap-1.5">
            <div className="flex border border-slate2 bg-void/80 backdrop-blur-md">
              <button
                onClick={() => setView('flat')}
                className={`flex items-center gap-1.5 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] ${view === 'flat' ? 'bg-ozone text-void' : 'text-darkgray hover:text-ozone'}`}
              >
                <MapIcon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Flat</span>
              </button>
              <button
                onClick={() => setView('globe')}
                className={`flex items-center gap-1.5 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] ${view === 'globe' ? 'bg-ozone text-void' : 'text-darkgray hover:text-ozone'}`}
              >
                <Globe className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Globe</span>
              </button>
            </div>
            <MapStyleSwitcher />
          </div>
          {view === 'globe' ? (
            <Globe3D
              key={mapStyle.id}
              markers={markers}
              selectedId={selectedId}
              hoverId={hoverId}
              onSelect={setSelectedId}
              activeLayers={activeLayers}
            />
          ) : (
            <LocationMap
              markers={markers}
              selectedId={selectedId}
              hoverId={hoverId}
              onSelect={setSelectedId}
              futures={OOH_FUTURES}
              activeLayers={activeLayers}
            />
          )}
          {mapActions}
        </div>
      </div>
    </div>
  );
}
