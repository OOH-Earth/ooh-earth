// Network layer for observed river conditions. Pure functions around fetch so tests can inject a
// stub; nothing here touches React or a Base44 entity.
//
// Usage budget (measured 2026-10-07, see docs/ops/ooh-earth/18-ENVIRONMENTAL-SOURCE-REGISTER.md):
//   USGS  one request per settled viewport, ~46 KB gzipped for ~900 values, ~3 s.
//   EA    stations once per area (24 h), ONE national latest-readings call per 15 min (~80 KB gz).
// Every request has a hard timeout and an AbortSignal; nothing is retried or polled in here.
import {
  USGS_PARAMETER_CODES,
  indexEaReadings,
  normalizeEa,
  normalizeUsgs,
  normalizeUsgsSite,
} from './normalize.js';

export const USGS_BASE = 'https://api.waterdata.usgs.gov/ogcapi/v0';
export const EA_BASE = 'https://environment.data.gov.uk/flood-monitoring';
export const REQUEST_TIMEOUT_MS = 15_000;
export const USGS_MIN_ZOOM = 8;
export const USGS_MAX_AREA_DEG2 = 40;
export const EA_MIN_ZOOM = 8;
export const EA_READINGS_TTL_MS = 15 * 60_000;
export const EA_STATIONS_TTL_MS = 24 * 3_600_000;
export const USGS_TTL_MS = 5 * 60_000;
// England-focused provider (a few Scottish/Welsh stations exist). Used only to avoid pointless
// requests elsewhere; it is not a claim about where data exists.
export const EA_BBOX = [-7.6, 49.8, 2.0, 56.0];
// USGS publishes for the United States and its territories. These boxes only avoid pointless
// requests elsewhere; they are not a claim about where stations exist.
export const USGS_BBOXES = [
  [-125, 24, -66, 50], // contiguous US
  [-180, 51, -129, 72], // Alaska
  [172, 51, 180, 53], // western Aleutians
  [-161, 18, -154, 23], // Hawaii
  [-68, 17, -64, 19], // Puerto Rico, US Virgin Islands
  [144, 13, 146, 21], // Guam, Northern Mariana Islands
  [-171, -15, -168, -14], // American Samoa
];

export class HydroError extends Error {
  constructor(kind, message, status = null) {
    super(message);
    this.kind = kind; // 'timeout' | 'http' | 'network' | 'parse' | 'aborted'
    this.status = status;
  }
}

export const bboxAreaDeg2 = ([w, s, e, n]) => Math.max(0, e - w) * Math.max(0, n - s);
export const bboxIntersects = (a, b) =>
  a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];

// Snap outward to a 0.5-degree grid so small pans reuse the same cache entry.
export function snapBbox([w, s, e, n], step = 0.5) {
  const f = (v) => Math.floor(v / step) * step;
  const c = (v) => Math.ceil(v / step) * step;
  return [f(w), f(s), c(e), c(n)].map((v) => Number(v.toFixed(4)));
}

/**
 * @param {string} url
 * @param {any} [opts]
 */
async function getJson(url, opts = {}) {
  const { signal, fetchImpl = fetch, timeoutMs = REQUEST_TIMEOUT_MS } = opts;
  const ctl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctl.abort();
  }, timeoutMs);
  const onAbort = () => ctl.abort();
  if (signal) {
    if (signal.aborted) ctl.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  try {
    if (ctl.signal.aborted) throw new HydroError('aborted', 'Cancelled');
    const res = await fetchImpl(url, {
      signal: ctl.signal,
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    if (!res.ok) throw new HydroError('http', `HTTP ${res.status}`, res.status);
    try {
      return await res.json();
    } catch {
      throw new HydroError('parse', 'Unreadable response');
    }
  } catch (e) {
    if (e instanceof HydroError) throw e;
    if (timedOut) throw new HydroError('timeout', `No response within ${timeoutMs / 1000} s`);
    if (signal?.aborted || e?.name === 'AbortError') throw new HydroError('aborted', 'Cancelled');
    throw new HydroError('network', e?.message || 'Network error');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

// ---- small TTL cache with in-flight de-duplication ---------------------------------------
export function createCache(now = () => Date.now(), maxEntries = 64) {
  const done = new Map();
  const inflight = new Map();
  let generation = 0;
  return {
    async get(key, ttlMs, load, signal) {
      if (signal?.aborted) throw new HydroError('aborted', 'Cancelled');
      for (const [k, item] of done) if (now() >= item.expiresAt) done.delete(k);
      const hit = done.get(key);
      if (hit) {
        done.delete(key);
        done.set(key, hit);
        return { value: hit.value, cached: true };
      }
      let operation = inflight.get(key);
      const shared = Boolean(operation);
      if (!operation) {
        const controller = new AbortController();
        const startedGeneration = generation;
        operation = { controller, consumers: 0, promise: null };
        const current = operation;
        current.promise = Promise.resolve()
          .then(() => load(controller.signal))
          .then((value) => {
            if (!controller.signal.aborted && generation === startedGeneration) {
              done.set(key, { expiresAt: now() + ttlMs, value });
              while (done.size > maxEntries) done.delete(done.keys().next().value);
            }
            return value;
          })
          .finally(() => {
            if (inflight.get(key) === current) inflight.delete(key);
          });
        inflight.set(key, current);
      }
      const current = operation;
      current.consumers += 1;
      return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error, value) => {
          if (settled) return;
          settled = true;
          signal?.removeEventListener('abort', onAbort);
          current.consumers -= 1;
          if (error) reject(error);
          else resolve({ value, cached: shared });
        };
        const onAbort = () => {
          finish(new HydroError('aborted', 'Cancelled'));
          if (current.consumers === 0) {
            if (inflight.get(key) === current) inflight.delete(key);
            current.controller.abort();
          }
        };
        signal?.addEventListener('abort', onAbort, { once: true });
        current.promise.then(
          (value) => finish(null, value),
          (error) => finish(error),
        );
      });
    },
    clear() {
      generation += 1;
      done.clear();
      for (const operation of inflight.values()) operation.controller.abort();
      inflight.clear();
    },
    size: () => done.size,
  };
}

export const hydroCache = createCache();

// ---- USGS -------------------------------------------------------------------------------
export function usgsLatestUrl(bbox) {
  const q = new URLSearchParams({
    f: 'json',
    bbox: bbox.join(','),
    parameter_code: USGS_PARAMETER_CODES.join(','),
    limit: '3000',
    properties:
      'monitoring_location_id,parameter_code,value,time,unit_of_measure,approval_status,qualifier,statistic_id',
  });
  return `${USGS_BASE}/collections/latest-continuous/items?${q}`;
}

export async function fetchUsgsStations(bbox, opts = {}) {
  const snapped = snapBbox(bbox);
  const { value, cached } = await (opts.cache || hydroCache).get(
    `usgs:${snapped.join(',')}`,
    USGS_TTL_MS,
    async (signal) => {
      const json = await getJson(usgsLatestUrl(snapped), { ...opts, signal });
      const retrievedAt = Date.now();
      return {
        stations: normalizeUsgs(json.features || [], [], retrievedAt),
        truncated: (json.links || []).some((l) => l.rel === 'next'),
        retrievedAt,
      };
    },
    opts.signal,
  );
  return { ...value, cached };
}

export async function fetchUsgsSite(stationId, opts = {}) {
  const { value } = await (opts.cache || hydroCache).get(
    `usgs-site:${stationId}`,
    EA_STATIONS_TTL_MS,
    async (signal) => {
      const json = await getJson(
        `${USGS_BASE}/collections/monitoring-locations/items/${encodeURIComponent(stationId)}?f=json`,
        { ...opts, signal },
      );
      return normalizeUsgsSite(json);
    },
    opts.signal,
  );
  return value;
}

// ---- UK Environment Agency --------------------------------------------------------------
export function eaStationsUrl(lat, lng, distKm) {
  const q = new URLSearchParams({
    parameter: 'level',
    lat: lat.toFixed(3),
    long: lng.toFixed(3),
    dist: String(Math.min(100, Math.max(1, Math.ceil(distKm)))),
    _limit: '500',
  });
  return `${EA_BASE}/id/stations?${q}`;
}

export async function fetchEaStations(bbox, opts = {}) {
  const snapped = snapBbox(bbox, 0.5);
  const lat = (snapped[1] + snapped[3]) / 2;
  const lng = (snapped[0] + snapped[2]) / 2;
  // Radius covering the snapped box, capped at the API's 100 km.
  const halfLat = ((snapped[3] - snapped[1]) / 2) * 111;
  const halfLng = ((snapped[2] - snapped[0]) / 2) * 111 * Math.cos((lat * Math.PI) / 180);
  const distKm = Math.hypot(halfLat, halfLng);
  const stations = (
    await (opts.cache || hydroCache).get(
      `ea-stations:${snapped.join(',')}`,
      EA_STATIONS_TTL_MS,
      async (signal) => {
        const json = await getJson(eaStationsUrl(lat, lng, distKm), { ...opts, signal });
        return json.items || [];
      },
      opts.signal,
    )
  ).value;
  return { stations, truncatedByRadius: distKm > 100 };
}

// One national call, shared by every viewport, refreshed at most every 15 minutes.
export async function fetchEaReadings(opts = {}) {
  const { value, cached } = await (opts.cache || hydroCache).get(
    'ea-readings',
    EA_READINGS_TTL_MS,
    async (signal) => {
      const json = await getJson(`${EA_BASE}/data/readings?latest&parameter=level`, {
        ...opts,
        signal,
      });
      return { index: indexEaReadings(json.items || []), retrievedAt: Date.now() };
    },
    opts.signal,
  );
  return { ...value, cached };
}

export async function fetchEaObserved(bbox, opts = {}) {
  const [{ stations, truncatedByRadius }, readings] = await Promise.all([
    fetchEaStations(bbox, opts),
    fetchEaReadings(opts),
  ]);
  const inBox = stations.filter(
    (s) => s.long >= bbox[0] && s.long <= bbox[2] && s.lat >= bbox[1] && s.lat <= bbox[3],
  );
  return {
    stations: normalizeEa(inBox, readings.index, readings.retrievedAt),
    truncated: truncatedByRadius,
    retrievedAt: readings.retrievedAt,
    cached: readings.cached,
  };
}

// What may be requested for a viewport at all. Returns the reasons so the UI can say why a
// provider is not queried instead of showing a silent blank.
export function planViewport(bbox, zoom) {
  const area = bboxAreaDeg2(bbox);
  const usgs =
    zoom < USGS_MIN_ZOOM
      ? { ok: false, reason: 'zoom' }
      : !USGS_BBOXES.some((b) => bboxIntersects(bbox, b))
        ? { ok: false, reason: 'outside' }
        : area > USGS_MAX_AREA_DEG2
          ? { ok: false, reason: 'area' }
          : { ok: true };
  const ea =
    zoom < EA_MIN_ZOOM
      ? { ok: false, reason: 'zoom' }
      : !bboxIntersects(bbox, EA_BBOX)
        ? { ok: false, reason: 'outside' }
        : { ok: true };
  return { usgs, ea };
}
