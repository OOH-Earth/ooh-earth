import test from 'node:test';
import assert from 'node:assert/strict';
import { publishCertification, validateCertificationEvidence } from './release-evidence.mjs';

const now = Date.parse('2026-08-30T20:00:00.000Z');
const manifest = {
  schema: 'ooh-earth.release-manifest.v3',
  git_sha: 'a'.repeat(40),
  certification_evidence: {},
};
const evidence = (overrides = {}, required = []) => ({
  candidate_sha: manifest.git_sha,
  environment: 'production',
  deployment_result: 'SUCCEEDED',
  certification_result: 'VERIFIED',
  public_smoke_result: 'VERIFIED',
  operational_health_result: 'VERIFIED',
  certified_at: '2026-08-30T19:00:00.000Z',
  required_resources: required,
  ...overrides,
});

test('publishes only verified, matching, bounded evidence', () => {
  const result = publishCertification(manifest, evidence(), now);
  assert.equal(result.certification_evidence.production.candidate_sha, manifest.git_sha);
  assert.equal(result.certification_evidence.production.certification_result, 'VERIFIED');
  assert.equal(result.certification_evidence.production.environment, 'production');
});

test('rejects failed, mismatched, wrong-environment, future, and malformed evidence', () => {
  for (const bad of [
    { certification_result: 'FAILED' },
    { deployment_result: 'FAILED' },
    { candidate_sha: 'b'.repeat(40) },
    { environment: 'qa' },
    { certified_at: '2026-08-30T21:00:00.000Z' },
    { certification_result: '<script>' },
  ])
    assert.throws(() => validateCertificationEvidence(manifest, evidence(bad), now));
});

test('rejects an older overwrite and accepts a newer idempotent publication', () => {
  const newer = publishCertification(
    manifest,
    evidence({ certified_at: '2026-08-30T19:30:00.000Z' }),
    now,
  );
  assert.throws(() => publishCertification(newer, evidence(), now));
  const repeated = publishCertification(
    newer,
    evidence({ certified_at: '2026-08-30T19:30:00.000Z' }),
    now,
  );
  assert.deepEqual(repeated.certification_evidence, newer.certification_evidence);
});

test('certification requires every explicitly declared resource in the target environment', () => {
  const required = [
    {
      name: 'productLookup',
      environment: 'production',
      candidate_sha: manifest.git_sha,
      status: 'VERIFIED',
    },
  ];
  const release = { ...manifest, required_functions: 'productLookup' };
  assert.doesNotThrow(() => validateCertificationEvidence(release, evidence({}, required), now));
  assert.throws(() => validateCertificationEvidence(release, evidence(), now), /every declared/);
  assert.throws(
    () =>
      validateCertificationEvidence(
        release,
        evidence({}, [{ ...required[0], environment: 'backup' }]),
        now,
      ),
    /environment mismatch/,
  );
  assert.throws(
    () =>
      validateCertificationEvidence(
        release,
        evidence({}, [{ ...required[0], candidate_sha: 'b'.repeat(40) }]),
        now,
      ),
    /candidate mismatch/,
  );
  assert.throws(
    () =>
      validateCertificationEvidence(
        release,
        evidence({}, [{ ...required[0], status: 'MISSING' }]),
        now,
      ),
    /not verified/,
  );
});

test('frontend-only releases remain valid and unrelated functions are not inferred', () => {
  assert.doesNotThrow(() => validateCertificationEvidence(manifest, evidence(), now));
  const release = { ...manifest, required_functions: 'productLookup' };
  assert.doesNotThrow(() =>
    validateCertificationEvidence(
      release,
      evidence({}, [
        {
          name: 'productLookup',
          environment: 'production',
          candidate_sha: manifest.git_sha,
          status: 'VERIFIED',
        },
      ]),
      now,
    ),
  );
  assert.throws(
    () =>
      validateCertificationEvidence(
        release,
        evidence({}, [
          {
            name: 'fieldStats',
            environment: 'production',
            candidate_sha: manifest.git_sha,
            status: 'VERIFIED',
          },
        ]),
        now,
      ),
    /missing from evidence/,
  );
});

test('BACKUP and Production resource evidence remain independently bound', () => {
  const release = { ...manifest, required_functions: 'productLookup' };
  const backupEvidence = evidence({ environment: 'backup' }, [
    {
      name: 'productLookup',
      environment: 'backup',
      candidate_sha: manifest.git_sha,
      status: 'VERIFIED',
    },
  ]);
  const productionEvidence = evidence({}, [
    {
      name: 'productLookup',
      environment: 'production',
      candidate_sha: manifest.git_sha,
      status: 'VERIFIED',
    },
  ]);
  assert.doesNotThrow(() => validateCertificationEvidence(release, backupEvidence, now));
  assert.doesNotThrow(() => validateCertificationEvidence(release, productionEvidence, now));
  assert.throws(
    () =>
      validateCertificationEvidence(release, { ...backupEvidence, environment: 'production' }, now),
    /environment mismatch/,
  );
});
