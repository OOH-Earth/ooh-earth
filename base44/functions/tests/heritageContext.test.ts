import { assertEquals, assertMatch } from 'jsr:@std/assert@1';
import { resolveHeritageContext } from '../heritageContext/handler.ts';

function providerResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/sparql-results+json' },
  });
}

const row = {
  item: { type: 'uri', value: 'http://www.wikidata.org/entity/Q123' },
  itemLabel: { 'xml:lang': 'en', type: 'literal', value: 'Example Heritage Site' },
  coord: { type: 'literal', value: 'Point(-0.11 51.51)' },
};

Deno.test('normalizes bounded Wikidata heritage results with provenance and distance', async () => {
  let requestUrl = '';
  const result = await resolveHeritageContext({
    lat: 51.5,
    lng: -0.12,
    now: () => new Date('2026-09-05T00:00:00.000Z'),
    fetchImpl: async (input, init) => {
      requestUrl = input;
      assertEquals(init?.headers?.['user-agent'], 'OOH-Earth/1.0 (+https://oohearth.app)');
      return providerResponse({ results: { bindings: [row] } });
    },
  });
  assertEquals(result.status, 'available');
  assertEquals(result.evidence.length, 1);
  assertEquals(result.evidence[0].source_id, 'Q123');
  assertEquals(result.evidence[0].category, 'heritage');
  assertEquals(result.evidence[0].source_url, 'https://www.wikidata.org/entity/Q123');
  assertEquals(result.evidence[0].evidence_status, 'REPORTED');
  assertEquals(result.evidence[0].geographic_scope, 'NEAR');
  assertEquals(result.evidence[0].distance_m, 1310);
  assertMatch(requestUrl, /query=/);
  assertMatch(decodeURIComponent(requestUrl), /LIMIT 5/);
  assertEquals(decodeURIComponent(requestUrl).includes('notes'), false);
  assertEquals(decodeURIComponent(requestUrl).includes('created_by'), false);
});

Deno.test('empty, malformed, timeout and provider failures are isolated', async () => {
  const empty = await resolveHeritageContext({
    lat: 1,
    lng: 2,
    fetchImpl: async () => providerResponse({ results: { bindings: [] } }),
  });
  assertEquals(empty.status, 'empty');

  const malformed = await resolveHeritageContext({
    lat: 1,
    lng: 2,
    fetchImpl: async () => providerResponse({ nope: true }),
  });
  assertEquals(malformed.status, 'unavailable');

  const failed = await resolveHeritageContext({
    lat: 1,
    lng: 2,
    fetchImpl: async () => providerResponse({}, 429),
  });
  assertEquals(failed.status, 'unavailable');

  const timeout = await resolveHeritageContext({
    lat: 1,
    lng: 2,
    fetchImpl: async () => {
      throw new Error('timeout');
    },
  });
  assertEquals(timeout.status, 'unavailable');
});

Deno.test('invalid coordinates do not call the provider', async () => {
  let called = false;
  const result = await resolveHeritageContext({
    lat: 100,
    lng: 2,
    fetchImpl: async () => {
      called = true;
      return providerResponse({});
    },
  });
  assertEquals(result.reason, 'invalid_coordinates');
  assertEquals(called, false);
});
