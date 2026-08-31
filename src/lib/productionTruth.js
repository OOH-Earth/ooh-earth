/**
 * Deterministic Production Truth model.
 *
 * This module deliberately consumes allowlisted evidence only. It is a
 * reasoning contract, not a metrics store and not a source of runtime facts.
 */
export const TRUTH_STATE = Object.freeze({
  OPERATIONAL: 'OPERATIONAL',
  OPERATIONAL_WITH_GAPS: 'OPERATIONAL_WITH_GAPS',
  DEGRADED: 'DEGRADED',
  UNKNOWN: 'UNKNOWN',
  CERTIFICATION_REQUIRED: 'CERTIFICATION_REQUIRED',
});

export const CAPABILITY_STATE = Object.freeze({
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNKNOWN: 'UNKNOWN',
});
export const VERIFICATION = Object.freeze({
  VERIFIED: 'VERIFIED',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  NOT_VERIFIED: 'NOT_VERIFIED',
});
export const FRESHNESS = Object.freeze({ CURRENT: 'CURRENT', STALE: 'STALE', UNKNOWN: 'UNKNOWN' });

const STATUS = new Set(Object.values(CAPABILITY_STATE));
const EVIDENCE = new Set(Object.values(VERIFICATION));
const SHA = /^[0-9a-f]{7,64}$/i;
const ROUTES = Object.freeze(['/', '/map', '/report']);

export const CAPABILITY_CATALOG = Object.freeze([
  {
    id: 'publicWeb',
    label: 'Public Web',
    criticality: 'CRITICAL',
    freshness: 'interactive',
    dependsOn: [],
    probe: 'Safe GET for required public routes',
    proves: 'Required public routes responded successfully',
    doesNotProve: 'All frontend interactions or authenticated flows',
  },
  {
    id: 'mapData',
    label: 'Map data',
    criticality: 'HIGH',
    freshness: 'interactive',
    dependsOn: ['publicWeb'],
    probe: 'Bounded Map data read',
    proves: 'The bounded data path responded; an empty valid dataset is functional',
    doesNotProve: 'Completeness of the dataset or marker population',
  },
  {
    id: 'fieldStats',
    label: 'Field statistics',
    criticality: 'HIGH',
    freshness: 'interactive',
    dependsOn: [],
    probe: 'Existing fieldStats request',
    proves: 'The aggregate fieldStats response and its bounded persistence path',
    doesNotProve: 'Historical availability or every upstream dependency',
  },
  {
    id: 'offlineSubmission',
    label: 'Offline submission boundary',
    criticality: 'HIGH',
    freshness: 'releaseBound',
    dependsOn: [],
    probe: 'Validation/security-boundary check; no live write',
    proves: 'Only the tested boundary behavior',
    doesNotProve: 'Successful write, replay, or user-record persistence',
  },
  {
    id: 'paymentSecurity',
    label: 'Payment security boundary',
    criticality: 'CRITICAL',
    freshness: 'releaseBound',
    dependsOn: [],
    probe: 'Invalid-signature rejection',
    proves: 'Webhook signature boundary and replay protections covered by evidence',
    doesNotProve: 'Successful payment processing or provider health',
  },
  {
    id: 'releaseCertification',
    label: 'Release certification',
    criticality: 'CRITICAL',
    freshness: 'certification',
    dependsOn: [],
    probe: 'Published release certification evidence',
    proves: 'The recorded candidate passed the recorded release checks',
    doesNotProve: 'Base44 runtime SHA when the platform does not expose it',
  },
]);

const byId = new Map(CAPABILITY_CATALOG.map((item) => [item.id, item]));
const nowNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);
const time = (value) => {
  const number = nowNumber(value);
  if (number === null || number <= 0) return null;
  return number < 10_000_000_000 ? number * 1000 : number;
};
const bounded = (value, fallback = 'UNKNOWN') =>
  typeof value === 'string' ? value.slice(0, 96) : fallback;
const validStatus = (value) => (STATUS.has(value) ? value : CAPABILITY_STATE.UNKNOWN);
const validVerification = (value) => (EVIDENCE.has(value) ? value : VERIFICATION.NOT_VERIFIED);

const thresholds = Object.freeze({
  interactive: 15 * 60 * 1000,
  certification: 24 * 60 * 60 * 1000,
});

export function freshnessFor(observedAt, policy = 'interactive', now = Date.now()) {
  const observed = time(observedAt);
  const current = nowNumber(now);
  if (!observed || current === null || observed > current) return FRESHNESS.UNKNOWN;
  const threshold = thresholds[policy] || thresholds.interactive;
  return current - observed <= threshold ? FRESHNESS.CURRENT : FRESHNESS.STALE;
}

function snapshotEvidence(snapshot, capability, environment, now) {
  const observedAt = time(snapshot?.updated_at || snapshot?.last_success_at);
  const status = validStatus(snapshot?.status);
  const verification = validVerification(snapshot?.evidence_status);
  const definition = byId.get(capability);
  return {
    id: capability,
    label: definition.label,
    criticality: definition.criticality,
    state: status,
    verification,
    freshness: freshnessFor(observedAt, definition.freshness, now),
    environment,
    observed_at: observedAt,
    duration_ms: Number.isFinite(Number(snapshot?.last_duration_ms))
      ? Math.max(0, Math.min(120_000, Number(snapshot.last_duration_ms)))
      : null,
    source: 'authenticated OperationalHealth response',
    proves: definition.proves,
    does_not_prove: definition.doesNotProve,
  };
}

function absentEvidence(id, environment) {
  const definition = byId.get(id);
  return {
    id,
    label: definition.label,
    criticality: definition.criticality,
    state: CAPABILITY_STATE.UNKNOWN,
    verification: VERIFICATION.INSUFFICIENT_DATA,
    freshness: FRESHNESS.UNKNOWN,
    environment,
    observed_at: null,
    duration_ms: null,
    source: 'no safe runtime evidence supplied',
    proves: definition.proves,
    does_not_prove: definition.doesNotProve,
  };
}

function normalizeSupplement(input, id, environment, now) {
  const value = input?.[id];
  if (!value || typeof value !== 'object') return absentEvidence(id, environment);
  if (value.environment && value.environment !== environment)
    return absentEvidence(id, environment);
  const result = snapshotEvidence(value, id, environment, now);
  if (id === 'mapData' && value.read_succeeded === true) result.state = 'HEALTHY';
  if (id === 'publicWeb' && Array.isArray(value.routes) && value.routes.length) {
    result.routes = value.routes.filter((route) => ROUTES.includes(route)).slice(0, ROUTES.length);
    result.state = result.routes.length === ROUTES.length ? 'HEALTHY' : 'UNKNOWN';
  }
  return result;
}

/** @param {any} release */
function releaseEvidence(release, environment, now) {
  const candidate = bounded(release?.git_sha);
  const certification = release?.certification === 'VERIFIED' && SHA.test(candidate);
  const observedAt = time(release?.certified_at);
  return {
    id: 'releaseCertification',
    label: byId.get('releaseCertification').label,
    criticality: 'CRITICAL',
    state: certification ? 'HEALTHY' : 'UNKNOWN',
    verification: certification ? 'VERIFIED' : 'INSUFFICIENT_DATA',
    freshness: certification ? freshnessFor(observedAt, 'certification', now) : 'UNKNOWN',
    environment,
    observed_at: observedAt,
    duration_ms: null,
    source: 'deployed static release manifest',
    candidate_sha: candidate,
    runtime_revision: bounded(release?.runtime_revision),
    proves: byId.get('releaseCertification').proves,
    does_not_prove: byId.get('releaseCertification').doesNotProve,
  };
}

/** @param {{environment?: string, health?: any, release?: any, evidence?: any, now?: number}} input */
export function buildProductionTruth({
  environment = 'production',
  health = {},
  release = {},
  evidence = {},
  now = Date.now(),
} = {}) {
  const safeEnvironment = environment === 'backup' ? 'backup' : 'production';
  const snapshots = new Map(
    (Array.isArray(health?.services) ? health.services : [])
      .filter((item) => item && item.environment === safeEnvironment)
      .map((item) => [item.service, item]),
  );
  const capabilities = [
    snapshotEvidence(snapshots.get('publicWeb'), 'publicWeb', safeEnvironment, now),
    snapshots.has('map') || snapshots.has('mapData')
      ? snapshotEvidence(
          snapshots.get('map') || snapshots.get('mapData'),
          'mapData',
          safeEnvironment,
          now,
        )
      : normalizeSupplement(evidence, 'mapData', safeEnvironment, now),
    snapshotEvidence(snapshots.get('fieldStats'), 'fieldStats', safeEnvironment, now),
    normalizeSupplement(evidence, 'offlineSubmission', safeEnvironment, now),
    normalizeSupplement(evidence, 'paymentSecurity', safeEnvironment, now),
    releaseEvidence(release, safeEnvironment, now),
  ].map((item) =>
    item.observed_at || item.id === 'releaseCertification'
      ? item
      : absentEvidence(item.id, safeEnvironment),
  );
  const degraded = capabilities.filter(
    (item) =>
      item.state === 'DEGRADED' && item.verification === 'VERIFIED' && item.freshness === 'CURRENT',
  );
  const currentVerified = capabilities.filter(
    (item) => item.verification === 'VERIFIED' && item.freshness === 'CURRENT',
  );
  const missing = capabilities.filter(
    (item) => item.verification !== 'VERIFIED' || item.freshness !== 'CURRENT',
  );
  const coreMissing = capabilities.filter(
    (item) => item.criticality === 'CRITICAL' && item.verification !== 'VERIFIED',
  );
  const candidate = bounded(release?.git_sha);
  const main = bounded(release?.current_main_sha);
  const relation = bounded(release?.current_main_relation);
  const drift =
    candidate === 'UNKNOWN' || main === 'UNKNOWN'
      ? 'UNKNOWN'
      : candidate === main || relation === 'EQUAL'
        ? 'ALIGNED'
        : relation === 'DESCENDANT'
          ? 'MAIN_AHEAD'
          : relation === 'ANCESTOR'
            ? 'PRODUCTION_AHEAD'
            : 'UNKNOWN';
  let state = 'OPERATIONAL_WITH_GAPS';
  if (!currentVerified.length) state = 'UNKNOWN';
  else if (degraded.length) state = 'DEGRADED';
  else if (
    drift === 'MAIN_AHEAD' ||
    releaseEvidence(release, safeEnvironment, now).verification !== 'VERIFIED'
  )
    state = 'CERTIFICATION_REQUIRED';
  return {
    environment: safeEnvironment,
    state,
    capabilities,
    coverage: {
      current_verified: currentVerified.length,
      total: capabilities.length,
      missing: missing.length,
      missing_core: coreMissing.map((item) => item.id),
    },
    drift: { state: drift, candidate_sha: candidate, current_main_sha: main, relation },
    attention: degraded.length
      ? degraded.map((item) => ({
          priority: item.criticality === 'CRITICAL' ? 'P0' : 'P1',
          reason: `${item.label.toUpperCase()} DEGRADED`,
          evidence: item,
          next_action: `Inspect ${item.label} evidence.`,
        }))
      : missing.map((item) => ({
          priority: item.criticality === 'CRITICAL' ? 'P1' : 'P2',
          reason: `${item.label.toUpperCase()} NOT VERIFIED`,
          evidence: item,
          next_action: byId.get(item.id).probe,
        })),
    limitations: [
      'Base44 runtime SHA remains UNKNOWN.',
      'Native Base44 logs and gateway correlation propagation remain runtime-dependent.',
      'Successful payment processing and offline write/replay are not proven by boundary evidence.',
    ],
    next_action: degraded.length
      ? degraded[0].label
      : missing[0]?.label || 'No additional bounded verification selected.',
    evidence_source: 'deterministic aggregation of allowlisted evidence',
  };
}

export function capabilityGraph() {
  return CAPABILITY_CATALOG.map(({ id, label, criticality, dependsOn }) => ({
    id,
    label,
    criticality,
    depends_on: [...dependsOn],
  }));
}

export function classifyAction(action) {
  const value = typeof action === 'string' ? action.toLowerCase() : '';
  if (
    /stripe|charge|refund|delete|drop|destroy|force.?push|schema|credential|secret|auth/.test(value)
  )
    return 'PROHIBITED';
  if (/deploy|rollback|publish|write|update|mutation|restart/.test(value))
    return 'REQUIRES_APPROVAL';
  if (/verify|smoke|read|inspect|compare|refresh|status/.test(value)) return 'READ_ONLY_SAFE';
  return 'PROHIBITED';
}

export const SLO_FOUNDATION = Object.freeze({
  public_route_availability: {
    target: 'TARGET ONLY',
    source: 'bounded GET certification',
    observed: 'NOT AVAILABLE WITHOUT TIME SERIES',
  },
  map_query_success: {
    target: 'TARGET ONLY',
    source: 'bounded Map read',
    observed: 'NOT AVAILABLE WITHOUT TIME SERIES',
  },
  field_stats_success: {
    target: 'TARGET ONLY',
    source: 'fieldStats response',
    observed: 'NOT AVAILABLE WITHOUT TIME SERIES',
  },
  error_budget: 'NOT AVAILABLE WITHOUT MEASURED TIME SERIES',
});
