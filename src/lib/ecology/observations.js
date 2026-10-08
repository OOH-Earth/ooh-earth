// Public observation metadata only; never fetch photos, user profiles or private coordinates.
const API = 'https://api.inaturalist.org/v2/observations';
const FIELDS =
  'uuid,observed_on,geojson,uri,license_code,obscured,geoprivacy,positional_accuracy,taxon.name,taxon.preferred_common_name';
const PER_PAGE = 100;
export const OBS_GROUPS = {
  plants: { id: 'plants', label: 'Plants', color: '#39FF14', params: { iconic_taxa: 'Plantae' } },
  fungi: { id: 'fungi', label: 'Fungi', color: '#FF9A3D', params: { taxon_id: '47169' } },
  animals: { id: 'animals', label: 'Animals', color: '#BF9FFF', params: { taxon_id: '1' } },
};
const cache = new Map();
const pending = new Map();
const TTL = 5 * 60000;
const MAX_CACHE = 32;

export function urlFor(group, b, since) {
  const q = new URLSearchParams({
    nelat: b.north.toFixed(4),
    nelng: b.east.toFixed(4),
    swlat: b.south.toFixed(4),
    swlng: b.west.toFixed(4),
    per_page: String(PER_PAGE),
    quality_grade: 'research',
    order_by: 'observed_on',
    order: 'desc',
    d1: since,
    fields: FIELDS,
    geo: 'true',
    ...OBS_GROUPS[group].params,
  });
  return `${API}?${q.toString()}`;
}

export function normalise(group, json) {
  const results = Array.isArray(json?.results) ? json.results : [];
  const points = [];
  for (const r of results) {
    const c = r?.geojson?.coordinates;
    if (
      r?.obscured ||
      ['obscured', 'private'].includes(r?.geoprivacy) ||
      !r?.uuid ||
      !Array.isArray(c) ||
      c.length < 2 ||
      !c.every(Number.isFinite) ||
      Math.abs(c[0]) > 180 ||
      Math.abs(c[1]) > 90
    )
      continue;
    const id = `${group}:${r.uuid}`;
    if (points.some((p) => p.id === id)) continue;
    let uri = null;
    try {
      const u = new URL(r.uri);
      if (
        u.protocol === 'https:' &&
        u.hostname === 'www.inaturalist.org' &&
        /^\/observations\/[^/?#]+$/.test(u.pathname)
      )
        uri = u.href;
    } catch {
      /* A source URL is never trusted as markup or a protocol. */
    }
    if (!uri) continue;
    points.push({
      id,
      group,
      lat: c[1],
      lng: c[0],
      name: r.taxon?.preferred_common_name || r.taxon?.name || 'Unidentified',
      scientific: r.taxon?.name || 'Unknown',
      observedOn: r.observed_on || null,
      uri,
      license: r.license_code || null,
      accuracy:
        Number.isFinite(r.positional_accuracy) && r.positional_accuracy >= 0
          ? r.positional_accuracy
          : null,
    });
  }
  return { points, total: Number(json?.total_results) || points.length };
}

export function requestObservations(group, bounds, since, signal) {
  if (
    !OBS_GROUPS[group] ||
    !bounds ||
    !Object.values(bounds).every(Number.isFinite) ||
    bounds.north <= bounds.south ||
    bounds.east <= bounds.west ||
    bounds.north > 90 ||
    bounds.south < -90 ||
    bounds.east > 180 ||
    bounds.west < -180
  )
    return Promise.reject(new Error('Invalid observation viewport'));
  const url = urlFor(group, bounds, since);
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL) return Promise.resolve(hit.data);
  if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
  let entry = pending.get(url);
  if (!entry) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 10000);
    entry = { ctl, users: 0, promise: null };
    const owned = entry;
    owned.promise = fetch(url, {
      signal: ctl.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`iNaturalist HTTP ${res.status}`);
        const json = await res.json();
        if (!Array.isArray(json?.results)) throw new Error('Malformed observation response');
        const data = { ...normalise(group, json), retrievedAt: new Date().toISOString() };
        cache.set(url, { at: Date.now(), data });
        while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
        return data;
      })
      .finally(() => {
        clearTimeout(timer);
        if (pending.get(url) === owned) pending.delete(url);
      });
    pending.set(url, owned);
  }
  entry.users += 1;
  const shared = entry;
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = (fn, value) => {
      if (finished) return;
      finished = true;
      signal?.removeEventListener('abort', abort);
      shared.users -= 1;
      if (!shared.users && pending.get(url) === shared) {
        pending.delete(url);
        shared.ctl.abort();
      }
      fn(value);
    };
    const abort = () => finish(reject, new DOMException('Aborted', 'AbortError'));
    signal?.addEventListener('abort', abort, { once: true });
    shared.promise.then(
      (data) => finish(resolve, data),
      (error) => finish(reject, error),
    );
  });
}
