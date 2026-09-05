import { assertEquals, assertMatch } from 'jsr:@std/assert@1';
import { resolveBiodiversityContext } from '../biodiversityContext/handler.ts';

function response(payload: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

const record = {
  key: 12345,
  datasetKey: 'dataset-1',
  scientificName: 'Example species',
  acceptedScientificName: 'Example accepted species',
  vernacularName: 'Example bird',
  eventDate: '2026-08-01',
  decimalLatitude: 51.51,
  decimalLongitude: -0.11,
  coordinateUncertaintyInMeters: 120,
  basisOfRecord: 'HUMAN_OBSERVATION',
  license: 'CC_BY_4_0',
  publisher: 'Example Museum',
};

Deno.test('normalizes an attributable nearby occurrence and bounded query', async () => {
  let requestUrl = '';
  const result = await resolveBiodiversityContext({
    lat: 51.5,
    lng: -0.12,
    now: () => new Date('2026-09-05T00:00:00.000Z'),
    fetchImpl: async (input, init) => {
      requestUrl = input;
      assertEquals(init?.headers?.['user-agent'], 'OOH-Earth/1.0 (+https://oohearth.app)');
      return response({ limit: 5, results: [record] });
    },
  });
  assertEquals(result.status, 'available');
  assertEquals(result.evidence.length, 1);
  assertEquals(result.evidence[0].value, 'Example accepted species');
  assertEquals(result.evidence[0].label, 'Example bird');
  assertEquals(result.evidence[0].source_id, 'dataset-1/12345');
  assertEquals(result.evidence[0].evidence_status, 'REPORTED');
  assertEquals(result.evidence[0].observed_at, '2026-08-01');
  assertEquals(result.evidence[0].coordinate_uncertainty_m, 120);
  assertEquals(result.evidence[0].distance_m, 1310);
  assertMatch(requestUrl, /^https:\/\/api\.gbif\.org\/v1\/occurrence\/search\?/);
  assertMatch(requestUrl, /distance=5km/);
  assertMatch(requestUrl, /limit=5/);
});

Deno.test('accepts only explicit CC0 or CC BY and excludes unsafe records', async () => {
  const result = await resolveBiodiversityContext({
    lat: 1,
    lng: 2,
    fetchImpl: async () =>
      response({
        results: [
          { ...record, key: 1, license: 'CC0_1_0' },
          { ...record, key: 2, license: 'CC_BY_NC_4_0' },
          { ...record, key: 3, license: 'unknown' },
          { ...record, key: 4, license: 'CC_BY_4_0', dataGeneralizations: 'coordinates rounded' },
          { ...record, key: 5, license: 'CC_BY_4_0', hasGeospatialIssues: true },
        ],
      }),
  });
  assertEquals(result.evidence.length, 1);
  assertEquals(result.evidence[0].license, 'CC0 1.0');
});

Deno.test('caps and deterministically sorts valid records without pagination', async () => {
  const results = Array.from({ length: 8 }, (_, index) => ({
    ...record,
    key: index + 1,
    decimalLatitude: 51.5 + index * 0.001,
    license: 'https://creativecommons.org/licenses/by/4.0/',
  }));
  const result = await resolveBiodiversityContext({
    lat: 51.5,
    lng: -0.12,
    fetchImpl: async () => response({ results }),
  });
  assertEquals(result.evidence.length, 5);
  assertEquals(
    result.evidence.every(
      (item, index, all) => index === 0 || item.distance_m >= all[index - 1].distance_m,
    ),
    true,
  );
});

Deno.test('empty, malformed, oversized, timeout and provider failures stay optional', async () => {
  const empty = await resolveBiodiversityContext({
    lat: 1,
    lng: 2,
    fetchImpl: async () => response({ results: [] }),
  });
  assertEquals(empty.status, 'empty');
  const malformed = await resolveBiodiversityContext({
    lat: 1,
    lng: 2,
    fetchImpl: async () => response({ nope: true }),
  });
  assertEquals(malformed.status, 'unavailable');
  const oversized = await resolveBiodiversityContext({
    lat: 1,
    lng: 2,
    fetchImpl: async () => response({ results: [] }, 200, { 'content-length': '300000' }),
  });
  assertEquals(oversized.reason, 'provider_response_too_large');
  const failed = await resolveBiodiversityContext({
    lat: 1,
    lng: 2,
    fetchImpl: async () => response({}, 429),
  });
  assertEquals(failed.status, 'unavailable');
  const timeout = await resolveBiodiversityContext({
    lat: 1,
    lng: 2,
    fetchImpl: async () => {
      throw new Error('timeout');
    },
  });
  assertEquals(timeout.status, 'unavailable');
});

Deno.test('invalid coordinates never reach GBIF', async () => {
  let called = false;
  const result = await resolveBiodiversityContext({
    lat: Number.NaN,
    lng: 2,
    fetchImpl: async () => {
      called = true;
      return response({ results: [] });
    },
  });
  assertEquals(result.reason, 'invalid_coordinates');
  assertEquals(called, false);
});
