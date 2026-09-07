import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyHealthResponse, fetchHealthWithRetry, healthEndpoint } from './release-health.mjs';

test('health endpoint binds environment and candidate without accepting a caller hostname', () => {
  const url = new URL(healthEndpoint('backup', 'abc1234'));
  assert.equal(url.hostname, 'base44.app');
  assert.equal(url.searchParams.get('environment'), 'backup');
  assert.equal(url.searchParams.get('candidate_sha'), 'abc1234');
});

test('auth failures are not retried', async () => {
  let calls = 0;
  const result = await fetchHealthWithRetry({
    environment: 'backup',
    token: 'test-token',
    fetchImpl: async () => {
      calls++;
      return new Response(
        JSON.stringify({ error: 'Forbidden', reason_code: 'AUTHORIZATION_FAILURE' }),
        { status: 403 },
      );
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.reason_code, 'AUTHORIZATION_FAILURE');
  assert.equal(result.retryable, false);
});

test('transient health failure retries and can converge', async () => {
  let calls = 0;
  const result = await fetchHealthWithRetry({
    environment: 'backup',
    candidateSha: 'abc1234',
    token: 'test-token',
    sleep: async () => {},
    fetchImpl: async () => {
      calls++;
      if (calls === 1)
        return new Response(
          JSON.stringify({ reason_code: 'HEALTH_STORE_UNAVAILABLE', retryable: true }),
          { status: 503 },
        );
      return new Response(
        JSON.stringify({
          status: 'HEALTHY',
          evidence_status: 'VERIFIED',
          services: [],
          generated_at: Date.now(),
          reason_code: 'HEALTHY',
        }),
        { status: 200 },
      );
    },
  });
  assert.equal(calls, 2);
  assert.equal(result.status, 'HEALTHY');
  assert.equal(result.evidence_status, 'VERIFIED');
});

test('persistent unknown remains a failed closed diagnostic', async () => {
  let calls = 0;
  const result = await fetchHealthWithRetry({
    environment: 'backup',
    token: 'test-token',
    sleep: async () => {},
    fetchImpl: async () => {
      calls++;
      return new Response(
        JSON.stringify({
          status: 'UNKNOWN',
          evidence_status: 'INSUFFICIENT_DATA',
          reason_code: 'SERVICE_SNAPSHOT_STALE',
          retryable: true,
        }),
        { status: 200 },
      );
    },
  });
  assert.equal(calls, 3);
  assert.equal(result.status, 'UNKNOWN');
  assert.equal(result.retryable, true);
  assert.equal(
    classifyHealthResponse({ status: 404, payload: {}, environment: 'backup' }).reason_code,
    'ENDPOINT_NOT_FOUND',
  );
});
