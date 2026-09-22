// Plain Node test (no framework configured for frontend src in this repo --
// see docs/ops/ooh-earth/02-INCIDENT-MOBILE-LOCATIONS.md). Run with:
//   node src/lib/dedupeInFlight.test.mjs
import assert from 'node:assert/strict';
import { createDedupeInFlight } from './dedupeInFlight.js';

async function run(name, fn) {
  try {
    await fn();
    console.log('ok -', name);
  } catch (err) {
    console.error('FAIL -', name, '\n ', err.message);
    process.exitCode = 1;
  }
}

await run('concurrent calls with the same key share one underlying call', async () => {
  let starts = 0;
  const dedupe = createDedupeInFlight();
  const make = () =>
    dedupe('k', async () => {
      starts++;
      await new Promise((r) => setTimeout(r, 20));
      return 'result';
    });
  const [a, b, c] = await Promise.all([make(), make(), make()]);
  assert.equal(starts, 1, 'exactly one underlying call must run for 3 concurrent same-key callers');
  assert.deepEqual([a, b, c], ['result', 'result', 'result']);
});

await run('different keys never share a call', async () => {
  let starts = 0;
  const dedupe = createDedupeInFlight();
  const make = (key) =>
    dedupe(key, async () => {
      starts++;
      return key;
    });
  await Promise.all([make('a'), make('b')]);
  assert.equal(starts, 2, 'different keys must each start their own call');
});

await run('a settled call (success) does not block a later fresh call', async () => {
  let starts = 0;
  const dedupe = createDedupeInFlight();
  const make = () => dedupe('k', async () => ++starts);
  const first = await make();
  const second = await make();
  assert.equal(first, 1);
  assert.equal(second, 2, 'a call made after the first one settled must run fresh, not reuse the old result');
});

await run('a rejected in-flight call clears so the next call gets a fresh attempt', async () => {
  let attempt = 0;
  const dedupe = createDedupeInFlight();
  const make = () =>
    dedupe('k', async () => {
      attempt++;
      if (attempt === 1) throw new Error('first attempt fails');
      return 'recovered';
    });
  await assert.rejects(make(), /first attempt fails/);
  const result = await make();
  assert.equal(result, 'recovered', 'the failed entry must not be cached forever');
});

await run('concurrent callers sharing a call that rejects all see the same rejection', async () => {
  const dedupe = createDedupeInFlight();
  const make = () =>
    dedupe('k', async () => {
      throw new Error('shared failure');
    });
  const results = await Promise.allSettled([make(), make(), make()]);
  for (const r of results) {
    assert.equal(r.status, 'rejected');
    assert.match(r.reason.message, /shared failure/);
  }
});
