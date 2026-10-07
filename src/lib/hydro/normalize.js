// Provider adapters -> one normalized, provider-honest station model.
//
// Station:     { provider, stationId, name, waterbody, latitude, longitude, sourceUrl,
//                providerMeta, measurements: Measurement[] }
// Measurement: { type, label, value, unit, observedAt, retrievedAt, freshness, ageMs,
//                quality: { approval, qualifiers[] }, sourceReference, providerMeta }
//
// Nothing here invents data: a missing value stays null, an unknown waterbody stays null, and
// every measurement keeps the provider's own semantics in providerMeta.
import { classifyFreshness } from './freshness.js';

export const PROVIDERS = {
  usgs: {
    id: 'usgs',
    name: 'USGS',
    full: 'U.S. Geological Survey, Water Data API',
    attribution:
      'Data from the U.S. Geological Survey (USGS). Provisional data are subject to revision.',
    homepage: 'https://api.waterdata.usgs.gov/',
  },
  ea: {
    id: 'ea',
    name: 'Environment Agency',
    full: 'UK Environment Agency, flood monitoring real-time API (Beta)',
    attribution:
      'This uses Environment Agency flood and river level data from the real-time data API (Beta). Open Government Licence v3.0.',
    homepage: 'https://environment.data.gov.uk/flood-monitoring/doc/reference',
  },
};

const USGS_PARAMS = {
  '00060': { type: 'discharge', label: 'River flow (discharge)' },
  '00065': { type: 'stage', label: 'River level (gage height)' },
};
export const USGS_PARAMETER_CODES = Object.keys(USGS_PARAMS);

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// ---- USGS (OGC API: collections/latest-continuous + collections/monitoring-locations) -------

export function usgsSiteNumber(monitoringLocationId = '') {
  return String(monitoringLocationId).replace(/^USGS-/, '');
}

// features: latest-continuous items; sites: monitoring-locations items (optional, for names).
export function normalizeUsgs(features = [], sites = [], retrievedAt = Date.now()) {
  const siteById = new Map();
  for (const s of sites) {
    const id = s?.properties?.id || s?.id;
    if (id) siteById.set(id, s);
  }
  const byStation = new Map();
  for (const f of features) {
    const p = f?.properties || {};
    const id = p.monitoring_location_id;
    const coords = f?.geometry?.coordinates;
    const code = p.parameter_code;
    if (!id || !USGS_PARAMS[code] || !Array.isArray(coords)) continue;
    const lng = num(coords[0]);
    const lat = num(coords[1]);
    if (lat === null || lng === null) continue;
    let st = byStation.get(id);
    if (!st) {
      const site = siteById.get(id)?.properties || {};
      st = {
        provider: 'usgs',
        stationId: id,
        name: site.monitoring_location_name || null,
        // USGS gives a site name ("PATAPSCO RIVER AT HOLLOFIELD MD"), not a separate waterbody.
        waterbody: null,
        latitude: lat,
        longitude: lng,
        sourceUrl: `https://waterdata.usgs.gov/monitoring-location/${usgsSiteNumber(id)}/`,
        providerMeta: {
          siteTypeCode: site.site_type_code ?? null,
          agencyCode: site.agency_code ?? null,
        },
        measurements: [],
      };
      byStation.set(id, st);
    }
    const value = num(p.value);
    const fresh =
      value === null ? { status: 'none', ageMs: null } : classifyFreshness(p.time, retrievedAt);
    st.measurements.push({
      type: USGS_PARAMS[code].type,
      label: USGS_PARAMS[code].label,
      value,
      unit: p.unit_of_measure || null,
      observedAt: value === null ? null : p.time || null,
      retrievedAt,
      freshness: fresh.status,
      ageMs: fresh.ageMs,
      quality: {
        approval: p.approval_status || null,
        qualifiers: p.qualifier ? [p.qualifier] : [],
      },
      sourceReference: `https://waterdata.usgs.gov/monitoring-location/${usgsSiteNumber(id)}/`,
      providerMeta: {
        parameterCode: code,
        statisticId: p.statistic_id ?? null,
        lastModified: p.last_modified ?? null,
      },
    });
  }
  return [...byStation.values()];
}

// Details for ONE site (collections/monitoring-locations/items/{id}), fetched on selection: the bulk
// list truncates in dense areas and a name filter on site type would drop tidal sites (ST-TS).
export function normalizeUsgsSite(feature) {
  const p = feature?.properties || {};
  return {
    name: p.monitoring_location_name || null,
    siteType: p.site_type || null,
    siteTypeCode: p.site_type_code || null,
    state: p.state_name || null,
    county: p.county_name || null,
  };
}

// ---- UK Environment Agency (flood-monitoring: /id/stations + /data/readings?latest) ---------

const EA_QUALIFIER_LABEL = {
  Stage: 'River level (stage)',
  'Downstream Stage': 'River level (downstream stage)',
  'Tidal Level': 'Tidal level',
  Height: 'Water level (height)',
  Groundwater: 'Groundwater level',
};

// Only river-relevant level measures; groundwater is not a river condition.
function eaMeasureLabel(m) {
  if (m.parameter === 'flow') return 'River flow';
  return (
    EA_QUALIFIER_LABEL[m.qualifier] || `Water level (${m.qualifier || m.parameterName || 'level'})`
  );
}

const first = (v) => (Array.isArray(v) ? v[0] : v);

// stations: /id/stations items. readingsByMeasure: Map(measureId -> {dateTime, value}) built from
// ONE national /data/readings?latest call (the provider's documented efficient pattern).
export function normalizeEa(
  stations = [],
  readingsByMeasure = new Map(),
  retrievedAt = Date.now(),
) {
  const out = [];
  for (const s of stations) {
    const lat = num(s.lat);
    const lng = num(s.long);
    if (lat === null || lng === null || !s.stationReference) continue;
    const measures = (Array.isArray(s.measures) ? s.measures : [s.measures]).filter(Boolean);
    const measurements = [];
    for (const m of measures) {
      if (m.qualifier === 'Groundwater') continue;
      const reading = readingsByMeasure.get(m['@id']);
      const value = num(first(reading?.value));
      const fresh =
        value === null
          ? { status: 'none', ageMs: null }
          : classifyFreshness(reading.dateTime, retrievedAt, num(m.period));
      measurements.push({
        type: m.parameter === 'flow' ? 'discharge' : 'stage',
        label: eaMeasureLabel(m),
        value,
        unit: m.unitName || null,
        observedAt: value === null ? null : reading.dateTime,
        retrievedAt,
        freshness: fresh.status,
        ageMs: fresh.ageMs,
        quality: { approval: null, qualifiers: m.qualifier ? [m.qualifier] : [] },
        sourceReference: m['@id'] || null,
        providerMeta: { measureId: m['@id'] ?? null, periodSec: num(m.period) },
      });
    }
    if (!measurements.length) continue;
    out.push({
      provider: 'ea',
      stationId: String(s.stationReference),
      name: s.label || null,
      waterbody: s.riverName || null,
      latitude: lat,
      longitude: lng,
      sourceUrl:
        s['@id'] ||
        `https://environment.data.gov.uk/flood-monitoring/id/stations/${s.stationReference}`,
      providerMeta: { status: s.status ?? null, catchmentName: s.catchmentName ?? null },
      measurements,
    });
  }
  return out;
}

// Build the measure -> reading lookup from a /data/readings?latest response.
export function indexEaReadings(items = []) {
  const map = new Map();
  for (const r of items) if (r?.measure) map.set(r.measure, r);
  return map;
}

// Headline measurement for a station: freshest first, so a stale one never leads when a current
// one exists. Ties keep provider order.
const RANK = { current: 0, recent: 1, stale: 2, none: 3 };
export function headlineMeasurement(station) {
  return [...station.measurements].sort((a, b) => RANK[a.freshness] - RANK[b.freshness])[0] || null;
}
