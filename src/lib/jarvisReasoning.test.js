import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FRESHNESS,
  RISK,
  buildSystemBrief,
  freshnessOf,
  normalizeEvidence,
  rollbackAssessment,
} from './jarvisReasoning.js';

const now = 1_800_000_000_000;
const health = (overrides = {}) => ({
  services: [
    {
      service: 'fieldStats',
      environment: 'production',
      status: 'HEALTHY',
      evidence_status: 'VERIFIED',
      updated_at: now - 1_000,
      last_duration_ms: 42,
      ...overrides,
    },
  ],
});

test('classifies fresh verified health as healthy and low risk', () => {
  const brief = buildSystemBrief(
    normalizeEvidence({ environment: 'production', health: health(), now }),
  );
  assert.equal(brief.status, 'HEALTHY');
  assert.equal(brief.risk, RISK.LOW);
});
test('downgrades stale healthy evidence to unknown', () => {
  const evidence = normalizeEvidence({
    environment: 'production',
    health: health({ updated_at: now - 16 * 60 * 1000 }),
    now,
  });
  assert.equal(evidence.services[0].freshness, FRESHNESS.STALE);
  assert.equal(buildSystemBrief(evidence).status, 'UNKNOWN');
});
test('requires verified current evidence for degraded conclusion', () => {
  const brief = buildSystemBrief(
    normalizeEvidence({ environment: 'production', health: health({ status: 'DEGRADED' }), now }),
  );
  assert.equal(brief.status, 'DEGRADED');
  assert.equal(brief.risk, RISK.ELEVATED);
});
test('rejects cross-environment snapshots and malformed values safely', () => {
  const evidence = normalizeEvidence({
    environment: 'production',
    health: health({ environment: 'backup', status: '<script>' }),
    now,
  });
  assert.equal(evidence.services.length, 0);
  assert.equal(evidence.environment_mismatches, 1);
  assert.ok(
    buildSystemBrief(evidence).attention.some((item) => /different environment/.test(item)),
  );
  assert.equal(buildSystemBrief(evidence).status, 'UNKNOWN');
});
test('does not treat future evidence as current', () => {
  assert.equal(freshnessOf(now + 1, now), FRESHNESS.UNKNOWN);
});
test('does not recommend rollback from unknown evidence', () => {
  const brief = buildSystemBrief(normalizeEvidence({ environment: 'production', health: {}, now }));
  assert.equal(rollbackAssessment(brief).classification, 'INSUFFICIENT EVIDENCE');
});
