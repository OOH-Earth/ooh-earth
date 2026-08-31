import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTION_CLASS,
  assessAutopilotRollback,
  buildRemediationPlan,
  capabilityCoverage,
  classifyAction,
  diagnoseAutopilot,
  nextBestAction,
  prioritizeAttention,
} from './autopilotReasoning.js';

const now = 1_800_000_000_000;
const snapshot = (service, overrides = {}) => ({
  service,
  status: 'HEALTHY',
  evidence_status: 'VERIFIED',
  updated_at: now - 1_000,
  ...overrides,
});

test('detects shared and environment-specific degradation deterministically', () => {
  const shared = diagnoseAutopilot({
    now,
    evidence: {
      production: [snapshot('map', { status: 'DEGRADED' })],
      backup: [snapshot('map', { status: 'DEGRADED' })],
    },
  });
  assert.equal(shared.diagnosis[0].category, 'SHARED_SERVICE_PATH');
  const local = diagnoseAutopilot({
    now,
    evidence: { production: [snapshot('map', { status: 'DEGRADED' })], backup: [snapshot('map')] },
  });
  assert.equal(local.diagnosis[0].category, 'ENVIRONMENT_SPECIFIC');
});

test('keeps missing, stale, and unverified capabilities distinct', () => {
  const diagnosis = diagnoseAutopilot({
    now,
    evidence: {
      production: [snapshot('fieldStats', { updated_at: now - 16 * 60 * 1000 })],
      backup: [],
    },
  });
  assert.equal(diagnosis.systemState, 'UNKNOWN');
  assert.ok(diagnosis.unknowns.includes('map'));
  assert.equal(
    capabilityCoverage({ production: new Map(), backup: new Map() }, now).current_verified,
    0,
  );
});

test('selects bounded priority and next action without pretending causation', () => {
  const diagnosis = diagnoseAutopilot({
    now,
    releaseCorrelated: true,
    evidence: { production: [snapshot('map', { status: 'DEGRADED' })], backup: [snapshot('map')] },
  });
  assert.equal(prioritizeAttention(diagnosis)[0].priority, 'P0');
  assert.match(nextBestAction(diagnosis).action, /map/i);
  assert.match(buildRemediationPlan(diagnosis).possible_remediation, /approval/i);
});

test('rollback requires release correlation and previous known-good evidence', () => {
  const diagnosis = diagnoseAutopilot({
    now,
    evidence: { production: [snapshot('map', { status: 'DEGRADED' })], backup: [snapshot('map')] },
  });
  assert.equal(assessAutopilotRollback(diagnosis).classification, 'INVESTIGATE');
  assert.equal(
    assessAutopilotRollback(diagnosis, { releaseCorrelated: true, previousKnownGoodVerified: true })
      .classification,
    'ROLLBACK RECOMMENDED',
  );
});

test('action simulator fails closed for dangerous operations', () => {
  assert.equal(classifyAction({ action: 'read bounded health' }), ACTION_CLASS.SAFE_VERIFICATION);
  assert.equal(classifyAction({ action: 'deploy Production' }), ACTION_CLASS.PROHIBITED);
  assert.equal(classifyAction({ action: 'delete an account' }), ACTION_CLASS.PROHIBITED);
  assert.equal(
    classifyAction({ action: 'POST an arbitrary HTTP mutation' }),
    ACTION_CLASS.PROHIBITED,
  );
  assert.equal(classifyAction({ action: 'write a Base44 entity' }), ACTION_CLASS.PROHIBITED);
  assert.equal(
    classifyAction({ action: 'inspect release evidence' }),
    ACTION_CLASS.SAFE_VERIFICATION,
  );
});
