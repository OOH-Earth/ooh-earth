export const FRESHNESS = Object.freeze({ CURRENT: 'CURRENT', STALE: 'STALE', UNKNOWN: 'UNKNOWN' });
export const RISK = Object.freeze({
  LOW: 'LOW',
  ATTENTION: 'ATTENTION',
  ELEVATED: 'ELEVATED',
  UNKNOWN: 'UNKNOWN',
});
export const PRECURSOR = Object.freeze({
  NORMAL: 'NORMAL',
  ATTENTION: 'ATTENTION',
  INVESTIGATE: 'INVESTIGATE',
  RELEASE_RISK: 'RELEASE_RISK',
  UNKNOWN: 'UNKNOWN',
});
export const DRIFT = Object.freeze({
  ALIGNED: 'ALIGNED',
  MAIN_AHEAD: 'MAIN_AHEAD',
  PRODUCTION_AHEAD: 'PRODUCTION_AHEAD',
  UNKNOWN: 'UNKNOWN',
});
export const FRESHNESS_POLICY = Object.freeze({
  interactive: 15 * 60 * 1000,
  release_certification: 24 * 60 * 60 * 1000,
});
export const SERVICE_CATALOG = Object.freeze([
  { service: 'fieldStats', criticality: 'CORE', instrumented: true },
  { service: 'submitOffline', criticality: 'IMPORTANT', instrumented: false },
  { service: 'stripeWebhook', criticality: 'CORE', instrumented: false },
  { service: 'map', criticality: 'IMPORTANT', instrumented: false },
  { service: 'authentication', criticality: 'CORE', instrumented: false },
]);
const VALID_STATUS = new Set(['HEALTHY', 'DEGRADED', 'UNKNOWN']);
const VALID_EVIDENCE = new Set(['VERIFIED', 'INSUFFICIENT_DATA', 'NOT_VERIFIED']);
const MAX_TEXT = 120;
const bounded = (value) => (typeof value === 'string' ? value.slice(0, MAX_TEXT) : 'UNKNOWN');
const timestamp = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return number < 10_000_000_000 ? number * 1000 : number;
};
export function freshnessOf(
  observedAt,
  now = Date.now(),
  thresholdMs = FRESHNESS_POLICY.interactive,
) {
  const observed = timestamp(observedAt);
  if (!observed || !Number.isFinite(now) || observed > now) return FRESHNESS.UNKNOWN;
  return now - observed <= thresholdMs ? FRESHNESS.CURRENT : FRESHNESS.STALE;
}
/** @param {{environment?: string, health?: any, release?: any, now?: number, freshnessMs?: number}} input */
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
        freshness: freshnessOf(observedAt, now, freshnessMs ?? FRESHNESS_POLICY.interactive),
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
      current_main_sha: bounded(manifest.current_main_sha),
      current_main_relation: bounded(manifest.current_main_relation),
      certification: bounded(manifest.certification),
      certified_at: timestamp(manifest.certified_at),
    },
    limitations: [
      'Base44 runtime identity is not exposed as verified metadata.',
      'Native Base44 log retrieval and gateway correlation propagation remain runtime-dependent.',
    ],
  };
}
/** @param {{currentMainSha?: string, deployedCandidateSha?: string, relation?: string}} input */
export function releaseDrift({ currentMainSha, deployedCandidateSha, relation } = {}) {
  const main = typeof currentMainSha === 'string' ? currentMainSha : 'UNKNOWN';
  const candidate = typeof deployedCandidateSha === 'string' ? deployedCandidateSha : 'UNKNOWN';
  if (main === 'UNKNOWN' || candidate === 'UNKNOWN')
    return {
      state: DRIFT.UNKNOWN,
      statement: 'Release drift cannot be established from available evidence.',
    };
  if (main === candidate || relation === 'EQUAL')
    return { state: DRIFT.ALIGNED, statement: 'Current main matches the deployed candidate.' };
  if (relation === 'DESCENDANT')
    return {
      state: DRIFT.MAIN_AHEAD,
      statement: 'Current main is newer than the deployed candidate.',
    };
  if (relation === 'ANCESTOR')
    return {
      state: DRIFT.PRODUCTION_AHEAD,
      statement: 'The deployed candidate is newer than current main.',
    };
  return {
    state: DRIFT.UNKNOWN,
    statement: 'Release drift is unknown because Git ancestry evidence is unavailable.',
  };
}
export function serviceCoverage(evidence, catalog = SERVICE_CATALOG) {
  const observed = new Map((evidence?.services || []).map((service) => [service.service, service]));
  const rows = catalog.map((definition) => ({
    ...definition,
    snapshot: observed.get(definition.service) || null,
  }));
  return {
    rows,
    verified_count: rows.filter((row) => row.snapshot?.verification === 'VERIFIED').length,
    stale_count: rows.filter((row) => row.snapshot?.freshness === FRESHNESS.STALE).length,
    unknown_count: rows.filter((row) => !row.snapshot || row.snapshot.status === 'UNKNOWN').length,
    missing_core: rows.filter((row) => row.criticality === 'CORE' && !row.snapshot),
  };
}
export function buildAttentionItems(evidence, context = {}) {
  const items = [];
  const coverage = serviceCoverage(evidence, context.catalog || SERVICE_CATALOG);
  const degraded = (evidence?.services || []).find(
    (s) =>
      s.status === 'DEGRADED' && s.verification === 'VERIFIED' && s.freshness === FRESHNESS.CURRENT,
  );
  if (degraded)
    items.push({
      priority: 'P0',
      reason: 'CORE SERVICE DEGRADED',
      evidence: degraded,
      next_action: `Inspect ${degraded.service} evidence.`,
    });
  if (context.productionCertification === 'FAILED')
    items.push({
      priority: 'P0',
      reason: 'PRODUCTION CERTIFICATION FAILED',
      evidence: 'FAILED',
      next_action: 'Inspect the failed certification before release.',
    });
  if (coverage.missing_core.length)
    items.push({
      priority: 'P1',
      reason: 'SERVICE COVERAGE MISSING',
      evidence: coverage.missing_core.map((row) => row.service),
      next_action: 'Add safe evidence coverage before claiming overall system health.',
    });
  if (coverage.stale_count)
    items.push({
      priority: 'P1',
      reason: 'PRODUCTION EVIDENCE STALE',
      evidence: coverage.stale_count,
      next_action: 'Re-run bounded health certification.',
    });
  if (context.drift?.state === DRIFT.MAIN_AHEAD)
    items.push({
      priority: 'P1',
      reason: 'MAIN AHEAD OF PRODUCTION',
      evidence: context.drift,
      next_action: 'Qualify the current main candidate through BACKUP.',
    });
  if (context.backupVerified === false)
    items.push({
      priority: 'P1',
      reason: 'BACKUP NOT VERIFIED',
      evidence: false,
      next_action: 'Verify BACKUP before any Production release.',
    });
  if (context.runtimeRevision === 'UNKNOWN')
    items.push({
      priority: 'P2',
      reason: 'RUNTIME IDENTITY UNKNOWN',
      evidence: 'Base44 capability limitation',
      next_action: 'Retain candidate and runtime identity as separate facts.',
    });
  return items;
}
/** @param {{drift?: {state?: string}, previousCertification?: string, currentCertification?: string, stale?: boolean}} input */
export function changeSummary({ drift, previousCertification, currentCertification, stale } = {}) {
  const changes = [];
  if (drift?.state === DRIFT.MAIN_AHEAD) changes.push('SOURCE_CHANGED');
  if (drift?.state === DRIFT.PRODUCTION_AHEAD) changes.push('DEPLOYMENT_CHANGED');
  if (
    previousCertification &&
    currentCertification &&
    previousCertification !== currentCertification
  )
    changes.push('CERTIFICATION_CHANGED');
  if (stale) changes.push('EVIDENCE_AGED');
  return changes.length ? changes : ['UNKNOWN'];
}
function healthConclusion(evidence) {
  if (!evidence.services.length)
    return { status: 'UNKNOWN', statement: 'Current service health is not verified.' };
  const degraded = evidence.services.find(
    (s) =>
      s.status === 'DEGRADED' && s.freshness === FRESHNESS.CURRENT && s.verification === 'VERIFIED',
  );
  if (degraded)
    return { status: 'DEGRADED', statement: `${degraded.service} is currently verified degraded.` };
  const allHealthy = evidence.services.every(
    (s) =>
      s.status === 'HEALTHY' && s.verification === 'VERIFIED' && s.freshness === FRESHNESS.CURRENT,
  );
  if (allHealthy)
    return {
      status: 'HEALTHY',
      statement: `${evidence.services.map((s) => s.service).join(', ')} is currently verified healthy.`,
    };
  const stale = evidence.services.find(
    (s) => s.status === 'HEALTHY' && s.freshness === FRESHNESS.STALE,
  );
  if (stale)
    return {
      status: 'UNKNOWN',
      statement: `${stale.service} was last verified healthy; current health is unknown because the evidence is stale.`,
    };
  return { status: 'UNKNOWN', statement: 'Current service health is not sufficiently verified.' };
}
export function buildSystemBrief(evidence) {
  const health = healthConclusion(evidence);
  const coverage = serviceCoverage(evidence);
  const drift = releaseDrift({
    currentMainSha: evidence.release.current_main_sha,
    deployedCandidateSha: evidence.release.candidate_sha,
    relation: evidence.release.current_main_relation,
  });
  const attentionItems = buildAttentionItems(evidence, {
    drift,
    runtimeRevision: evidence.release.runtime_revision,
  });
  const attention = [...evidence.limitations];
  if (evidence.environment_mismatches)
    attention.unshift('Received operational evidence is labeled for a different environment.');
  if (!evidence.services.length)
    attention.unshift('No bounded operational service snapshot is available.');
  if (coverage.stale_count) attention.unshift('At least one service observation is stale.');
  if (coverage.missing_core.length)
    attention.unshift(
      `Overall system health is unknown: core coverage is missing for ${coverage.missing_core.map((row) => row.service).join(', ')}.`,
    );
  if (evidence.release.certification !== 'VERIFIED')
    attention.unshift('This environment has no verified published certification evidence.');
  const status =
    coverage.missing_core.length && health.status === 'HEALTHY' ? 'UNKNOWN' : health.status;
  const risk =
    status === 'DEGRADED'
      ? RISK.ELEVATED
      : status === 'HEALTHY'
        ? RISK.LOW
        : coverage.missing_core.length
          ? RISK.ATTENTION
          : RISK.UNKNOWN;
  return {
    status,
    statement:
      coverage.missing_core.length && health.status === 'HEALTHY'
        ? 'The verified service slice is healthy; overall system health is unknown because core coverage is incomplete.'
        : health.statement,
    risk,
    attention: attention.slice(0, 6),
    attention_items: attentionItems,
    recommendation:
      status === 'HEALTHY'
        ? 'Continue monitoring; investigate only the explicitly listed limitations.'
        : status === 'DEGRADED'
          ? 'Inspect the degraded service evidence and consider the documented rollback path.'
          : 'Qualify or refresh bounded evidence before treating the environment as current.',
    evidence: evidence.services,
    coverage,
    drift,
    precursor:
      status === 'DEGRADED'
        ? PRECURSOR.INVESTIGATE
        : attentionItems.length
          ? PRECURSOR.ATTENTION
          : status === 'HEALTHY'
            ? PRECURSOR.NORMAL
            : PRECURSOR.UNKNOWN,
    release: evidence.release,
    environment: evidence.environment,
  };
}
export function compareEnvironments(production, backup) {
  const prod = buildSystemBrief(production);
  const stage = buildSystemBrief(backup);
  return prod.status === stage.status && prod.risk === stage.risk
    ? `Production and BACKUP currently report the same bounded state: ${prod.status}.`
    : `Production is ${prod.status}; BACKUP is ${stage.status}. Compare their evidence timestamps before drawing a release conclusion.`;
}
export function rollbackAssessment(brief, previousKnownGood = 'UNKNOWN') {
  if (brief.status === 'DEGRADED')
    return {
      classification: 'CONSIDER ROLLBACK',
      statement: `Production evidence is degraded. Previous known-good candidate: ${bounded(previousKnownGood)}.`,
    };
  if (brief.status === 'UNKNOWN')
    return {
      classification: 'INSUFFICIENT EVIDENCE',
      statement: 'Rollback is not indicated from missing or stale evidence alone.',
    };
  return {
    classification: 'NOT INDICATED',
    statement: 'No verified degraded Production evidence indicates rollback.',
  };
}
