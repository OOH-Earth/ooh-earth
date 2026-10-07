import { useMemo, useState } from 'react';
import PortalShell from '@/components/ooh/map/PortalShell';
import LayerResultCard from '@/components/ooh/map/LayerResultCard';
import EnvironmentMap from '@/components/ooh/environment/EnvironmentMap';
import { RIVER_SOURCES, POLLUTION_META } from '@/components/ooh/map/layers/riverData';

// Rivers: the real river network (OpenStreetMap waterways, loaded progressively by zoom from the
// vector tiles the app's base maps already use) plus a small set of ILLUSTRATIVE reference sample
// points. The sample values are static context, never live readings, and are labelled as such.
const RIVER_LAYERS = ['waterways'];
const REFERENCE_LEGEND = {
  label: 'Reference sample points',
  trust: 'illustrative',
  description: 'Hand-collected examples with sample values. Not live readings.',
};

export default function RiversPortal() {
  const [query, setQuery] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [selectedName, setSelectedName] = useState(null);

  const filterTags = useMemo(() => {
    const tally = {};
    RIVER_SOURCES.forEach((s) => {
      tally[s.pollution] = (tally[s.pollution] || 0) + 1;
    });
    return [
      { value: 'all', label: 'All', count: RIVER_SOURCES.length },
      ...Object.keys(POLLUTION_META)
        .map((key) => ({ value: key, label: POLLUTION_META[key].label, count: tally[key] || 0 }))
        .filter((t) => t.count > 0),
    ];
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RIVER_SOURCES.filter(
      (s) =>
        (filterValue === 'all' || s.pollution === filterValue) &&
        (!q || `${s.name} ${s.river} ${s.notes}`.toLowerCase().includes(q)),
    );
  }, [filterValue, query]);

  const referencePoints = useMemo(
    () =>
      results.map((s) => ({
        id: s.name,
        lat: s.lat,
        lng: s.lng,
        label: s.name,
        subtitle: s.river,
        color: POLLUTION_META[s.pollution]?.color,
        trust: 'illustrative',
        trustNote: 'sample values, not a live reading',
        rows: [
          { label: 'Class', value: POLLUTION_META[s.pollution]?.label || 'Unknown' },
          { label: 'WQI', value: s.wqi ?? 'Unknown' },
          { label: 'pH', value: s.ph ?? 'Unknown' },
          { label: 'Turbidity', value: s.turbidity != null ? `${s.turbidity} NTU` : 'Unknown' },
          { label: 'Note', value: s.notes || 'None' },
        ],
      })),
    [results],
  );
  // PortalShell markers are only used for fit-bounds on its default maps.
  const mapMarkers = useMemo(
    () => results.map((s) => ({ id: s.name, lat: s.lat, lng: s.lng })),
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
      live={false}
      renderCard={(item, i) => (
        <LayerResultCard
          key={`riv-${i}`}
          item={item}
          layer="rivers"
          selected={selectedName === item.name}
          onSelect={(it) => setSelectedName(it.name)}
        />
      )}
      renderMap={({ view, mapStyle }) => (
        <EnvironmentMap
          key={`${mapStyle.id}-${view}`}
          projection={view === 'globe' ? 'globe' : 'mercator'}
          layers={RIVER_LAYERS}
          referencePoints={referencePoints}
          referenceLegend={REFERENCE_LEGEND}
          selectedPointId={selectedName}
          onSelectPoint={setSelectedName}
          noun="River"
          initialView={{ center: [15, 28], zoom: view === 'globe' ? 1.6 : 1.9 }}
        />
      )}
    />
  );
}
