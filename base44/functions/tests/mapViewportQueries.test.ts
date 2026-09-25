import { buildViewportLocationQueries } from '../../../src/lib/mapViewportQueries.js';

const assertEquals = (actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

Deno.test('builds one bounded query for an ordinary viewport', () => {
  assertEquals(buildViewportLocationQueries({ n: 10, s: -10, e: 20, w: -20 }), [
    { lat: { $gte: -10, $lte: 10 }, lng: { $gte: -20, $lte: 20 } },
  ]);
});

Deno.test('splits a dateline viewport without nested $or', () => {
  assertEquals(buildViewportLocationQueries({ n: 10, s: -10, e: -170, w: 170 }), [
    { lat: { $gte: -10, $lte: 10 }, lng: { $gte: 170 } },
    { lat: { $gte: -10, $lte: 10 }, lng: { $lte: -170 } },
  ]);
});

Deno.test('uses a latitude-only query for a world-width viewport', () => {
  assertEquals(buildViewportLocationQueries({ n: 90, s: -90, e: 180, w: -180 }), [
    { lat: { $gte: -90, $lte: 90 } },
  ]);
});
