export const CAPABILITY_CATALOG = Object.freeze([
  { service: 'publicWeb', criticality: 'CRITICAL', label: 'Public web' },
  { service: 'map', criticality: 'CRITICAL', label: 'Map data' },
  { service: 'fieldStats', criticality: 'HIGH', label: 'Field statistics' },
  { service: 'submitOffline', criticality: 'HIGH', label: 'Offline submission' },
  { service: 'stripeWebhook', criticality: 'CRITICAL', label: 'Payment webhook' },
]);
export const ACTION_CLASS = Object.freeze({
  READ_ONLY_SAFE: 'READ_ONLY_SAFE',
  SAFE_VERIFICATION: 'SAFE_VERIFICATION',
  REQUIRES_APPROVAL: 'REQUIRES_APPROVAL',
  PROHIBITED: 'PROHIBITED',
});

const VALID_STATUS = new Set(['HEALTHY', 'DEGRADED', 'UNKNOWN']);
const VALID_VERIFICATION = new Set(['VERIFIED', 'INSUFFICIENT_DATA', 'NOT_VERIFIED']);
const CRITICALITY_ORDER = { CRITICAL: 0, HIGH: 1, STANDARD: 2 };

const safeText = (value) => (typeof value === 'string' ? value.slice(0, 120) : 'UNKNOWN');
const safeSnapshot = (snapshot, environment) => {
  if (!snapshot || typeof snapshot !== 'object') return null;
  return {
    service: safeText(snapshot.service),
    environment,
    status: VALID_STATUS.has(snapshot.status) ? snapshot.status : 'UNKNOWN',
    verification: VALID_VERIFICATION.has(snapshot.evidence_status)
      ? snapshot.evidence_status
      : 'NOT_VERIFIED',
    observed_at: Number.isFinite(Number(snapshot.updated_at)) ? Number(snapshot.updated_at) : null,
    duration_ms: Number.isFinite(Number(snapshot.last_duration_ms))
      ? Math.max(0, Math.min(120_000, Number(snapshot.last_duration_ms)))
      : null,
    release: safeText(snapshot.release),
  };
};

export function normalizeCapabilities(input = {}) {
  const normalizeEnvironment = (environment) => {
    const values = Array.isArray(input[environment]) ? input[environment] : [];
    return new Map(
      values
        .map((snapshot) => safeSnapshot(snapshot, environment))
        .filter(Boolean)
        .map((snapshot) => [snapshot.service, snapshot]),
    );
  };
  return { production: normalizeEnvironment('production'), backup: normalizeEnvironment('backup') };
}

function isCurrent(snapshot, now, freshnessMs = 15 * 60 * 1000) {
  if (!snapshot?.observed_at || snapshot.observed_at > now) return false;
  return now - snapshot.observed_at <= freshnessMs;
}

export function capabilityCoverage(evidence, now = Date.now(), catalog = CAPABILITY_CATALOG) {
  const rows = catalog.map((definition) => {
    const production = evidence.production.get(definition.service) || null;
    const backup = evidence.backup.get(definition.service) || null;
    const current =
      production && isCurrent(production, now) && production.verification === 'VERIFIED';
    return { ...definition, production, backup, current };
  });
  return {
    rows,
    current_verified: rows.filter((row) => row.current).length,
    total: rows.length,
    unknown: rows.filter((row) => !row.production || row.production.status === 'UNKNOWN').length,
    stale: rows.filter((row) => row.production && !isCurrent(row.production, now)).length,
  };
}

export function correlateCapabilities(evidence, context = {}) {
  const production = evidence.production;
  const backup = evidence.backup;
  const rows = [];
  for (const [service, snapshot] of production) {
    if (snapshot.status !== 'DEGRADED' || snapshot.verification !== 'VERIFIED') continue;
    const backupSnapshot = backup.get(service);
    if (backupSnapshot?.status === 'DEGRADED' && backupSnapshot.verification === 'VERIFIED') {
      rows.push({
        category: 'SHARED_SERVICE_PATH',
        service,
        statement: `${service} is degraded in both Production and BACKUP; a shared service or data-path condition is possible.`,
        evidence: [snapshot, backupSnapshot],
        unknowns: ['Correlation does not establish causation.'],
        next_check: `Run a bounded ${service} diagnostic in both environments.`,
      });
    } else if (backupSnapshot?.status === 'HEALTHY') {
      rows.push({
        category: 'ENVIRONMENT_SPECIFIC',
        service,
        statement: `${service} is degraded in Production while BACKUP is healthy; a Production-specific condition is possible.`,
        evidence: [snapshot, backupSnapshot],
        unknowns: ['Provider and environment state are not independently proven.'],
        next_check: `Compare the bounded ${service} probe and release evidence.`,
      });
    } else {
      rows.push({
        category: 'INSUFFICIENT_EVIDENCE',
        service,
        statement: `${service} is degraded, but comparison evidence is unavailable.`,
        evidence: [snapshot],
        unknowns: ['BACKUP comparison is missing.'],
        next_check: 'Refresh the corresponding BACKUP probe.',
      });
    }
    if (context.releaseCorrelated) rows[rows.length - 1].category = 'RELEASE_CORRELATED';
  }
  return rows;
}

export function diagnoseAutopilot(input = {}) {
  const evidence = normalizeCapabilities(input.evidence || input);
  const coverage = capabilityCoverage(
    evidence,
    input.now || Date.now(),
    input.catalog || CAPABILITY_CATALOG,
  );
  const correlations = correlateCapabilities(evidence, input);
  const degraded = coverage.rows.filter(
    (row) => row.production?.status === 'DEGRADED' && row.production.verification === 'VERIFIED',
  );
  const unknowns = coverage.rows.filter(
    (row) => !row.production || row.production.verification !== 'VERIFIED',
  );
  const diagnosis = correlations.length
    ? correlations
    : degraded.length
      ? [
          {
            category: 'INSUFFICIENT_EVIDENCE',
            statement:
              'Verified degradation exists, but cross-environment evidence is insufficient to localize it.',
            evidence: degraded.map((row) => row.production),
            unknowns: ['No causal conclusion is supported.'],
            next_check: `Refresh ${degraded[0].service} comparison evidence.`,
          },
        ]
      : unknowns.length
        ? [
            {
              category: 'STALE_EVIDENCE',
              statement:
                'Current service diagnosis is limited because one or more capability observations are missing or unverified.',
              evidence: unknowns.map((row) => row.service),
              unknowns: ['Current state cannot be established.'],
              next_check: 'Run the smallest missing bounded verification.',
            },
          ]
        : [
            {
              category: 'INSUFFICIENT_EVIDENCE',
              statement: 'No verified degradation is present in the observed capability set.',
              evidence: coverage.rows.map((row) => row.production),
              unknowns: ['Uninstrumented capabilities remain outside this conclusion.'],
              next_check: 'Continue bounded monitoring.',
            },
          ];
  const systemState = degraded.length
    ? 'DEGRADED'
    : coverage.current_verified
      ? 'HEALTHY'
      : 'UNKNOWN';
  return {
    systemState,
    coverage,
    correlations,
    diagnosis,
    unknowns: unknowns.map((row) => row.service),
  };
}

export function prioritizeAttention(diagnosis) {
  return [...(diagnosis?.diagnosis || [])]
    .map((item) => {
      const service = item.service || item.evidence?.[0]?.service || 'system';
      const priority =
        item.category === 'RELEASE_CORRELATED'
          ? 'P0'
          : item.category === 'SHARED_SERVICE_PATH'
            ? 'P1'
            : item.category === 'ENVIRONMENT_SPECIFIC'
              ? 'P1'
              : 'P2';
      return {
        priority,
        service,
        reason: item.category,
        evidence: item.evidence,
        next_action: item.next_check,
      };
    })
    .sort((a, b) => a.priority.localeCompare(b.priority));
}

export function nextBestAction(diagnosis) {
  const first = prioritizeAttention(diagnosis)[0];
  if (!first)
    return {
      action: 'Continue bounded monitoring.',
      classification: ACTION_CLASS.SAFE_VERIFICATION,
    };
  return {
    action: first.next_action,
    classification: ACTION_CLASS.SAFE_VERIFICATION,
    evidence: first.evidence,
    reason: first.reason,
  };
}

export function buildRemediationPlan(diagnosis) {
  const action = nextBestAction(diagnosis);
  return {
    title: 'READ-ONLY RELIABILITY PLAN',
    problem: diagnosis.systemState,
    known_evidence: diagnosis.diagnosis,
    unknowns: diagnosis.unknowns,
    diagnostic_steps: [
      action.action,
      'Compare candidate and environment evidence.',
      'Re-certify after any separately approved correction.',
    ],
    possible_remediation: 'Requires explicit human approval for any change.',
    validation: [
      'Repeat bounded probes.',
      'Confirm no new degradation.',
      'Publish certification evidence.',
    ],
    rollback_condition:
      'Only consider rollback when release correlation and previous known-good evidence are both proven.',
  };
}

export function assessAutopilotRollback(diagnosis, context = {}) {
  const degraded = diagnosis.systemState === 'DEGRADED';
  const strong = degraded && context.releaseCorrelated && context.previousKnownGoodVerified;
  return strong
    ? {
        classification: 'ROLLBACK RECOMMENDED',
        statement:
          'Verified degradation is release-correlated and the previous candidate is known good for this capability.',
        evidence: context,
      }
    : degraded
      ? {
          classification: 'INVESTIGATE',
          statement:
            'Verified degradation exists, but rollback causality or previous-candidate evidence is incomplete.',
          evidence: diagnosis,
        }
      : {
          classification: 'NOT INDICATED',
          statement: 'No verified degradation supports rollback.',
          evidence: diagnosis,
        };
}

export function classifyAction(plan = {}) {
  const text = JSON.stringify(plan).toLowerCase();
  if (
    /(stripe|charge|delete|drop table|force push|secret|token|credential|schema destruction|change auth|production deploy|deploy production|rollback production|arbitrary shell|arbitrary query|database|base44 entity|http mutation|\b(post|put|patch)\b)/.test(
      text,
    )
  )
    return ACTION_CLASS.PROHIBITED;
  if (/(deploy|rollback|publish|restart|redeploy|write|update|create)/.test(text))
    return ACTION_CLASS.REQUIRES_APPROVAL;
  if (/(probe|verify|smoke|compare|read|inspect|refresh)/.test(text))
    return ACTION_CLASS.SAFE_VERIFICATION;
  return ACTION_CLASS.READ_ONLY_SAFE;
}
