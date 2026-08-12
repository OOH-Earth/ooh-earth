// Static GeoJSON of major world rivers — coordinate arrays for rendering.
// Source: simplified from OpenStreetMap waterway data.

export const RIVERS = [
  {
    name: 'Chao Phraya',
    region: 'Thailand',
    coords: [
      [15.6928, 100.0689],
      [15.18, 100.26],
      [14.88, 100.61],
      [14.53, 100.65],
      [14.07, 100.62],
      [13.75, 100.52],
      [13.58, 100.49],
      [13.49, 100.53],
      [13.36, 100.58],
    ],
  },
  {
    name: 'Thames',
    region: 'United Kingdom',
    coords: [
      [51.62, -1.28],
      [51.52, -0.98],
      [51.47, -0.77],
      [51.45, -0.45],
      [51.48, -0.23],
      [51.505, -0.08],
      [51.5074, 0.0],
      [51.495, 0.12],
      [51.49, 0.25],
    ],
  },
  {
    name: 'Niger',
    region: 'West Africa',
    coords: [
      [9.5, -10.8],
      [9.0, -10.5],
      [8.5, -10.0],
      [8.0, -9.5],
      [7.5, -8.8],
      [7.0, -8.0],
      [6.5, -7.0],
      [6.0, -6.5],
      [5.5, -5.5],
      [5.0, -5.0],
      [4.5, -4.5],
    ],
  },
  {
    name: 'Ganges',
    region: 'India / Bangladesh',
    coords: [
      [25.3, 82.0],
      [25.0, 82.5],
      [24.5, 83.0],
      [24.0, 83.5],
      [23.5, 84.0],
      [23.0, 84.5],
      [22.5, 88.3],
      [22.3, 89.0],
      [22.2, 89.8],
      [22.1, 90.4],
      [22.0, 90.5],
      [21.8, 90.6],
    ],
  },
  {
    name: 'Amazon',
    region: 'South America',
    coords: [
      [-3.15, -60.05],
      [-3.5, -59.5],
      [-4.0, -59.0],
      [-4.5, -58.0],
      [-5.0, -57.0],
      [-5.5, -56.0],
      [-6.0, -55.0],
      [-6.5, -53.5],
      [-7.0, -52.0],
      [-7.5, -50.5],
      [-8.0, -49.0],
    ],
  },
];

// River source points — headwater origins with water-quality / pollution tracking.
// pollution: "clean" | "moderate" | "heavy" | "toxic"
// wqi: Water Quality Index (0–100, higher = cleaner)
// Standards: WHO drinking water guidelines + UN SDG 6.3 water quality targets.
export const RIVER_SOURCES = [
  {
    river: 'Chao Phraya',
    name: 'Nakhon Sawan Headwaters',
    lat: 15.6928,
    lng: 100.0689,
    pollution: 'moderate',
    wqi: 58,
    ph: 7.2,
    turbidity: 45,
    notes: 'Agricultural runoff upstream; fertilizer nitrates detected',
  },
  {
    river: 'Chao Phraya',
    name: 'Bangkok Estuary Station',
    lat: 13.36,
    lng: 100.58,
    pollution: 'heavy',
    wqi: 34,
    ph: 6.8,
    turbidity: 78,
    notes: 'Industrial discharge + urban wastewater; mercury traces above WHO limit',
  },
  {
    river: 'Thames',
    name: 'Kemble Source',
    lat: 51.62,
    lng: -1.28,
    pollution: 'clean',
    wqi: 82,
    ph: 7.6,
    turbidity: 12,
    notes: 'Pristine chalk stream headwater; within WHO drinking limits',
  },
  {
    river: 'Thames',
    name: 'Thames Barrier Monitoring',
    lat: 51.495,
    lng: 0.12,
    pollution: 'moderate',
    wqi: 61,
    ph: 7.4,
    turbidity: 38,
    notes: 'Microplastic contamination; sewage overflow events during storms',
  },
  {
    river: 'Niger',
    name: 'Fouta Djallon Highlands',
    lat: 9.5,
    lng: -10.8,
    pollution: 'clean',
    wqi: 76,
    ph: 7.1,
    turbidity: 18,
    notes: 'Natural spring source; minimal industrial impact upstream',
  },
  {
    river: 'Niger',
    name: 'Niger Delta Outflow',
    lat: 4.5,
    lng: -4.5,
    pollution: 'toxic',
    wqi: 22,
    ph: 5.9,
    turbidity: 92,
    notes: 'Oil spill contamination; hydrocarbon levels exceed SDG 6.3 thresholds',
  },
  {
    river: 'Ganges',
    name: 'Gangotri Glacier Source',
    lat: 25.3,
    lng: 82.0,
    pollution: 'clean',
    wqi: 88,
    ph: 7.8,
    turbidity: 8,
    notes: 'Glacial meltwater; pristine source, within all WHO parameters',
  },
  {
    river: 'Ganges',
    name: 'Varanasi Monitoring Station',
    lat: 22.3,
    lng: 89.0,
    pollution: 'toxic',
    wqi: 18,
    ph: 6.2,
    turbidity: 88,
    notes: 'Coliform bacteria 400x WHO limit; ritual + industrial contamination',
  },
  {
    river: 'Amazon',
    name: 'Nevado Mismi Source',
    lat: -3.15,
    lng: -60.05,
    pollution: 'clean',
    wqi: 91,
    ph: 7.5,
    turbidity: 6,
    notes: 'Remote Andean source; pristine water chemistry',
  },
  {
    river: 'Amazon',
    name: 'Mouth / Atlantic Outflow',
    lat: -8.0,
    lng: -49.0,
    pollution: 'moderate',
    wqi: 64,
    ph: 7.3,
    turbidity: 55,
    notes: 'Deforestation-driven sediment load; mercury from illegal mining upstream',
  },
];

// Pollution level → color + severity label
export const POLLUTION_META = {
  clean: { color: '#39FF14', label: 'Clean' },
  moderate: { color: '#EDFF00', label: 'Moderate' },
  heavy: { color: '#FF5C00', label: 'Heavy' },
  toxic: { color: '#FF0040', label: 'Toxic' },
};

// Convert rivers to GeoJSON FeatureCollection (for MapLibre globe rendering)
export function riversToGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: RIVERS.map((r) => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: r.coords.map((c) => [c[1], c[0]]), // [lng, lat]
      },
      properties: { name: r.name, region: r.region },
    })),
  };
}

// Convert river sources to GeoJSON FeatureCollection (for MapLibre globe rendering)
export function riverSourcesToGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: RIVER_SOURCES.map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      properties: {
        name: s.name,
        river: s.river,
        pollution: s.pollution,
        wqi: s.wqi,
        ph: s.ph,
        turbidity: s.turbidity,
        notes: s.notes,
        color: POLLUTION_META[s.pollution]?.color || '#B2B2B2',
      },
    })),
  };
}
