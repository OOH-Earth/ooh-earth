import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCertificationEvidence, classifyServiceChecks } from './release-certification.mjs';

const checks = {
  fieldStats: { status: 200 },
  map: { status: 200 },
  submitOffline: { status: 400, validation_boundary: true },
  runtimeHealth: { status: 200, release: 'abc1234' },
};

test('certification requires every bounded check and exact runtime release', () => {
  assert.equal(classifyServiceChecks({ checks }, 'abc1234').healthy, true);
  assert.equal(
    classifyServiceChecks({ checks: { ...checks, map: { status: 503 } } }, 'abc1234').healthy,
    false,
  );
  assert.equal(classifyServiceChecks({ checks }, 'different').healthy, false);
});

test('evidence preserves candidate, environment, and service check provenance', () => {
  const evidence = buildCertificationEvidence({
    candidateSha: 'abc1234',
    environment: 'backup',
    certifiedAt: '2026-09-07T00:00:00.000Z',
    checks,
  });
  assert.equal(evidence.candidate_sha, 'abc1234');
  assert.equal(evidence.environment, 'backup');
  assert.equal(evidence.operational_health_result, 'VERIFIED');
  assert.equal(evidence.service_checks.runtimeHealth.release, 'abc1234');
});
