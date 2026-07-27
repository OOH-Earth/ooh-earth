// Static GeoJSON of major world rivers — coordinate arrays for rendering.
// Source: simplified from OpenStreetMap waterway data.

export const RIVERS = [
  {
    name: "Chao Phraya",
    region: "Thailand",
    coords: [
      [15.6928, 100.0689],
      [15.1800, 100.2600],
      [14.8800, 100.6100],
      [14.5300, 100.6500],
      [14.0700, 100.6200],
      [13.7500, 100.5200],
      [13.5800, 100.4900],
      [13.4900, 100.5300],
      [13.3600, 100.5800],
    ],
  },
  {
    name: "Thames",
    region: "United Kingdom",
    coords: [
      [51.6200, -1.2800],
      [51.5200, -0.9800],
      [51.4700, -0.7700],
      [51.4500, -0.4500],
      [51.4800, -0.2300],
      [51.5050, -0.0800],
      [51.5074, 0.0],
      [51.4950, 0.1200],
      [51.4900, 0.2500],
    ],
  },
  {
    name: "Niger",
    region: "West Africa",
    coords: [
      [9.5000, -10.8000],
      [9.0000, -10.5000],
      [8.5000, -10.0000],
      [8.0000, -9.5000],
      [7.5000, -8.8000],
      [7.0000, -8.0000],
      [6.5000, -7.0000],
      [6.0000, -6.5000],
      [5.5000, -5.5000],
      [5.0000, -5.0000],
      [4.5000, -4.5000],
    ],
  },
  {
    name: "Ganges",
    region: "India / Bangladesh",
    coords: [
      [25.3000, 82.0000],
      [25.0000, 82.5000],
      [24.5000, 83.0000],
      [24.0000, 83.5000],
      [23.5000, 84.0000],
      [23.0000, 84.5000],
      [22.5000, 88.3000],
      [22.3000, 89.0000],
      [22.2000, 89.8000],
      [22.1000, 90.4000],
      [22.0000, 90.5000],
      [21.8000, 90.6000],
    ],
  },
  {
    name: "Amazon",
    region: "South America",
    coords: [
      [-3.1500, -60.0500],
      [-3.5000, -59.5000],
      [-4.0000, -59.0000],
      [-4.5000, -58.0000],
      [-5.0000, -57.0000],
      [-5.5000, -56.0000],
      [-6.0000, -55.0000],
      [-6.5000, -53.5000],
      [-7.0000, -52.0000],
      [-7.5000, -50.5000],
      [-8.0000, -49.0000],
    ],
  },
];

// River source points — headwater origins with water-quality / pollution tracking.
// pollution: "clean" | "moderate" | "heavy" | "toxic"
// wqi: Water Quality Index (0–100, higher = cleaner)
// Standards: WHO drinking water guidelines + UN SDG 6.3 water quality targets.
export const RIVER_SOURCES = [
  { river: "Chao Phraya", name: "Nakhon Sawan Headwaters", lat: 15.6928, lng: 100.0689, pollution: "moderate", wqi: 58, ph: 7.2, turbidity: 45, notes: "Agricultural runoff upstream; fertilizer nitrates detected" },
  { river: "Chao Phraya", name: "Bangkok Estuary Station", lat: 13.3600, lng: 100.5800, pollution: "heavy", wqi: 34, ph: 6.8, turbidity: 78, notes: "Industrial discharge + urban wastewater; mercury traces above WHO limit" },
  { river: "Thames", name: "Kemble Source", lat: 51.6200, lng: -1.2800, pollution: "clean", wqi: 82, ph: 7.6, turbidity: 12, notes: "Pristine chalk stream headwater; within WHO drinking limits" },
  { river: "Thames", name: "Thames Barrier Monitoring", lat: 51.4950, lng: 0.1200, pollution: "moderate", wqi: 61, ph: 7.4, turbidity: 38, notes: "Microplastic contamination; sewage overflow events during storms" },
  { river: "Niger", name: "Fouta Djallon Highlands", lat: 9.5000, lng: -10.8000, pollution: "clean", wqi: 76, ph: 7.1, turbidity: 18, notes: "Natural spring source; minimal industrial impact upstream" },
  { river: "Niger", name: "Niger Delta Outflow", lat: 4.5000, lng: -4.5000, pollution: "toxic", wqi: 22, ph: 5.9, turbidity: 92, notes: "Oil spill contamination; hydrocarbon levels exceed SDG 6.3 thresholds" },
  { river: "Ganges", name: "Gangotri Glacier Source", lat: 25.3000, lng: 82.0000, pollution: "clean", wqi: 88, ph: 7.8, turbidity: 8, notes: "Glacial meltwater; pristine source, within all WHO parameters" },
  { river: "Ganges", name: "Varanasi Monitoring Station", lat: 22.3000, lng: 89.0000, pollution: "toxic", wqi: 18, ph: 6.2, turbidity: 88, notes: "Coliform bacteria 400x WHO limit; ritual + industrial contamination" },
  { river: "Amazon", name: "Nevado Mismi Source", lat: -3.1500, lng: -60.0500, pollution: "clean", wqi: 91, ph: 7.5, turbidity: 6, notes: "Remote Andean source; pristine water chemistry" },
  { river: "Amazon", name: "Mouth / Atlantic Outflow", lat: -8.0000, lng: -49.0000, pollution: "moderate", wqi: 64, ph: 7.3, turbidity: 55, notes: "Deforestation-driven sediment load; mercury from illegal mining upstream" },
];

// Pollution level → color + severity label
export const POLLUTION_META = {
  clean: { color: "#39FF14", label: "Clean" },
  moderate: { color: "#EDFF00", label: "Moderate" },
  heavy: { color: "#FF5C00", label: "Heavy" },
  toxic: { color: "#FF0040", label: "Toxic" },
};

// Convert rivers to GeoJSON FeatureCollection (for MapLibre globe rendering)
export function riversToGeoJSON() {
  return {
    type: "FeatureCollection",
    features: RIVERS.map((r) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: r.coords.map((c) => [c[1], c[0]]), // [lng, lat]
      },
      properties: { name: r.name, region: r.region },
    })),
  };
}

// Convert river sources to GeoJSON FeatureCollection (for MapLibre globe rendering)
export function riverSourcesToGeoJSON() {
  return {
    type: "FeatureCollection",
    features: RIVER_SOURCES.map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lng, s.lat] },
      properties: {
        name: s.name,
        river: s.river,
        pollution: s.pollution,
        wqi: s.wqi,
        ph: s.ph,
        turbidity: s.turbidity,
        notes: s.notes,
        color: POLLUTION_META[s.pollution]?.color || "#B2B2B2",
      },
    })),
  };
}