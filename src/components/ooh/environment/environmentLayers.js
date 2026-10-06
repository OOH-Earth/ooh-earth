// Environment map layer registry.
//
// Reference geography comes from the SAME vector tile source the app's MapLibre base styles
// already load (CARTO carto.streets, OpenMapTiles schema, OpenStreetMap data), so this adds no
// new vendor. Every layer here is REFERENCE data: map geography, not a current observation.
// Current/recent observations belong in their own layers with their own timestamps.

export const VECTOR_TILEJSON =
  'https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/tiles.json';
export const VECTOR_SOURCE_ID = 'ooh-env-vt';
export const VECTOR_ATTRIBUTION = '© CARTO · © OpenStreetMap contributors';
// The CARTO tiles bundle every map layer, so they are only requested from this zoom. Below it the
// bundled Natural Earth major-river layer (public domain) carries the world view.
export const VECTOR_MIN_ZOOM = 5;
export const NE_SOURCE_ID = 'ooh-env-ne';
export const NE_ATTRIBUTION = 'Natural Earth (public domain)';
const NE_MAX_ZOOM = 5.5;

// Trust classes shown beside every layer and detail. Never label reference geometry as live.
export const TRUST = {
  reference: { label: 'Reference', hint: 'Map geography. Not a current observation.' },
  illustrative: { label: 'Illustrative', hint: 'Sample values for context. Not a live reading.' },
  legacy: {
    label: 'Demo / legacy',
    hint: 'Legacy hand-authored example. Not an observation; provenance unknown.',
  },
  observed: { label: 'Observed', hint: 'A dated measurement from the named provider.' },
  modelled: {
    label: 'Modelled',
    hint: 'Model output for the nearest grid cell, not a measurement.',
  },
  recent: { label: 'Recent observation', hint: 'Real observation with a timestamp.' },
  current: { label: 'Current', hint: 'Latest reading from the provider.' },
  derived: { label: 'Derived', hint: 'Computed or modelled, not directly observed.' },
};

const RIVER_COLOR = '#4D8DFF';
const MINOR_CLASSES = ['canal', 'stream', 'ditch', 'drain'];

const waterwayLayers = [
  {
    id: 'ooh-env-waterway-major',
    type: 'line',
    source: VECTOR_SOURCE_ID,
    'source-layer': 'waterway',
    minzoom: VECTOR_MIN_ZOOM,
    filter: ['==', ['get', 'class'], 'river'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': RIVER_COLOR,
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 1, 0.75, 8, 0.95],
      // Width grows with zoom so a coarse world view stays legible and detail appears as you zoom.
      'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.9, 5, 1.5, 9, 2.8, 13, 5],
    },
  },
  {
    id: 'ooh-env-waterway-minor',
    type: 'line',
    source: VECTOR_SOURCE_ID,
    'source-layer': 'waterway',
    minzoom: 8,
    filter: ['in', ['get', 'class'], ['literal', MINOR_CLASSES]],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': RIVER_COLOR,
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.45, 12, 0.8],
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 12, 1.6, 15, 3],
    },
  },
  {
    // Near-invisible wide stroke so thin rivers are easy to hit with a finger or cursor.
    id: 'ooh-env-waterway-hit',
    type: 'line',
    source: VECTOR_SOURCE_ID,
    'source-layer': 'waterway',
    minzoom: VECTOR_MIN_ZOOM,
    layout: { 'line-cap': 'round' },
    paint: { 'line-color': RIVER_COLOR, 'line-opacity': 0.001, 'line-width': 16 },
  },
  {
    id: 'ooh-env-waterway-selected',
    type: 'line',
    source: VECTOR_SOURCE_ID,
    'source-layer': 'waterway',
    minzoom: VECTOR_MIN_ZOOM,
    filter: ['==', ['get', 'name'], '\u0000'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#EDFF00',
      'line-opacity': 0.95,
      'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2.2, 8, 4.5, 13, 8],
    },
  },
];

const neLine = (id, ranks, minzoom, width) => ({
  id,
  type: 'line',
  source: NE_SOURCE_ID,
  minzoom,
  maxzoom: NE_MAX_ZOOM,
  filter: ['in', ['get', 'scalerank'], ['literal', ranks]],
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': RIVER_COLOR,
    // Crossfade into the detailed OpenStreetMap network around zoom 5.
    'line-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.85, 4.5, 0.85, NE_MAX_ZOOM, 0],
    'line-width': width,
  },
});

// Major rivers for the world view (Natural Earth, public domain). Bigger rivers appear first.
const majorRiverLayers = [
  neLine('ooh-env-ne-major', [1, 2], 0, ['interpolate', ['linear'], ['zoom'], 0, 1.1, 5, 2.4]),
  neLine('ooh-env-ne-mid', [3, 4], 2.2, ['interpolate', ['linear'], ['zoom'], 2, 0.8, 5, 1.8]),
  neLine('ooh-env-ne-minor', [5], 3.6, ['interpolate', ['linear'], ['zoom'], 3.6, 0.6, 5, 1.3]),
  {
    id: 'ooh-env-ne-hit',
    type: 'line',
    source: NE_SOURCE_ID,
    maxzoom: NE_MAX_ZOOM,
    layout: { 'line-cap': 'round' },
    paint: { 'line-color': RIVER_COLOR, 'line-opacity': 0.001, 'line-width': 16 },
  },
  {
    id: 'ooh-env-ne-selected',
    type: 'line',
    source: NE_SOURCE_ID,
    maxzoom: NE_MAX_ZOOM,
    filter: ['==', ['get', 'name'], '\u0000'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#EDFF00', 'line-opacity': 0.95, 'line-width': 4 },
  },
];

const OSM_PROVIDER = 'OpenStreetMap, via CARTO';
const NON_NATURAL_GRASS = ['golf_course', 'park', 'recreation_ground', 'village_green', 'garden'];

const waterAreaLayers = [
  {
    id: 'ooh-env-water-fill',
    type: 'fill',
    source: VECTOR_SOURCE_ID,
    'source-layer': 'water',
    minzoom: VECTOR_MIN_ZOOM,
    paint: { 'fill-color': '#1F51FF', 'fill-opacity': 0.22 },
  },
];
const habitatLayers = [
  {
    id: 'ooh-env-habitat-fill',
    type: 'fill',
    source: VECTOR_SOURCE_ID,
    'source-layer': 'landcover',
    minzoom: VECTOR_MIN_ZOOM,
    filter: [
      'all',
      ['in', ['get', 'class'], ['literal', ['wood', 'grass', 'wetland']]],
      ['!', ['in', ['get', 'subclass'], ['literal', NON_NATURAL_GRASS]]],
    ],
    paint: {
      'fill-color': ['match', ['get', 'class'], 'wood', '#2E8B3C', 'wetland', '#2FA4A0', '#8BC34A'],
      'fill-opacity': 0.34,
    },
  },
];
const protectedLayers = [
  {
    id: 'ooh-env-protected-fill',
    type: 'fill',
    source: VECTOR_SOURCE_ID,
    'source-layer': 'park',
    minzoom: VECTOR_MIN_ZOOM,
    paint: { 'fill-color': '#39FF14', 'fill-opacity': 0.12 },
  },
  {
    id: 'ooh-env-protected-line',
    type: 'line',
    source: VECTOR_SOURCE_ID,
    'source-layer': 'park',
    minzoom: VECTOR_MIN_ZOOM,
    paint: { 'line-color': '#39FF14', 'line-width': 1.2, 'line-opacity': 0.85 },
  },
];

export const ENVIRONMENT_LAYERS = {
  water: {
    id: 'water',
    label: 'Water bodies',
    group: 'Water',
    trust: 'reference',
    swatch: '#1F51FF',
    description: 'Lakes, rivers and sea as mapped in OpenStreetMap. Appears from zoom 5.',
    layers: waterAreaLayers,
    queryLayers: ['ooh-env-water-fill'],
  },
  habitat: {
    id: 'habitat',
    label: 'Natural cover',
    group: 'Green / habitat',
    trust: 'reference',
    swatch: '#2E8B3C',
    description:
      'Woodland, grassland/scrub and wetland as mapped in OpenStreetMap. Not a satellite classification. From zoom 5.',
    layers: habitatLayers,
    queryLayers: ['ooh-env-habitat-fill'],
  },
  protected: {
    id: 'protected',
    label: 'Parks & protected areas',
    group: 'Protected',
    trust: 'reference',
    swatch: '#39FF14',
    description:
      'Park, reserve and protected-area boundaries as tagged in OpenStreetMap. Tagging varies by country and is not the official WDPA register. From zoom 5.',
    layers: protectedLayers,
    queryLayers: ['ooh-env-protected-fill'],
  },
  waterways: {
    id: 'waterways',
    label: 'River network',
    group: 'Water',
    trust: 'reference',
    swatch: RIVER_COLOR,
    description:
      'Major rivers at world scale (Natural Earth), then the OpenStreetMap network from zoom 5, with smaller waterways from zoom 8.',
    layers: [...majorRiverLayers, ...waterwayLayers],
    queryLayers: ['ooh-env-ne-hit', 'ooh-env-waterway-hit'],
    selectedLayers: ['ooh-env-ne-selected', 'ooh-env-waterway-selected'],
  },
};

export function waterwayLabel(props = {}) {
  return props.name_en || props.name || props.name_int || null;
}

export function waterwayKind(props = {}) {
  const c = props.class;
  if (c === 'river') return 'River';
  if (c === 'canal') return 'Canal';
  if (c === 'stream') return 'Stream';
  if (c === 'ditch' || c === 'drain') return 'Drain / ditch';
  return 'Waterway';
}

// Where a queried feature came from, for honest provenance in the detail panel.
export function providerFor(layerId = '') {
  return layerId.startsWith('ooh-env-ne')
    ? 'Natural Earth (public domain), major rivers'
    : 'OpenStreetMap, via CARTO';
}

const HABITAT_NAMES = {
  wood: 'Woodland / forest',
  grass: 'Grassland / scrub / heath',
  wetland: 'Wetland',
};

// Turns a queried map feature into a trust-labelled description for the detail panel.
export function describeFeature(layerId = '', props = {}) {
  if (layerId.startsWith('ooh-env-ne') || layerId.includes('waterway')) {
    return {
      type: 'waterway',
      name: waterwayLabel(props),
      kind: waterwayKind(props),
      provider: providerFor(layerId),
    };
  }
  if (layerId.includes('water-fill')) {
    return {
      type: 'area',
      kind: 'Water body',
      name: props.name_en || props.name || null,
      provider: OSM_PROVIDER,
      rows: [
        {
          label: 'Type',
          value:
            props.class === 'lake'
              ? 'Lake'
              : props.class === 'river'
                ? 'River (area)'
                : props.class || 'Water',
        },
        { label: 'Intermittent', value: props.intermittent ? 'Yes' : 'No or unknown' },
      ],
    };
  }
  if (layerId.includes('habitat')) {
    return {
      type: 'area',
      kind: 'Natural cover',
      name: null,
      provider: OSM_PROVIDER,
      rows: [
        { label: 'Cover', value: HABITAT_NAMES[props.class] || props.class || 'Unknown' },
        { label: 'Detail', value: props.subclass || 'Unknown' },
      ],
    };
  }
  if (layerId.includes('protected')) {
    return {
      type: 'area',
      kind: 'Park / protected area',
      name: props.name_en || props.name || null,
      provider: OSM_PROVIDER,
      rows: [
        { label: 'Designation', value: props.class ? `${props.class} (as tagged)` : 'Unknown' },
        { label: 'Note', value: 'OpenStreetMap tag, not the official WDPA register.' },
      ],
    };
  }
  return { type: 'area', kind: 'Feature', name: null, provider: OSM_PROVIDER, rows: [] };
}
