// The adapter validates its dynamic provider payload at runtime; keep the
// JavaScript checker from narrowing those boundary objects incorrectly.
// @ts-nocheck
import { createDedupeInFlight } from './dedupeInFlight.js';
import { withRetry } from './withRetry.js';

const USGS_ENDPOINT = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const USGS_HOSTS = new Set(['earthquake.usgs.gov', 'www.usgs.gov']);
const DEFAULT_RADIUS_KM = 100;
const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_DAYS = 30;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 8;
const REQUEST_TIMEOUT_MS = 8 * 1000;

export const RESEARCH_LIMITS = {
  radiusKm: DEFAULT_RADIUS_KM,
  limit: DEFAULT_LIMIT,
  windowDays: DEFAULT_WINDOW_DAYS,
  cacheTtlMs: CACHE_TTL_MS,
  cacheMaxEntries: CACHE_MAX_ENTRIES,
  timeoutMs: REQUEST_TIMEOUT_MS,
  retries: 1,
};

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

function asFiniteNumber(value) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

export function validatePublicCoordinates({ lat, lng, coordinatePrivacy } = {}) {
  if (coordinatePrivacy && coordinatePrivacy !== 'public') {
    throw new Error('Live research is unavailable for restricted coordinates.');
  }
  const latitude = asFiniteNumber(lat);
  const longitude = asFiniteNumber(lng);
  if (latitude === null || longitude === null)
    throw new Error('Place coordinates are unavailable.');
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Place coordinates are outside geographic bounds.');
  }
  return { lat: latitude, lng: longitude };
}

function minuteWindow(now, windowDays) {
  const end = new Date(now);
  end.setUTCSeconds(0, 0);
  const start = new Date(end.getTime() - windowDays * 24 * 60 * 60 * 1000);
  return { starttime: start.toISOString(), endtime: end.toISOString() };
}

export function buildUsgsQuery({
  lat,
  lng,
  now = Date.now(),
  radiusKm = DEFAULT_RADIUS_KM,
  limit = DEFAULT_LIMIT,
  windowDays = DEFAULT_WINDOW_DAYS,
} = {}) {
  const coordinates = validatePublicCoordinates({ lat, lng });
  if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 1000)
    throw new Error('Research radius is outside bounds.');
  if (!Number.isInteger(limit) || limit < 1 || limit > DEFAULT_LIMIT)
    throw new Error('Research result cap is outside bounds.');
  if (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 90)
    throw new Error('Research time window is outside bounds.');
  const window = minuteWindow(now, windowDays);
  return {
    provider: 'usgs-earthquake-catalog',
    params: {
      endtime: window.endtime,
      eventtype: 'earthquake',
      format: 'geojson',
      latitude: coordinates.lat.toFixed(6),
      limit: String(limit),
      longitude: coordinates.lng.toFixed(6),
      maxradiuskm: String(radiusKm),
      orderby: 'time',
      starttime: window.starttime,
    },
  };
}

export function canonicalResearchKey({ provider, params }) {
  if (!provider || !params || typeof params !== 'object')
    throw new Error('Research request is incomplete.');
  return `${provider}|${Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')}`;
}

export function buildUsgsQueryUrl(request) {
  const query = request.params ? request : buildUsgsQuery(request);
  const search = new URLSearchParams();
  Object.entries(query.params)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => search.set(key, value));
  return `${USGS_ENDPOINT}?${search.toString()}`;
}

function sourceUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !USGS_HOSTS.has(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function eventTime(value) {
  const timestamp = typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function normalizeUsgsFeature(feature, retrievedAt, searchDistanceKm = DEFAULT_RADIUS_KM) {
  if (!feature || feature.type !== 'Feature' || feature.geometry?.type !== 'Point') return null;
  const providerEventId =
    feature.id === undefined || feature.id === null ? '' : String(feature.id).trim();
  const properties = feature.properties;
  const coordinates = feature.geometry.coordinates;
  if (!providerEventId || !properties || !Array.isArray(coordinates) || coordinates.length < 2)
    return null;
  const longitude = asFiniteNumber(coordinates[0]);
  const latitude = asFiniteNumber(coordinates[1]);
  const depthKm = coordinates[2] == null ? null : asFiniteNumber(coordinates[2]);
  const occurredAt = eventTime(properties.time);
  const originalUrl = sourceUrl(properties.url);
  if (
    longitude === null ||
    latitude === null ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90 ||
    !occurredAt ||
    !originalUrl
  )
    return null;
  const magnitude = properties.mag == null ? null : asFiniteNumber(properties.mag);
  if (properties.mag != null && magnitude === null) return null;
  if (depthKm !== null && depthKm < -20) return null;
  const title =
    typeof properties.title === 'string' && properties.title.trim()
      ? properties.title.trim().slice(0, 240)
      : 'USGS earthquake event';
  return {
    id: `usgs:${providerEventId}`,
    providerEventId,
    title,
    summary: `Magnitude ${magnitude ?? 'unknown'} event${depthKm != null ? ` at ${depthKm} km depth` : ''}.`,
    sourceUrl: originalUrl,
    eventTime: occurredAt,
    retrievedAt,
    geographicPrecision: 'USGS catalog epicentre; provider accuracy not supplied',
    searchDistanceKm,
    status: 'live',
  };
}

function responseError(response) {
  const error = new Error(`USGS returned ${response.status}`);
  error.status = response.status;
  error.originalError = {
    response: { headers: { 'retry-after': response.headers.get('retry-after') } },
  };
  return error;
}

async function fetchWithTimeout(fetchImpl, url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/geo+json, application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw responseError(response);
    return response;
  } catch (error) {
    if (controller.signal.aborted) {
      const timeout = new Error('USGS request timed out');
      timeout.code = 'RESEARCH_TIMEOUT';
      throw timeout;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function loadFromUsgs({ fetchImpl, request, timeoutMs }) {
  const url = buildUsgsQueryUrl(request);
  const response = await fetchWithTimeout(fetchImpl, url, timeoutMs);
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('USGS returned invalid JSON.');
  }
  if (!payload || payload.type !== 'FeatureCollection' || !Array.isArray(payload.features)) {
    throw new Error('USGS returned an invalid feature collection.');
  }
  const retrievedAt = new Date().toISOString();
  const seen = new Set();
  const items = [];
  for (const feature of payload.features) {
    const item = normalizeUsgsFeature(feature, retrievedAt, Number(request.params.maxradiuskm));
    if (!item || seen.has(item.providerEventId)) continue;
    seen.add(item.providerEventId);
    items.push(item);
    if (items.length === DEFAULT_LIMIT) break;
  }
  return { requestUrl: url, retrievedAt, items };
}

function transientResearchError(error) {
  return (
    error?.code === 'RESEARCH_TIMEOUT' ||
    error?.name === 'TypeError' ||
    [408, 425, 429, 500, 502, 503, 504].includes(error?.status)
  );
}

export function createPlaceResearchClient({
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  timeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  const cache = new Map();
  const dedupe = createDedupeInFlight();
  const getCached = (key) => {
    const hit = cache.get(key);
    if (!hit) return null;
    if (now() - hit.cachedAt >= CACHE_TTL_MS) {
      cache.delete(key);
      return null;
    }
    return { ...hit.value, cacheHit: true };
  };
  const putCached = (key, value) => {
    cache.delete(key);
    cache.set(key, { cachedAt: now(), value });
    while (cache.size > CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value);
  };
  return {
    /** @param {{ lat?: number|string, lng?: number|string, coordinatePrivacy?: string, now?: number }} input */
    request({ lat, lng, coordinatePrivacy, now: requestNow = now() } = {}) {
      const coordinates = validatePublicCoordinates({ lat, lng, coordinatePrivacy });
      const request = buildUsgsQuery({ ...coordinates, now: requestNow });
      const key = canonicalResearchKey(request);
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return dedupe(key, async () => {
        const value = await withRetry(() => loadFromUsgs({ fetchImpl, request, timeoutMs }), {
          retries: RESEARCH_LIMITS.retries,
          delayMs: 400,
          shouldRetry: transientResearchError,
        });
        putCached(key, value);
        return { ...value, cacheHit: false };
      });
    },
    clear() {
      cache.clear();
    },
  };
}

export const placeResearchClient = createPlaceResearchClient();

export const RESEARCH_SOURCE = {
  name: 'USGS Earthquake Catalog',
  coverage: 'Global catalog; this request is bounded to a 100 km radius around the place.',
  queryWindow: 'Previous 30 days through the current UTC minute; maximum five returned events.',
  completeness:
    'The capped list is not exhaustive. An empty result is not proof that a place is safe.',
  licence: 'USGS data is public domain in the US; attribution is requested.',
  disclosure:
    'Live lookup sends the selected public place coordinates and fixed query parameters to USGS. Normal network metadata, such as the connecting IP address, is also visible to the provider. No account, contribution, photo or user identifier is sent.',
  reliability:
    'Authoritative catalog with documented event quality limits; small events may be missing in sparsely instrumented regions.',
  rateLimit:
    'One explicit live action; no polling or background refresh. Shared in-flight calls and a five-minute, eight-entry memory cache bound repeat traffic.',
  sourceUrl: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
  feedChoice:
    'The Catalog query is used for a place-bounded, time-windowed lookup. USGS real-time GeoJSON feeds are better for continuously monitoring global feeds, which this panel deliberately does not do.',
};
