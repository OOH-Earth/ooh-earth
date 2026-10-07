import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertCertificationGate,
  assertProductionGate,
  canTransition,
  recordPreprodE2eEvidence,
  transitionRelease,
} from './release-state.mjs';

const candidate = { git_sha: 'a'.repeat(40), release_state: 'CANDIDATE', evidence: {} };
const withPreprodEvidence = (record) =>
  recordPreprodE2eEvidence(record, { candidateSha: record.git_sha });

test('allows only ordered release transitions', () => {
  assert.equal(canTransition('CANDIDATE', 'CI_QUALIFIED'), true);
  assert.equal(canTransition('CANDIDATE', 'PRODUCTION_DEPLOYED'), false);
  assert.equal(canTransition('BACKUP_VERIFIED', 'PRODUCTION_APPROVED'), true);
});

test('rejects Production before BACKUP verification', () => {
  assert.throws(
    () => assertProductionGate({ ...candidate, release_state: 'CI_QUALIFIED' }),
    /BACKUP_VERIFIED/,
  );
  assert.throws(
    () => assertProductionGate({ ...candidate, release_state: 'PRODUCTION_APPROVED' }),
    /backup.state/,
  );
});

test('requires candidate identity and records bounded evidence', () => {
  const qualified = transitionRelease(candidate, 'CI_QUALIFIED', {
    CI_QUALIFIED: { run: 'github-actions' },
  });
  assert.equal(qualified.release_state, 'CI_QUALIFIED');
  assert.equal(qualified.evidence.CI_QUALIFIED.run, 'github-actions');
  assert.throws(() => transitionRelease({ ...candidate, git_sha: 'not-a-sha' }, 'CI_QUALIFIED'));
});

test('keeps environment gates synchronized with release state', () => {
  const ci = transitionRelease(candidate, 'CI_QUALIFIED');
  const deployed = transitionRelease(ci, 'BACKUP_DEPLOYED');
  const verified = transitionRelease(deployed, 'BACKUP_VERIFIED');
  assert.equal(verified.backup.state, 'BACKUP_VERIFIED');
  const approved = transitionRelease(verified, 'PRODUCTION_APPROVED');
  assert.equal(approved.production.state, 'PRODUCTION_APPROVED');
});

test('Production gate and certification gate fail closed', () => {
  const backup = {
    ...candidate,
    release_state: 'BACKUP_VERIFIED',
    backup: { state: 'BACKUP_VERIFIED' },
  };
  assert.equal(assertProductionGate(withPreprodEvidence(backup)), true);
  assert.throws(() => assertCertificationGate(backup), /PRODUCTION_VERIFIED/);
  assert.equal(
    assertCertificationGate({
      ...withPreprodEvidence(backup),
      release_state: 'PRODUCTION_VERIFIED',
      production: { state: 'PRODUCTION_VERIFIED' },
    }),
    true,
  );
});

test('Production gate requires a real-backend preprod E2E pass for this exact candidate', () => {
  const backup = {
    ...candidate,
    release_state: 'BACKUP_VERIFIED',
    backup: { state: 'BACKUP_VERIFIED' },
  };
  // No preprod E2E evidence recorded at all -- BACKUP_VERIFIED alone is not
  // enough, unlike before this candidate/gate hardening pass.
  assert.throws(() => assertProductionGate(backup), /PREPROD_E2E_VERIFIED/);

  // recordPreprodE2eEvidence() itself refuses to record evidence for a SHA
  // that doesn't match the manifest's own candidate (see below) -- but a
  // manifest could still be reused/mutated to point at a new git_sha after
  // evidence for an older one was recorded (e.g. `git_sha` field edited
  // without regenerating the manifest). Simulate that directly: evidence
  // for the old candidate, git_sha now pointing at a newer one.
  const withStaleEvidence = { ...withPreprodEvidence(backup), git_sha: 'b'.repeat(40) };
  assert.throws(() => assertProductionGate(withStaleEvidence), /does not carry forward/);

  // Evidence for the exact matching candidate SHA passes.
  assert.equal(assertProductionGate(withPreprodEvidence(backup)), true);

  // recordPreprodE2eEvidence itself refuses a SHA mismatch outright.
  assert.throws(
    () => recordPreprodE2eEvidence(backup, { candidateSha: 'wrong-sha' }),
    /does not match the manifest's candidate/,
  );
});

test('production deploy can only reach verified/certified through canonical transitions', () => {
  const deployed = {
    ...candidate,
    release_state: 'PRODUCTION_DEPLOYED',
    backup: { state: 'BACKUP_VERIFIED' },
    production: { state: 'PRODUCTION_DEPLOYED' },
  };
  assert.throws(() => assertCertificationGate(deployed), /PRODUCTION_VERIFIED/);
  const verified = transitionRelease(deployed, 'PRODUCTION_VERIFIED');
  assert.equal(verified.release_state, 'PRODUCTION_VERIFIED');
  assert.equal(verified.production.state, 'PRODUCTION_VERIFIED');
  assert.equal(assertCertificationGate(verified), true);
  const certified = transitionRelease(verified, 'CERTIFIED');
  assert.equal(certified.production.state, 'CERTIFIED');
  // Nothing can skip straight from a bare deploy to certified.
  assert.equal(canTransition('PRODUCTION_DEPLOYED', 'CERTIFIED'), false);
});
