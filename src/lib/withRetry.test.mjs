// Plain Node test (no framework configured for frontend src in this repo --
// see docs/ops/ooh-earth/02-INCIDENT-MOBILE-LOCATIONS.md). Run with:
//   node src/lib/withRetry.test.mjs
import assert from 'node:assert/strict';
import { withRetry } from './withRetry.js';

async function run(name, fn) {
  try {
    await fn();
    console.log('ok -', name);
  } catch (err) {
    console.error('FAIL -', name, '\n ', err.message);
    process.exitCode = 1;
  }
}

const statusError = (status) => Object.assign(new Error(`status ${status}`), { status });

await run('succeeds immediately without retrying on a first-try success', async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    calls++;
    return 'ok';
  });
  assert.equal(result, 'ok');
  assert.equal(calls, 1, 'must not retry when the first call succeeds');
});

await run(
  'retries a 401 once and returns the retry result (the diagnosed session race)',
  async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls++;
        if (calls === 1) throw statusError(401);
        return 'recovered';
      },
      { delayMs: 5 },
    );
    assert.equal(result, 'recovered');
    assert.equal(calls, 2, 'must call exactly twice: the original attempt plus one retry');
  },
);

await run('retries a plain network error with no status at all', async () => {
  let calls = 0;
  const result = await withRetry(
    async () => {
      calls++;
      if (calls === 1) throw new Error('network error, no status');
      return 'ok';
    },
    { delayMs: 5 },
  );
  assert.equal(result, 'ok');
  assert.equal(calls, 2);
});

for (const status of [408, 429, 502, 503, 504]) {
  await run(`retries a transient ${status}`, async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls++;
        if (calls === 1) throw statusError(status);
        return 'ok';
      },
      { delayMs: 5 },
    );
    assert.equal(result, 'ok');
    assert.equal(calls, 2);
  });
}

for (const status of [400, 403, 404, 422]) {
  await run(`does NOT retry a deterministic client error (${status})`, async () => {
    let calls = 0;
    await assert.rejects(
      withRetry(
        async () => {
          calls++;
          throw statusError(status);
        },
        { delayMs: 5 },
      ),
    );
    assert.equal(
      calls,
      1,
      'a deterministic client error must fail on the first attempt, never retried',
    );
  });
}

await run('gives up and rethrows after exhausting the configured retries', async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      withRetry(
        async () => {
          calls++;
          throw statusError(401);
        },
        { retries: 1, delayMs: 5 },
      ),
    /status 401/,
  );
  assert.equal(calls, 2, 'must attempt exactly retries+1 times, no more');
});

await run('retries: 0 means no retry at all, even for a retryable status', async () => {
  let calls = 0;
  await assert.rejects(() =>
    withRetry(
      async () => {
        calls++;
        throw statusError(401);
      },
      { retries: 0 },
    ),
  );
  assert.equal(calls, 1);
});

await run('waits at least delayMs before retrying', async () => {
  let calls = 0;
  const started = Date.now();
  await withRetry(
    async () => {
      calls++;
      if (calls === 1) throw statusError(401);
      return 'ok';
    },
    { delayMs: 50 },
  );
  assert.ok(Date.now() - started >= 45, 'should have waited close to delayMs before the retry');
});

await run(
  'respects a Retry-After header (seconds) on a 429 instead of the default delay',
  async () => {
    let calls = 0;
    const started = Date.now();
    const err = statusError(429);
    err.originalError = { response: { headers: { 'retry-after': '1' } } };
    await withRetry(
      async () => {
        calls++;
        if (calls === 1) throw err;
        return 'ok';
      },
      { delayMs: 5 }, // deliberately much shorter than Retry-After, to prove it's overridden
    );
    const elapsed = Date.now() - started;
    assert.ok(elapsed >= 950, `expected to wait ~1000ms per Retry-After, only waited ${elapsed}ms`);
  },
);
