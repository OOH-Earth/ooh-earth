import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import PortalShell from '@/components/ooh/map/PortalShell';
import LayerResultCard from '@/components/ooh/map/LayerResultCard';
import EnvironmentMap from '@/components/ooh/environment/EnvironmentMap';
import StationStatus from '@/components/ooh/environment/StationStatus';
import { useHydroStations } from '@/components/ooh/environment/useHydroStations';
import {
  FRESHNESS_COLOR,
  stationPointId,
  stationToPoint,
} from '@/components/ooh/environment/stationPresentation';
import { FRESHNESS_LABELS, formatAge } from '@/lib/hydro/freshness';
import { PROVIDERS, headlineMeasurement } from '@/lib/hydro/normalize';
import { fetchUsgsSite } from '@/lib/hydro/hydroApi';
import {
  VISIBLE_RIVER_SOURCES,
  POLLUTION_META,
  LEGACY_SAMPLE_NOTE,
} from '@/components/ooh/map/layers/riverData';

// Rivers: the real river network (OpenStreetMap waterways, loaded progressively by zoom from the
// vector tiles the app's base maps already use), OBSERVED stations (USGS, UK Environment Agency)
// that appear when zoomed in, and a small set of legacy DEMO samples. Reference geography, observed
// readings and demo samples are different things and are labelled as such everywhere.
const RIVER_LAYERS = ['waterways'];
const REFERENCE_LEGEND = {
  label: 'Legacy demo samples',
  trust: 'legacy',
  description:
    'Hand-authored examples with unknown provenance. Not observations and not authoritative locations. Observed stations are separate.',
};

function StationCard({ item, selected, onSelect }) {
  const head = headlineMeasurement(item.station);
  const color = FRESHNESS_COLOR[head?.freshness || 'none'];
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className={`flex w-full cursor-pointer gap-3 border-b border-slate2/40 p-3 text-left transition-colors hover:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ozone ${selected ? 'bg-card' : ''}`}
      style={{ borderLeft: selected ? `2px solid ${color}` : '2px solid transparent' }}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-slate2/40 bg-[#0a0a0a]">
        <Activity className="h-5 w-5" style={{ color }} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color }}>
            {PROVIDERS[item.station.provider].name}
          </span>
          <span className="ml-auto border border-slate2 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-darkgray">
            Observed
          </span>
        </div>
        <div className="mt-0.5 truncate font-display text-sm font-semibold text-silver">
          {item.label}
        </div>
        <div className="truncate font-mono text-[10px] text-dim">
          {item.station.waterbody || 'Waterbody not named by provider'}
        </div>
        <div className="mt-0.5 font-mono text-[9px] text-darkgray">
          {head && head.value !== null
            ? `${head.label}: ${head.value} ${head.unit || ''} · ${FRESHNESS_LABELS[head.freshness]}, ${formatAge(head.ageMs)}`
            : 'No recent observation'}
        </div>
      </div>
    </div>
  );
}

export default function RiversPortal() {
  const [query, setQuery] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [selectedName, setSelectedName] = useState(null);
  const [viewport, setViewport] = useState(null);
  const [siteNames, setSiteNames] = useState(() => new Map());
  const onViewportChange = useCallback((v) => {
    setViewport(v);
    setMoving(false);
  }, []);
  const [moving, setMoving] = useState(false);
  const onMoveStart = useCallback(() => setMoving(true), []);
  const hydro = useHydroStations(viewport, true, moving);

  // USGS names are loaded for the ONE selected station, not in bulk.
  useEffect(() => {
    const st = hydro.stations.find((x) => stationPointId(x) === selectedName);
    if (!st || st.provider !== 'usgs' || siteNames.has(st.stationId)) return undefined;
    const ctl = new AbortController();
    fetchUsgsSite(st.stationId, { signal: ctl.signal })
      .then((site) => setSiteNames((m) => new Map(m).set(st.stationId, site)))
      .catch(() => {});
    return () => ctl.abort();
  }, [selectedName, hydro.stations, siteNames]);

  const filterTags = useMemo(() => {
    return [
      { value: 'all', label: 'All', count: hydro.stations.length + VISIBLE_RIVER_SOURCES.length },
      { value: 'observed', label: 'Observed stations', count: hydro.stations.length },
      { value: 'legacy', label: 'Demo / legacy', count: VISIBLE_RIVER_SOURCES.length },
    ];
  }, [hydro.stations.length]);

  /** @type {any[]} */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const RANK = { current: 0, recent: 1, stale: 2, none: 3 };
    const stations =
      filterValue === 'legacy'
        ? []
        : hydro.stations
            .map((st) => stationToPoint(st, siteNames))
            .filter(
              (p) => !q || `${p.label} ${p.station.waterbody || ''}`.toLowerCase().includes(q),
            )
            .sort(
              (a, b) =>
                RANK[headlineMeasurement(a.station)?.freshness || 'none'] -
                RANK[headlineMeasurement(b.station)?.freshness || 'none'],
            )
            .slice(0, 60)
            .map((p) => ({ ...p, kind: 'station' }));
    const legacy =
      filterValue === 'observed'
        ? []
        : VISIBLE_RIVER_SOURCES.filter(
            (s) => !q || `${s.name} ${s.river} ${s.notes}`.toLowerCase().includes(q),
          );
    return [...stations, ...legacy];
  }, [filterValue, query, hydro.stations, siteNames]);

  const referencePoints = useMemo(
    () =>
      results.map((s) =>
        s.kind === 'station'
          ? s
          : {
              id: s.name,
              lat: s.lat,
              lng: s.lng,
              label: s.name,
              subtitle: s.river,
              color: POLLUTION_META[s.pollution]?.color,
              trust: 'legacy',
              trustNote: LEGACY_SAMPLE_NOTE,
              rows: [
                { label: 'Legacy class', value: POLLUTION_META[s.pollution]?.label || 'Unknown' },
                { label: 'WQI', value: s.wqi ?? 'Unknown' },
                { label: 'pH', value: s.ph ?? 'Unknown' },
                {
                  label: 'Turbidity',
                  value: s.turbidity != null ? `${s.turbidity} NTU` : 'Unknown',
                },
                { label: 'Note', value: s.notes || 'None' },
              ],
            },
      ),
    [results],
  );
  // PortalShell markers are only used for fit-bounds on its default maps.
  const mapMarkers = useMemo(
    () =>
      results.map((s) => ({
        id: s.id || s.name,
        lat: s.lat ?? s.latitude,
        lng: s.lng ?? s.longitude,
      })),
    [results],
  );

  return (
    <PortalShell
      title="Rivers · Hydrology"
      accent="#1F51FF"
      activeLayers={['rivers']}
      markers={mapMarkers}
      results={results}
      loading={false}
      query={query}
      setQuery={setQuery}
      filterTags={filterTags}
      filterValue={filterValue}
      onFilterChange={setFilterValue}
      renderCard={(item, i) =>
        item.kind === 'station' ? (
          <StationCard
            key={item.id}
            item={item}
            selected={selectedName === item.id}
            onSelect={(it) => setSelectedName(it.id)}
          />
        ) : (
          <LayerResultCard
            key={`riv-${i}`}
            item={item}
            layer="rivers"
            selected={selectedName === item.name}
            onSelect={(it) => setSelectedName(it.name)}
          />
        )
      }
      renderMap={({ view, mapStyle }) => (
        <EnvironmentMap
          key={`${mapStyle.id}-${view}`}
          projection={view === 'globe' ? 'globe' : 'mercator'}
          layers={RIVER_LAYERS}
          referencePoints={referencePoints}
          referenceLegend={REFERENCE_LEGEND}
          selectedPointId={selectedName}
          onSelectPoint={setSelectedName}
          onViewportChange={onViewportChange}
          onMoveStart={onMoveStart}
          keepZoomOnSelect
          noun="River"
          initialView={{ center: [15, 28], zoom: view === 'globe' ? 1.6 : 1.9 }}
        >
          <StationStatus state={hydro} />
        </EnvironmentMap>
      )}
    />
  );
}
