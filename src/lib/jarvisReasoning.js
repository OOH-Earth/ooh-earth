export const FRESHNESS = Object.freeze({ CURRENT: 'CURRENT', STALE: 'STALE', UNKNOWN: 'UNKNOWN' });
export const RISK = Object.freeze({
  LOW: 'LOW',
  ATTENTION: 'ATTENTION',
  ELEVATED: 'ELEVATED',
  UNKNOWN: 'UNKNOWN',
});

const VALID_STATUS = new Set(['HEALTHY', 'DEGRADED', 'UNKNOWN']);
const VALID_EVIDENCE = new Set(['VERIFIED', 'INSUFFICIENT_DATA', 'NOT_VERIFIED']);
const MAX_TEXT = 120;
const DEFAULT_FRESHNESS_MS = 15 * 60 * 1000;

const bounded = (value) => (typeof value === 'string' ? value.slice(0, MAX_TEXT) : 'UNKNOWN');
const timestamp = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return number < 10_000_000_000 ? number * 1000 : number;
};

export function freshnessOf(observedAt, now = Date.now(), thresholdMs = DEFAULT_FRESHNESS_MS) {
  const observed = timestamp(observedAt);
  if (!observed || !Number.isFinite(now) || observed > now) return FRESHNESS.UNKNOWN;
  return now - observed <= thresholdMs ? FRESHNESS.CURRENT : FRESHNESS.STALE;
}

/**
 * @param {{environment?: string, health?: any, release?: any, now?: number, freshnessMs?: number}} input
 */
export function normalizeEvidence({
  environment,
  health,
  release,
  now = Date.now(),
  freshnessMs,
} = {}) {
  const safeEnvironment = environment === 'backup' ? 'backup' : 'production';
  const snapshots = Array.isArray(health?.services) ? health.services : [];
  const environmentMismatches = snapshots.filter(
    (item) => item && item.service && item.environment && item.environment !== safeEnvironment,
  ).length;
  const services = snapshots
    .filter((item) => item && item.service && item.environment === safeEnvironment)
    .slice(0, 24)
    .map((item) => {
      const status = VALID_STATUS.has(item.status) ? item.status : 'UNKNOWN';
      const verification = VALID_EVIDENCE.has(item.evidence_status)
        ? item.evidence_status
        : 'NOT_VERIFIED';
      const observedAt = timestamp(item.updated_at || item.last_success_at || health?.generated_at);
      return {
        service: bounded(item.service),
        environment: safeEnvironment,
        status,
        verification,
        observed_at: observedAt,
        freshness: freshnessOf(observedAt, now, freshnessMs),
        duration_ms: Number.isFinite(Number(item.last_duration_ms))
          ? Math.max(0, Math.min(120_000, Number(item.last_duration_ms)))
          : null,
        release: bounded(item.release),
        evidence_source: 'authenticated operationalHealth response',
      };
    });
  const manifest = release && typeof release === 'object' ? release : {};
  return {
    environment: safeEnvironment,
    services,
    environment_mismatches: environmentMismatches,
    release: {
      candidate_sha: bounded(manifest.git_sha),
      release_state: bounded(manifest.release_state),
      runtime_revision: bounded(manifest.runtime_revision),
      source: manifest.source || 'deployed static release manifest',
    },
    limitations: [
      'Base44 runtime identity is not exposed as verified metadata.',
      'Native Base44 log retrieval and gateway correlation propagation remain runtime-dependent.',
    ],
  };
}

function healthConclusion(evidence) {
  if (!evidence.services.length)
    return { status: 'UNKNOWN', statement: 'Current service health is not verified.' };
  const degraded = evidence.services.find((service) => service.status === 'DEGRADED');
  if (
    degraded &&
    degraded.freshness === FRESHNESS.CURRENT &&
    degraded.verification === 'VERIFIED'
  ) {
    return { status: 'DEGRADED', statement: `${degraded.service} is currently verified degraded.` };
  }
  const currentHealthy = evidence.services.filter(
    (service) =>
      service.status === 'HEALTHY' &&
      service.verification === 'VERIFIED' &&
      service.freshness === FRESHNESS.CURRENT,
  );
  if (currentHealthy.length === evidence.services.length) {
    return {
      status: 'HEALTHY',
      statement: `${currentHealthy.map((service) => service.service).join(', ')} is currently verified healthy.`,
    };
  }
  const staleHealthy = evidence.services.find(
    (service) => service.status === 'HEALTHY' && service.freshness === FRESHNESS.STALE,
  );
  if (staleHealthy) {
    return {
      status: 'UNKNOWN',
      statement: `${staleHealthy.service} was last verified healthy; current health is unknown because the evidence is stale.`,
    };
  }
  return { status: 'UNKNOWN', statement: 'Current service health is not sufficiently verified.' };
}

export function buildSystemBrief(evidence) {
  const health = healthConclusion(evidence);
  const attention = [...evidence.limitations];
  if (evidence.environment_mismatches) {
    attention.unshift('Received operational evidence is labeled for a different environment.');
  }
  if (!evidence.services.length)
    attention.unshift('No bounded operational service snapshot is available.');
  if (evidence.services.some((service) => service.freshness === FRESHNESS.STALE)) {
    attention.unshift('At least one service observation is stale.');
  }
  const risk =
    health.status === 'DEGRADED'
      ? RISK.ELEVATED
      : health.status === 'HEALTHY'
        ? RISK.LOW
        : RISK.UNKNOWN;
  const recommendation =
    health.status === 'HEALTHY'
      ? 'Continue monitoring; investigate only the explicitly listed limitations.'
      : health.status === 'DEGRADED'
        ? 'Inspect the degraded service evidence and consider the documented rollback path.'
        : 'Run a bounded health certification before treating the environment as current.';
  return {
    status: health.status,
    statement: health.statement,
    risk,
    attention: attention.slice(0, 5),
    recommendation,
    evidence: evidence.services,
    release: evidence.release,
    environment: evidence.environment,
  };
}

export function compareEnvironments(production, backup) {
  const prod = buildSystemBrief(production);
  const stage = buildSystemBrief(backup);
  if (prod.status === stage.status && prod.risk === stage.risk) {
    return `Production and BACKUP currently report the same bounded state: ${prod.status}.`;
  }
  return `Production is ${prod.status}; BACKUP is ${stage.status}. Compare their evidence timestamps before drawing a release conclusion.`;
}

export function rollbackAssessment(brief, previousKnownGood = 'UNKNOWN') {
  if (brief.status === 'DEGRADED') {
    return {
      classification: 'CONSIDER ROLLBACK',
      statement: `Production evidence is degraded. Previous known-good candidate: ${bounded(previousKnownGood)}.`,
    };
  }
  if (brief.status === 'UNKNOWN') {
    return {
      classification: 'INSUFFICIENT EVIDENCE',
      statement: 'Rollback is not indicated from missing or stale evidence alone.',
    };
  }
  return {
    classification: 'NOT INDICATED',
    statement: 'No verified degraded Production evidence indicates rollback.',
  };
}
