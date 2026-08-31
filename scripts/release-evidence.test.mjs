import test from 'node:test';
import assert from 'node:assert/strict';
import { publishCertification, validateCertificationEvidence } from './release-evidence.mjs';

const now = Date.parse('2026-08-30T20:00:00.000Z');
const manifest = {
  schema: 'ooh-earth.release-manifest.v3',
  git_sha: 'a'.repeat(40),
  certification_evidence: {},
};
const evidence = (overrides = {}) => ({
  candidate_sha: manifest.git_sha,
  environment: 'production',
  deployment_result: 'SUCCEEDED',
  certification_result: 'VERIFIED',
  public_smoke_result: 'VERIFIED',
  operational_health_result: 'VERIFIED',
  certified_at: '2026-08-30T19:00:00.000Z',
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
