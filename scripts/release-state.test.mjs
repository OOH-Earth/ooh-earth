import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertCertificationGate,
  assertProductionGate,
  canTransition,
  transitionRelease,
} from './release-state.mjs';

const candidate = { git_sha: 'a'.repeat(40), release_state: 'CANDIDATE', evidence: {} };

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
  assert.equal(assertProductionGate(backup), true);
  assert.throws(() => assertCertificationGate(backup), /PRODUCTION_VERIFIED/);
  assert.equal(
    assertCertificationGate({
      ...backup,
      release_state: 'PRODUCTION_VERIFIED',
      production: { state: 'PRODUCTION_VERIFIED' },
    }),
    true,
  );
});
