import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HydroError,
  createCache,
  fetchEaObserved,
  fetchUsgsStations,
  planViewport,
  snapBbox,
  usgsLatestUrl,
} from './hydroApi.js';

const json = (body, status = 200) => ({
  ok: status < 200 || status >= 300 ? false : true,
  status,
  json: async () => body,
});
const feature = (id, value, time) => ({
  geometry: { coordinates: [-76.7, 39.2] },
  properties: {
    monitoring_location_id: id,
    parameter_code: '00060',
    value,
    time,
    unit_of_measure: 'ft^3/s',
  },
});
const BOX = [-77, 39, -76, 40];

test('USGS: success, then the same area is served from cache without a second request', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return json({ features: [feature('USGS-1', '5', new Date().toISOString())], links: [] });
  };
  const cache = createCache();
  const a = await fetchUsgsStations(BOX, { fetchImpl, cache });
  const b = await fetchUsgsStations([-76.9, 39.1, -76.1, 39.9], { fetchImpl, cache }); // snaps to same cell
  assert.equal(a.stations.length, 1);
  assert.equal(a.cached, false);
  assert.equal(b.cached, true);
  assert.equal(calls, 1);
});

test('USGS: concurrent identical requests share one in-flight call', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    await new Promise((r) => setTimeout(r, 10));
    return json({ features: [], links: [] });
  };
  const cache = createCache();
  await Promise.all([
    fetchUsgsStations(BOX, { fetchImpl, cache }),
    fetchUsgsStations(BOX, { fetchImpl, cache }),
  ]);
  assert.equal(calls, 1);
});

test('USGS: provider errors surface as typed errors and are not cached', async () => {
  const cache = createCache();
  await assert.rejects(
    () => fetchUsgsStations(BOX, { fetchImpl: async () => json({}, 503), cache }),
    (e) => e instanceof HydroError && e.kind === 'http' && e.status === 503,
  );
  const ok = await fetchUsgsStations(BOX, {
    fetchImpl: async () => json({ features: [], links: [] }),
    cache,
  });
  assert.equal(ok.stations.length, 0);
  await assert.rejects(
    () => fetchUsgsStations([0, 0, 1, 1], { fetchImpl: async () => json({}, 429), cache }),
    (e) => e.kind === 'http' && e.status === 429,
  );
  await assert.rejects(
    () =>
      fetchUsgsStations([5, 5, 6, 6], {
        fetchImpl: async () => {
          throw new TypeError('Failed to fetch');
        },
        cache,
      }),
    (e) => e.kind === 'network',
  );
});

test('USGS: a hung provider times out with a typed error', async () => {
  const fetchImpl = (_u, { signal }) =>
    new Promise((_, reject) =>
      signal.addEventListener('abort', () =>
        reject(Object.assign(new Error('x'), { name: 'AbortError' })),
      ),
    );
  await assert.rejects(
    () => fetchUsgsStations(BOX, { fetchImpl, cache: createCache(), timeoutMs: 30 }),
    (e) => e.kind === 'timeout',
  );
});

test('USGS: caller cancellation (rapid pan) aborts the request and reports aborted', async () => {
  const ctl = new AbortController();
  const fetchImpl = (_u, { signal }) =>
    new Promise((_, reject) =>
      signal.addEventListener('abort', () =>
        reject(Object.assign(new Error('x'), { name: 'AbortError' })),
      ),
    );
  const p = fetchUsgsStations(BOX, { fetchImpl, cache: createCache(), signal: ctl.signal });
  ctl.abort();
  await assert.rejects(
    () => p,
    (e) => e.kind === 'aborted',
  );
});

test('USGS: next link marks the result as truncated; empty viewport is an empty list, not an error', async () => {
  const t = await fetchUsgsStations(BOX, {
    fetchImpl: async () => json({ features: [], links: [{ rel: 'next' }] }),
    cache: createCache(),
  });
  assert.equal(t.truncated, true);
  assert.deepEqual(t.stations, []);
});

test('EA: one national readings call is shared across areas; stations are cached per area', async () => {
  const urls = [];
  const station = (ref, lat, long) => ({
    stationReference: ref,
    label: ref,
    riverName: 'River X',
    lat,
    long,
    measures: [
      { '@id': `m-${ref}`, parameter: 'level', qualifier: 'Stage', unitName: 'mAOD', period: 900 },
    ],
  });
  const fetchImpl = async (u) => {
    urls.push(u);
    if (u.includes('/data/readings'))
      return json({ items: [{ measure: 'm-a', dateTime: new Date().toISOString(), value: 1.2 }] });
    return json({ items: [station('a', 51.5, -0.5), station('b', 52.9, 0.9)] });
  };
  const cache = createCache();
  const r1 = await fetchEaObserved([-1, 51, 0, 52], { fetchImpl, cache });
  assert.equal(r1.stations.length, 1);
  assert.equal(r1.stations[0].measurements[0].freshness, 'current');
  await fetchEaObserved([0.5, 52.5, 1.5, 53.5], { fetchImpl, cache });
  assert.equal(urls.filter((u) => u.includes('/data/readings')).length, 1);
  assert.equal(urls.filter((u) => u.includes('/id/stations')).length, 2);
  await fetchEaObserved([-1, 51, 0, 52], { fetchImpl, cache });
  assert.equal(urls.length, 3);
});

test('EA: a reading-less station keeps NO observation instead of borrowing another reading', async () => {
  const fetchImpl = async (u) =>
    u.includes('/data/readings')
      ? json({ items: [] })
      : json({
          items: [
            {
              stationReference: 'z',
              label: 'Z',
              lat: 51.5,
              long: -0.5,
              measures: [
                { '@id': 'm-z', parameter: 'level', qualifier: 'Stage', unitName: 'mAOD' },
              ],
            },
          ],
        });
  const r = await fetchEaObserved([-1, 51, 0, 52], { fetchImpl, cache: createCache() });
  assert.equal(r.stations[0].measurements[0].value, null);
  assert.equal(r.stations[0].measurements[0].freshness, 'none');
});

test('planViewport: zoom and area gates, EA only where the UK box intersects', () => {
  assert.deepEqual(planViewport([-77, 39, -76, 40], 6).usgs, { ok: false, reason: 'zoom' });
  assert.deepEqual(planViewport([-90, 30, -70, 45], 8).usgs, { ok: false, reason: 'area' });
  assert.equal(planViewport([-77, 39, -76, 40], 9).usgs.ok, true);
  assert.deepEqual(planViewport([-77, 39, -76, 40], 9).ea, { ok: false, reason: 'outside' });
  assert.equal(planViewport([-1, 51, 0, 52], 9).ea.ok, true);
  assert.deepEqual(planViewport([-1, 51, 0, 52], 9).usgs, { ok: false, reason: 'outside' });
  assert.equal(planViewport([-158, 21, -157, 22], 9).usgs.ok, true); // Hawaii
});

test('snapBbox is outward and stable; the request URL is bounded', () => {
  assert.deepEqual(snapBbox([-76.9, 39.1, -76.1, 39.9]), [-77, 39, -76, 40]);
  const u = usgsLatestUrl(BOX);
  assert.match(u, /parameter_code=00060%2C00065/);
  assert.match(u, /properties=/);
});
