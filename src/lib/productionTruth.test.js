import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildProductionTruth,
  capabilityGraph,
  classifyAction,
  freshnessFor,
} from './productionTruth.js';

const now = Date.parse('2026-08-31T12:00:00Z');
const health = (services) => ({ services });
const snapshot = (service, status = 'HEALTHY', updated_at = now) => ({
  service,
  environment: 'production',
  status,
  evidence_status: 'VERIFIED',
  updated_at,
});
const release = {
  git_sha: 'a'.repeat(40),
  certification: 'VERIFIED',
  certified_at: now,
  current_main_sha: 'a'.repeat(40),
  current_main_relation: 'EQUAL',
  runtime_revision: 'UNKNOWN',
};

test('models real fieldStats and map evidence while keeping uncovered capabilities explicit', () => {
  const truth = buildProductionTruth({
    health: health([snapshot('fieldStats'), snapshot('map')]),
    release,
    now,
  });
  assert.equal(truth.state, 'OPERATIONAL_WITH_GAPS');
  assert.equal(truth.coverage.current_verified, 3); // map, fieldStats, release certification
  assert.equal(
    truth.capabilities.find((item) => item.id === 'offlineSubmission').verification,
    'INSUFFICIENT_DATA',
  );
  assert.equal(
    truth.capabilities.find((item) => item.id === 'paymentSecurity').verification,
    'INSUFFICIENT_DATA',
  );
});

test('published public smoke evidence supports public route availability only', () => {
  const truth = buildProductionTruth({
    health: health([snapshot('fieldStats'), snapshot('map')]),
    release: { ...release, public_smoke_result: 'VERIFIED' },
    now,
  });
  const publicWeb = truth.capabilities.find((item) => item.id === 'publicWeb');
  assert.equal(publicWeb.verification, 'VERIFIED');
  assert.match(publicWeb.does_not_prove, /frontend/);
});

test('current verified critical degradation dominates aggregate state', () => {
  const truth = buildProductionTruth({
    health: health([snapshot('fieldStats'), snapshot('map', 'DEGRADED')]),
    release,
    now,
  });
  assert.equal(truth.state, 'DEGRADED');
  assert.equal(truth.attention[0].priority, 'P1');
});

test('stale healthy evidence is not current health', () => {
  assert.equal(freshnessFor(now - 16 * 60 * 1000, 'interactive', now), 'STALE');
  const truth = buildProductionTruth({
    health: health([snapshot('fieldStats', 'HEALTHY', now - 16 * 60 * 1000)]),
    release,
    now,
  });
  assert.equal(truth.capabilities.find((item) => item.id === 'fieldStats').freshness, 'STALE');
});

test('valid empty Map read is functional only when explicitly proven', () => {
  const truth = buildProductionTruth({
    health: health([snapshot('fieldStats')]),
    evidence: {
      mapData: {
        environment: 'production',
        status: 'UNKNOWN',
        evidence_status: 'VERIFIED',
        read_succeeded: true,
        updated_at: now,
      },
    },
    release,
    now,
  });
  const map = truth.capabilities.find((item) => item.id === 'mapData');
  assert.equal(map.state, 'HEALTHY');
  assert.equal(map.does_not_prove.includes('Completeness'), true);
});

test('payment boundary never implies successful processing', () => {
  const truth = buildProductionTruth({
    health: health([snapshot('fieldStats')]),
    evidence: {
      paymentSecurity: {
        environment: 'production',
        status: 'HEALTHY',
        evidence_status: 'VERIFIED',
        updated_at: now,
      },
    },
    release,
    now,
  });
  assert.equal(truth.capabilities.find((item) => item.id === 'paymentSecurity').state, 'HEALTHY');
  assert.match(truth.limitations[2], /payment processing/);
});

test('release drift and missing release evidence fail conservatively', () => {
  const truth = buildProductionTruth({
    health: health([snapshot('fieldStats')]),
    release: { ...release, current_main_sha: 'b'.repeat(40), current_main_relation: 'DESCENDANT' },
    now,
  });
  assert.equal(truth.state, 'CERTIFICATION_REQUIRED');
  assert.equal(truth.drift.state, 'MAIN_AHEAD');
});

test('cross-environment snapshots cannot become Production truth', () => {
  const truth = buildProductionTruth({
    health: health([snapshot('fieldStats')].map((item) => ({ ...item, environment: 'backup' }))),
    release,
    now,
  });
  assert.equal(
    truth.capabilities.find((item) => item.id === 'fieldStats').verification,
    'INSUFFICIENT_DATA',
  );
});

test('action policy rejects mutation and arbitrary commands', () => {
  assert.equal(classifyAction('refresh bounded health status'), 'READ_ONLY_SAFE');
  assert.equal(classifyAction('deploy Production'), 'REQUIRES_APPROVAL');
  assert.equal(classifyAction('run arbitrary shell and charge Stripe'), 'PROHIBITED');
});

test('capability graph is bounded and explicit', () => {
  const graph = capabilityGraph();
  assert.equal(graph.length, 6);
  assert.deepEqual(graph.find((item) => item.id === 'mapData').depends_on, ['publicWeb']);
});

test('transaction guarantees remain separate from capability health', () => {
  const truth = buildProductionTruth({
    health: health([snapshot('fieldStats')]),
    release,
    evidence: {
      transactionIntegrity: {
        offline: { boundary: 'VERIFIED', replay: 'VERIFIED' },
        payment: { signature: 'VERIFIED', replay: 'VERIFIED', ledger: 'VERIFIED' },
      },
    },
    now,
  });
  assert.equal(
    truth.transaction_integrity.offline.guarantee,
    'AT_LEAST_ONCE_WITH_IDEMPOTENT_REPLAY',
  );
  assert.equal(truth.transaction_integrity.offline.exactly_once, 'NOT_GUARANTEED');
  assert.equal(truth.transaction_integrity.payment.production_successful_payment, 'NOT_VERIFIED');
});
