import test from 'node:test';
import assert from 'node:assert/strict';
import { normalise, requestObservations, urlFor } from './observations.js';

const bounds = { west: 100, east: 101, south: 13, north: 14 };
const row = (changes = {}) => ({
  uuid: 'one',
  geojson: { coordinates: [0, 0] },
  observed_on: '2026-10-07',
  uri: 'https://www.inaturalist.org/observations/123',
  license_code: 'cc-by',
  positional_accuracy: 0,
  taxon: { name: 'Example' },
  ...changes,
});

test('keeps zero coordinates and reported accuracy; rejects invalid and protected locations', () => {
  const result = normalise('animals', {
    results: [
      row(),
      row({ uuid: 'two', obscured: true }),
      row({ uuid: 'three', geoprivacy: 'private' }),
      row({ uuid: 'four', geojson: { coordinates: [999, 12] } }),
      row({ uuid: 'five', geojson: { coordinates: ['12', 45] } }),
      row({ uuid: 'six', geojson: { coordinates: [NaN, 0] } }),
    ],
  });
  assert.equal(result.points.length, 1);
  assert.equal(result.points[0].lat, 0);
  assert.equal(result.points[0].accuracy, 0);
});

test('deduplicates IDs and refuses unsafe or untraceable source URLs', () => {
  const result = normalise('plants', {
    results: [
      row(),
      row(),
      row({ uuid: 'two', uri: 'javascript:alert(1)' }),
      row({ uuid: 'three', uri: 'https://www.inaturalist.org.evil.test/observations/1' }),
      row({ uuid: 'four', uri: null }),
    ],
  });
  assert.equal(result.points.length, 1);
});

test('bounded fauna request includes Animalia, dates and privacy-safe field projection', () => {
  const url = new URL(urlFor('animals', bounds, '2026-04-11'));
  assert.equal(url.searchParams.get('taxon_id'), '1');
  assert.equal(url.searchParams.get('quality_grade'), 'research');
  assert.equal(url.searchParams.get('per_page'), '100');
  assert.equal(url.searchParams.get('d1'), '2026-04-11');
  assert.doesNotMatch(url.searchParams.get('fields'), /private_|photos|user/);
});

test('shared request survives one consumer abort, caches original retrieval time', async () => {
  const original = globalThis.fetch;
  let complete;
  let calls = 0;
  let options;
  globalThis.fetch = async (_url, opts) => {
    calls += 1;
    options = opts;
    return new Promise((resolve) => {
      complete = resolve;
    });
  };
  try {
    const firstCtl = new AbortController();
    const first = requestObservations('plants', bounds, '2026-04-12', firstCtl.signal);
    const abandoned = assert.rejects(first, { name: 'AbortError' });
    const second = requestObservations('plants', bounds, '2026-04-12');
    firstCtl.abort();
    assert.equal(options.signal.aborted, false);
    complete({ ok: true, json: async () => ({ results: [row()] }) });
    await abandoned;
    const data = await second;
    const cached = await requestObservations('plants', bounds, '2026-04-12');
    assert.equal(calls, 1);
    assert.equal(data.retrievedAt, cached.retrievedAt);
    assert.equal(options.credentials, 'omit');
    assert.equal(options.referrerPolicy, 'no-referrer');
  } finally {
    globalThis.fetch = original;
  }
});

test('failures clear the pending entry; a subsequent lookup can succeed', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return calls === 1
      ? { ok: false, status: 503 }
      : { ok: true, json: async () => ({ results: [] }) };
  };
  try {
    await assert.rejects(requestObservations('fungi', bounds, '2026-04-13'), /503/);
    await requestObservations('fungi', bounds, '2026-04-13');
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = original;
  }
});

test('invalid viewports fail without fetching', async () => {
  await assert.rejects(
    requestObservations('animals', { ...bounds, west: NaN }, '2026-04-13'),
    /Invalid/,
  );
  await assert.rejects(
    requestObservations('animals', { ...bounds, west: 179, east: -179 }, '2026-04-13'),
    /Invalid/,
  );
});

test('upstream result count cannot bypass the 100-record client cap', () => {
  const results = Array.from({ length: 120 }, (_, n) => row({ uuid: `cap-${n}` }));
  assert.equal(normalise('plants', { results, total_results: Infinity }).points.length, 100);
  assert.equal(normalise('plants', { results, total_results: Infinity }).total, 100);
});

test('Retry-After stops new provider requests without a retry loop', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return { ok: false, status: 429, headers: new Headers({ 'Retry-After': '60' }) };
  };
  try {
    await assert.rejects(requestObservations('animals', bounds, '2026-04-15'), /429/);
    await assert.rejects(requestObservations('animals', bounds, '2026-04-16'), /rate limited/);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
  }
});
