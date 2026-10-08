import { useCallback, useMemo, useState } from 'react';
import { Leaf } from 'lucide-react';
import PortalShell from '@/components/ooh/map/PortalShell';
import EnvironmentMap from '@/components/ooh/environment/EnvironmentMap';
import ConditionsCard from '@/components/ooh/environment/ConditionsCard';
import { ENVIRONMENT_LAYERS } from '@/components/ooh/environment/environmentLayers';
import {
  OBS_GROUPS,
  OBS_MIN_ZOOM,
  RECENT_DAYS,
  describeAge,
  useObservations,
} from '@/components/ooh/environment/useObservations';

// Ecology: reference geography (water, natural cover, protected areas) and real, dated community
// observations from iNaturalist, each labelled by what kind of data it is. Replaces the previous
// LLM-generated "hotspots", which were neither observations nor verifiable.
const REFERENCE_IDS = ['waterways', 'water', 'habitat', 'protected'];
const ACCENT = '#39FF14';

function ObservationCard({ item, selected, onSelect }) {
  const color = OBS_GROUPS[item.group].color;
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
      className={`group flex w-full cursor-pointer gap-3 border-b border-slate2/40 p-3 text-left transition-colors hover:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ozone ${selected ? 'bg-card' : ''}`}
      style={{ borderLeft: selected ? `2px solid ${color}` : '2px solid transparent' }}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-slate2/40 bg-[#0a0a0a]">
        <Leaf className="h-5 w-5" style={{ color }} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color }}>
            {OBS_GROUPS[item.group].label}
          </span>
          <span className="ml-auto border border-slate2 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-darkgray">
            Recent observation
          </span>
        </div>
        <div className="mt-0.5 truncate font-display text-sm font-semibold text-silver">
          {item.name}
        </div>
        <div className="truncate font-mono text-[10px] italic text-dim">{item.scientific}</div>
        <div className="mt-0.5 font-mono text-[9px] text-darkgray">
          {item.observedOn ? describeAge(item.observedOn) : 'Unknown date'} · iNaturalist
        </div>
      </div>
    </div>
  );
}

export default function EcologyPortal() {
  const [query, setQuery] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [enabledRef, setEnabledRef] = useState(['waterways', 'water', 'habitat', 'protected']);
  const [enabledObs, setEnabledObs] = useState(['plants', 'fungi', 'animals']);
  const [viewport, setViewport] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const [moving, setMoving] = useState(false);
  const onMoveStart = useCallback(() => setMoving(true), []);
  const onViewportChange = useCallback((v) => {
    setViewport(v);
    setMoving(false);
  }, []);
  const obs = useObservations(viewport, enabledObs, moving);

  const toggle = (list, setList, id) =>
    setList((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const obsNote = (group) => {
    if (!enabledObs.includes(group)) return null;
    if (obs.status === 'zoom') return `Zoom in to load observations (from zoom ${OBS_MIN_ZOOM}).`;
    if (obs.status === 'loading') return 'Loading observations…';
    if (obs.status === 'error') return 'iNaturalist is unavailable right now. Try again shortly.';
    if (obs.status !== 'ready') return null;
    const mine = obs.points.filter((p) => p.group === group);
    if (!mine.length) {
      return `No research-grade observations in the last ${RECENT_DAYS} days in view. That is not evidence that nothing lives here.`;
    }
    const newest = mine
      .map((p) => p.observedOn)
      .filter(Boolean)
      .sort()
      .pop();
    return `Showing the latest ${mine.length} of ${obs.totals[group] ?? mine.length} in view. Newest: ${newest ? describeAge(newest) : 'unknown'}.`;
  };

  const layerToggles = [
    ...REFERENCE_IDS.map((id) => ({
      id,
      label: ENVIRONMENT_LAYERS[id].label,
      swatch: ENVIRONMENT_LAYERS[id].swatch,
      trust: 'reference',
      description: ENVIRONMENT_LAYERS[id].description,
      active: enabledRef.includes(id),
      onToggle: () => toggle(enabledRef, setEnabledRef, id),
    })),
    ...Object.values(OBS_GROUPS).map((g) => ({
      id: `obs-${g.id}`,
      label: `${g.label} observations`,
      swatch: g.color,
      trust: 'recent',
      description: `Research-grade community records from iNaturalist, last ${RECENT_DAYS} days.`,
      note: obsNote(g.id),
      active: enabledObs.includes(g.id),
      onToggle: () => toggle(enabledObs, setEnabledObs, g.id),
    })),
  ];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return obs.points.filter(
      (p) =>
        (filterValue === 'all' || p.group === filterValue) &&
        (!q || `${p.name} ${p.scientific}`.toLowerCase().includes(q)),
    );
  }, [obs.points, filterValue, query]);

  const filterTags = useMemo(
    () => [
      { value: 'all', label: 'All', count: obs.points.length },
      ...Object.values(OBS_GROUPS).map((g) => ({
        value: g.id,
        label: g.label,
        count: obs.points.filter((p) => p.group === g.id).length,
      })),
    ],
    [obs.points],
  );

  const referencePoints = useMemo(
    () =>
      results.map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        label: p.name,
        subtitle: OBS_GROUPS[p.group].label,
        color: OBS_GROUPS[p.group].color,
        trust: 'recent',
        trustNote: 'dated community observation',
        rows: [
          { label: 'Observed', value: p.observedOn ? describeAge(p.observedOn) : 'Unknown' },
          { label: 'Scientific', value: p.scientific },
          { label: 'Quality', value: 'Research grade (community verified)' },
          { label: 'Source', value: 'iNaturalist' },
          {
            label: 'Position accuracy',
            value:
              p.accuracy === null
                ? 'Unknown; not an exact location'
                : `±${p.accuracy} m (provider reported)`,
          },
          { label: 'Retrieved', value: p.retrievedAt },
          ...(p.license ? [{ label: 'Licence', value: String(p.license).toUpperCase() }] : []),
          ...(p.uri ? [{ label: 'Record', value: 'View on iNaturalist', href: p.uri }] : []),
        ],
      })),
    [results],
  );

  const mapMarkers = useMemo(
    () => results.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng })),
    [results],
  );

  return (
    <PortalShell
      title="Ecology"
      accent={ACCENT}
      activeLayers={[]}
      markers={mapMarkers}
      results={results}
      loading={obs.status === 'loading'}
      query={query}
      setQuery={setQuery}
      filterTags={filterTags}
      filterValue={filterValue}
      onFilterChange={setFilterValue}
      renderCard={(item) => (
        <ObservationCard
          key={item.id}
          item={item}
          selected={selectedId === item.id}
          onSelect={(it) => setSelectedId(it.id)}
        />
      )}
      renderMap={({ view, mapStyle }) => (
        <EnvironmentMap
          key={`${mapStyle.id}-${view}`}
          projection={view === 'globe' ? 'globe' : 'mercator'}
          layers={enabledRef}
          layerToggles={layerToggles}
          referencePoints={referencePoints}
          selectedPointId={selectedId}
          onSelectPoint={setSelectedId}
          onViewportChange={onViewportChange}
          onMoveStart={onMoveStart}
          keepZoomOnSelect
          noun="Ecology"
          inspectNoun="feature"
          unitNoun="feature"
          initialView={{ center: [100.5, 13.75], zoom: view === 'globe' ? 1.8 : 2 }}
        >
          <div
            className="absolute left-3 top-28 z-[900] max-w-[calc(100%-5rem)] border border-slate2 bg-void/90 px-2 py-1 text-[11px] text-silver"
            role="status"
            data-testid="ecology-guidance"
          >
            {obs.status === 'zoom'
              ? 'Zoom in to see plants, fungi and animals. Records load from zoom 6.'
              : obs.status === 'loading'
                ? 'Loading dated community observations…'
                : obs.status === 'error'
                  ? 'Observation provider unavailable. Reference geography is separate.'
                  : obs.status === 'ready'
                    ? `${obs.points.length} dated observations in view. Not a wildlife census.`
                    : 'Community observations load after the map settles.'}
            {obs.note && <p>{obs.note}</p>}
          </div>
          <ConditionsCard center={viewport?.center} />
        </EnvironmentMap>
      )}
    />
  );
}
