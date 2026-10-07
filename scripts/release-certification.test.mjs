import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertCertificationPreconditions,
  buildCertificationEvidence,
  classifyServiceChecks,
  environmentConfig,
} from './release-certification.mjs';

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

test('certification requires declared functions in the bound environment and candidate', () => {
  const required_resources = [
    { name: 'productLookup', environment: 'backup', candidate_sha: 'abc1234', status: 'VERIFIED' },
  ];
  assert.equal(
    classifyServiceChecks({ checks: { ...checks, required_resources } }, 'abc1234', 'backup', [
      'productLookup',
    ]).healthy,
    true,
  );
  assert.equal(
    classifyServiceChecks({ checks: { ...checks, required_resources: [] } }, 'abc1234', 'backup', [
      'productLookup',
    ]).healthy,
    false,
  );
  assert.equal(
    classifyServiceChecks(
      {
        checks: {
          ...checks,
          required_resources: [{ ...required_resources[0], environment: 'production' }],
        },
      },
      'abc1234',
      'backup',
      ['productLookup'],
    ).healthy,
    false,
  );
  assert.equal(classifyServiceChecks({ checks }, 'abc1234', 'backup', []).healthy, true);
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

test('production certification is symmetric with backup, not a copy of the candidate manifest', () => {
  assert.equal(classifyServiceChecks({ checks }, 'abc1234', 'production').healthy, true);
  assert.equal(
    classifyServiceChecks({ checks: { ...checks, map: { status: 503 } } }, 'abc1234', 'production')
      .healthy,
    false,
  );
  // Stale write-path telemetry from an old release must still fail closed —
  // certification never treats "unknown" or mismatched release as healthy.
  assert.equal(
    classifyServiceChecks(
      { checks: { ...checks, runtimeHealth: { status: 200, release: 'stale-old-sha' } } },
      'abc1234',
      'production',
    ).healthy,
    false,
  );
  assert.equal(
    classifyServiceChecks(
      { checks: { ...checks, runtimeHealth: { status: 200, release: undefined } } },
      'abc1234',
      'production',
    ).healthy,
    false,
  );
});

test('environmentConfig only recognizes backup and production', () => {
  assert.equal(environmentConfig('backup').verifiedState, 'BACKUP_VERIFIED');
  assert.equal(environmentConfig('production').verifiedState, 'PRODUCTION_VERIFIED');
  assert.throws(() => environmentConfig('staging'), /Unknown release environment/);
});

test('production certification preconditions require PRODUCTION_DEPLOYED and a verified backup', () => {
  const deployed = {
    release_state: 'PRODUCTION_DEPLOYED',
    backup: { state: 'BACKUP_VERIFIED' },
  };
  assert.equal(
    assertCertificationPreconditions(deployed, 'production').appId,
    environmentConfig('production').appId,
  );

  assert.throws(
    () => assertCertificationPreconditions({ release_state: 'BACKUP_DEPLOYED' }, 'production'),
    /Certification requires PRODUCTION_DEPLOYED/,
  );
  assert.throws(
    () =>
      assertCertificationPreconditions(
        { release_state: 'PRODUCTION_DEPLOYED', backup: { state: 'BACKUP_DEPLOYED' } },
        'production',
      ),
    /backup.state=BACKUP_VERIFIED/,
  );
});

test('backup certification preconditions require BACKUP_DEPLOYED', () => {
  assert.equal(
    assertCertificationPreconditions({ release_state: 'BACKUP_DEPLOYED' }, 'backup').verifiedState,
    'BACKUP_VERIFIED',
  );
  assert.throws(
    () => assertCertificationPreconditions({ release_state: 'CI_QUALIFIED' }, 'backup'),
    /Certification requires BACKUP_DEPLOYED/,
  );
});
