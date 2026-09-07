import { assertEquals, assertMatch } from 'jsr:@std/assert';
import { resolveProductLookup } from '../productLookup/handler.ts';

const response = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

Deno.test('normalizes a bounded product response with field provenance', async () => {
  let requested = '';
  const result = await resolveProductLookup({
    code: '3017620422003',
    now: () => new Date('2026-09-06T00:00:00Z'),
    fetchImpl: async (input, init) => {
      requested = input;
      assertEquals(init?.headers?.['user-agent'], 'OOH-Earth/1.0 (https://oohearth.app)');
      return response({
        status: 'success',
        product: {
          product_name: 'Example spread',
          brands: 'Example brand',
          origins: 'Italy',
          manufacturing_places: '',
        },
      });
    },
  });
  assertMatch(requested, /api\/v3\/product\/3017620422003\.json/);
  assertEquals(result.status, 'available');
  assertEquals(result.product?.fields.origins.value, 'Italy');
  assertEquals(result.product?.fields.origins.evidence_class, 'DATASET_REPORTED');
  assertEquals(result.product?.fields.manufacturing_places.evidence_class, 'UNKNOWN');
  assertEquals(result.product?.fields.origins.source_id, '3017620422003');
});

Deno.test('returns empty without inventing a product', async () => {
  const result = await resolveProductLookup({
    code: '3017620422003',
    fetchImpl: async () => response({ status: 'not found', product: null }),
  });
  assertEquals(result.status, 'empty');
  assertEquals(result.product, null);
});

Deno.test('rejects invalid identifiers before any provider request', async () => {
  let called = false;
  const result = await resolveProductLookup({
    code: 'not-a-code',
    fetchImpl: async () => {
      called = true;
      return response({});
    },
  });
  assertEquals(result.reason, 'invalid_identifier');
  assertEquals(called, false);
});

Deno.test('isolates provider status, malformed, and oversized responses', async () => {
  for (const result of [
    await resolveProductLookup({ code: '3017620422003', fetchImpl: async () => response({}, 429) }),
    await resolveProductLookup({
      code: '3017620422003',
      fetchImpl: async () => new Response('{', { status: 200 }),
    }),
    await resolveProductLookup({
      code: '3017620422003',
      fetchImpl: async () => new Response('x'.repeat(256001), { status: 200 }),
    }),
  ]) {
    assertEquals(result.status, 'unavailable');
  }
});
