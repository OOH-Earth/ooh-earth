const USGS_ENDPOINT = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

export const RESEARCH_FIXTURES = [
  {
    id: 'fixture-uk-environment-note',
    title: 'Fixture: public-space environmental context',
    summary:
      'This clearly labelled example lets us validate provenance, time, precision and next-action states before relying on a live provider.',
    sourceUrl: 'https://www.usgs.gov/programs/earthquake-hazards',
    eventTime: '2026-01-15T10:30:00.000Z',
    retrievedAt: '2026-01-15T10:31:00.000Z',
    geographicPrecision: 'Illustrative place context · not a live observation',
    status: 'fixture',
  },
];

export function buildUsgsQueryUrl({ lat, lng, radiusKm = 100, limit = 5 }) {
  const params = new URLSearchParams({
    format: 'geojson',
    latitude: String(lat),
    longitude: String(lng),
    maxradiuskm: String(radiusKm),
    limit: String(limit),
    orderby: 'time',
    eventtype: 'earthquake',
  });
  return `${USGS_ENDPOINT}?${params.toString()}`;
}

export function normalizeUsgsFeature(feature, retrievedAt) {
  const properties = feature?.properties || {};
  const [lng, lat, depthKm] = feature?.geometry?.coordinates || [];
  return {
    id: `usgs-${feature?.id || properties.code || properties.time}`,
    title: properties.title || 'USGS earthquake event',
    summary: `Magnitude ${properties.mag ?? 'unknown'} event${depthKm != null ? ` at ${depthKm} km depth` : ''}.`,
    sourceUrl: properties.url || 'https://earthquake.usgs.gov/earthquakes/map/',
    eventTime: properties.time ? new Date(properties.time).toISOString() : null,
    retrievedAt,
    geographicPrecision:
      lat != null && lng != null
        ? `Catalog point · ${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)}`
        : 'Catalog point unavailable',
    status: 'live',
  };
}

export async function fetchUsgsResearch({ lat, lng, signal }) {
  const url = buildUsgsQueryUrl({ lat, lng });
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/geo+json, application/json' },
  });
  if (!response.ok) throw new Error(`USGS returned ${response.status}`);
  const payload = await response.json();
  const retrievedAt = new Date().toISOString();
  return {
    requestUrl: url,
    retrievedAt,
    items: (payload.features || []).map((feature) => normalizeUsgsFeature(feature, retrievedAt)),
  };
}

export const RESEARCH_SOURCE = {
  name: 'USGS Earthquake Catalog',
  coverage: 'Global catalog; this request is bounded to a 100 km radius around the place.',
  licence: 'USGS data is public domain in the US; attribution is requested.',
  disclosure:
    'OOH sends only the selected place latitude/longitude and fixed query parameters. No account, contribution, photo or user identifier is sent.',
  reliability:
    'Authoritative catalog with documented event quality limits; small events may be missing in sparsely instrumented regions.',
  rateLimit: 'One request per panel open; no polling or background refresh.',
  sourceUrl: 'https://earthquake.usgs.gov/fdsnws/event/1/que',
};
