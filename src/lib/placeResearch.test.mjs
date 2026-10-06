import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildUsgsQuery,
  buildUsgsQueryUrl,
  createPlaceResearchClient,
  normalizeUsgsFeature,
  validatePublicCoordinates,
} from './placeResearch.js';

const publicPlace = { lat: 0, lng: 0 };

function response(payload, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name.toLowerCase()] ?? null },
    json: async () => payload,
  };
}

function feature(id, time = Date.parse('2026-10-01T12:00:00Z')) {
  return {
    type: 'Feature',
    id,
    properties: {
      title: `Event ${id}`,
      mag: 2,
      time,
      url: `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`,
    },
    geometry: { type: 'Point', coordinates: [0.1, 0.2, 4] },
  };
}

test('accepts zero coordinates and rejects invalid or restricted coordinates', () => {
  assert.deepEqual(validatePublicCoordinates(publicPlace), publicPlace);
  assert.throws(() => validatePublicCoordinates({ lat: 91, lng: 0 }), /outside geographic bounds/);
  assert.throws(
    () => validatePublicCoordinates({ lat: 0, lng: -181 }),
    /outside geographic bounds/,
  );
  assert.throws(() => validatePublicCoordinates({ lat: Number.NaN, lng: 0 }), /unavailable/);
  assert.throws(
    () => validatePublicCoordinates({ ...publicPlace, coordinatePrivacy: 'restricted' }),
    /restricted coordinates/,
  );
});

test('canonical bounded requests share concurrent work and preserve retrieval time on cache hits', async () => {
  let calls = 0;
  let clock = Date.parse('2026-10-06T12:00:00Z');
  let release;
  const fetchImpl = async (url, options) => {
    calls += 1;
    assert.equal(options.credentials, 'omit');
    assert.equal(options.referrerPolicy, 'no-referrer');
    assert.match(url, /limit=5/);
    assert.match(url, /maxradiuskm=100/);
    await new Promise((resolve) => {
      release = resolve;
    });
    return response({
      type: 'FeatureCollection',
      features: [feature('same'), feature('same'), feature('distinct')],
    });
  };
  const client = createPlaceResearchClient({ fetchImpl, now: () => clock });
  const first = client.request({ ...publicPlace, now: clock });
  const second = client.request({ ...publicPlace, now: clock + 20_000 });
  assert.equal(calls, 1);
  release();
  const [a, b] = await Promise.all([first, second]);
  assert.equal(a.items.length, 2);
  assert.equal(b.items.length, 2);
  assert.equal(a.items[0].retrievedAt, b.items[0].retrievedAt);
  const cached = await client.request({ ...publicPlace, now: clock });
  assert.equal(calls, 1);
  assert.equal(cached.cacheHit, true);
  assert.equal(cached.retrievedAt, a.retrievedAt);
  clock += 5 * 60 * 1000;
  const refreshed = client.request({ ...publicPlace, now: clock });
  assert.equal(calls, 2);
  release();
  await refreshed;
});

test('retries one transient response, but clears failure for a later deliberate retry', async () => {
  let calls = 0;
  let shouldSucceed = false;
  const fetchImpl = async () => {
    calls += 1;
    if (!shouldSucceed) return response({ error: 'offline' }, 503);
    return response({ type: 'FeatureCollection', features: [feature('recovered')] });
  };
  const client = createPlaceResearchClient({ fetchImpl });
  await assert.rejects(client.request(publicPlace), /USGS returned 503/);
  assert.equal(calls, 2, 'one retry is allowed for a transient failure');
  shouldSucceed = true;
  const result = await client.request(publicPlace);
  assert.equal(result.items[0].providerEventId, 'recovered');
  assert.equal(calls, 3, 'failed in-flight state must not poison a later retry');
});

test('honours Retry-After for a transient response', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls === 1) return response({ error: 'busy' }, 429, { 'retry-after': '0' });
    return response({ type: 'FeatureCollection', features: [feature('retry-after')] });
  };
  const result = await createPlaceResearchClient({ fetchImpl }).request(publicPlace);
  assert.equal(result.items[0].providerEventId, 'retry-after');
  assert.equal(calls, 2);
});

test('one abandoned consumer does not cancel the shared request for another consumer', async () => {
  let release;
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    await new Promise((resolve) => {
      release = resolve;
    });
    return response({ type: 'FeatureCollection', features: [feature('shared-consumer')] });
  };
  const client = createPlaceResearchClient({ fetchImpl });
  const abandoned = client.request(publicPlace);
  const surviving = client.request(publicPlace);
  assert.equal(calls, 1);
  release();
  await abandoned;
  const result = await surviving;
  assert.equal(result.items[0].providerEventId, 'shared-consumer');
  assert.equal(calls, 1);
});

test('rejects malformed source data without merging distinct events', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return response({
      type: 'FeatureCollection',
      features: [feature('one'), feature('one'), feature('two'), { type: 'Feature' }],
    });
  };
  const client = createPlaceResearchClient({ fetchImpl });
  const result = await client.request(publicPlace);
  assert.deepEqual(
    result.items.map((item) => item.providerEventId),
    ['one', 'two'],
  );
  assert.equal(calls, 1);
  assert.equal(
    normalizeUsgsFeature(feature('bad'), new Date().toISOString()).sourceUrl.startsWith('https://'),
    true,
  );
  await assert.rejects(
    createPlaceResearchClient({
      fetchImpl: async () => response({ type: 'FeatureCollection', features: {} }),
    }).request(publicPlace),
    /invalid feature collection/,
  );
});

test('query includes bounded time window and stable ordering', () => {
  const query = buildUsgsQuery({ ...publicPlace, now: Date.parse('2026-10-06T12:34:56Z') });
  const url = buildUsgsQueryUrl(query);
  assert.match(url, /starttime=2026-09-06T12%3A34%3A00.000Z/);
  assert.match(url, /endtime=2026-10-06T12%3A34%3A00.000Z/);
  assert.match(url, /eventtype=earthquake/);
});
