import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FRESHNESS,
  RISK,
  buildSystemBrief,
  buildAttentionItems,
  changeSummary,
  DRIFT,
  freshnessOf,
  normalizeEvidence,
  releaseDrift,
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
  assert.equal(brief.status, 'UNKNOWN');
  assert.equal(brief.risk, RISK.ATTENTION);
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

test('requires explicit ancestry evidence for release drift', () => {
  assert.equal(
    releaseDrift({ currentMainSha: 'b', deployedCandidateSha: 'a' }).state,
    DRIFT.UNKNOWN,
  );
  assert.equal(
    releaseDrift({ currentMainSha: 'b', deployedCandidateSha: 'a', relation: 'DESCENDANT' }).state,
    DRIFT.MAIN_AHEAD,
  );
  assert.equal(
    releaseDrift({ currentMainSha: 'a', deployedCandidateSha: 'a' }).state,
    DRIFT.ALIGNED,
  );
});

test('reports missing core coverage and bounded attention', () => {
  const evidence = normalizeEvidence({ environment: 'production', health: health(), now });
  const brief = buildSystemBrief(evidence);
  assert.equal(brief.coverage.verified_count, 1);
  assert.ok(brief.coverage.missing_core.some((item) => item.service === 'stripeWebhook'));
  assert.ok(
    buildAttentionItems(evidence).some((item) => item.reason === 'SERVICE COVERAGE MISSING'),
  );
});

test('change output is deterministic and does not invent history', () => {
  assert.deepEqual(changeSummary({}), ['UNKNOWN']);
  assert.deepEqual(changeSummary({ drift: { state: DRIFT.MAIN_AHEAD }, stale: true }), [
    'SOURCE_CHANGED',
    'EVIDENCE_AGED',
  ]);
});
