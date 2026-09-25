export const RELEASE_STATES = Object.freeze([
  'CANDIDATE',
  'CI_QUALIFIED',
  'BACKUP_DEPLOYED',
  'BACKUP_VERIFIED',
  'PRODUCTION_APPROVED',
  'PRODUCTION_DEPLOYED',
  'PRODUCTION_VERIFIED',
  'CERTIFIED',
  'DEGRADED',
  'ROLLBACK_REQUIRED',
  'ROLLED_BACK',
  'UNKNOWN',
]);

const TRANSITIONS = {
  CANDIDATE: ['CI_QUALIFIED', 'UNKNOWN'],
  CI_QUALIFIED: ['BACKUP_DEPLOYED', 'DEGRADED', 'UNKNOWN'],
  BACKUP_DEPLOYED: ['BACKUP_VERIFIED', 'DEGRADED', 'UNKNOWN'],
  BACKUP_VERIFIED: ['PRODUCTION_APPROVED', 'DEGRADED', 'UNKNOWN'],
  PRODUCTION_APPROVED: ['PRODUCTION_DEPLOYED', 'DEGRADED', 'UNKNOWN'],
  PRODUCTION_DEPLOYED: ['PRODUCTION_VERIFIED', 'ROLLBACK_REQUIRED', 'DEGRADED', 'UNKNOWN'],
  PRODUCTION_VERIFIED: ['CERTIFIED', 'ROLLBACK_REQUIRED', 'DEGRADED', 'UNKNOWN'],
  CERTIFIED: ['ROLLBACK_REQUIRED', 'UNKNOWN'],
  DEGRADED: ['ROLLBACK_REQUIRED', 'UNKNOWN'],
  ROLLBACK_REQUIRED: ['ROLLED_BACK', 'UNKNOWN'],
  ROLLED_BACK: ['CANDIDATE', 'UNKNOWN'],
  UNKNOWN: ['CANDIDATE', 'CI_QUALIFIED'],
};

export function validState(state) {
  return RELEASE_STATES.includes(state);
}

export function canTransition(from, to) {
  return validState(from) && validState(to) && TRANSITIONS[from].includes(to);
}

export function transitionRelease(record, to, evidence = {}) {
  const from = record?.release_state || 'CANDIDATE';
  if (!canTransition(from, to)) {
    throw new Error(`Invalid release transition: ${from} -> ${to}`);
  }
  if (!record?.git_sha || !/^[0-9a-f]{7,64}$/i.test(record.git_sha)) {
    throw new Error('Release transition requires a valid candidate git SHA');
  }
  const next = {
    ...record,
    release_state: to,
    evidence: {
      ...(record.evidence || {}),
      ...evidence,
      [to]: {
        ...(record.evidence?.[to] || {}),
        ...(evidence[to] || {}),
        observed_at: new Date().toISOString(),
      },
    },
    updated_at: new Date().toISOString(),
  };
  if (to.startsWith('BACKUP_')) {
    next.backup = { ...(record.backup || {}), state: to };
  }
  if (to.startsWith('PRODUCTION_') || to === 'CERTIFIED') {
    next.production = { ...(record.production || {}), state: to };
  }
  return next;
}

// Recorded by the real-backend preprod suite (.github/workflows/preprod.yml,
// e2e/preprod/*) after it passes against BACKUP for a specific candidate --
// not a release_state transition (docs/RELEASE_RELIABILITY_SYSTEM.md
// prefers an evidence gate over unnecessary state-machine complexity here),
// but a required evidence key assertProductionGate checks below.
export function recordPreprodE2eEvidence(record, { candidateSha, source = 'preprod-e2e' } = {}) {
  if (!record?.git_sha) throw new Error('Cannot record preprod E2E evidence without a candidate');
  if (candidateSha !== record.git_sha) {
    throw new Error(
      `Preprod E2E evidence candidate (${candidateSha}) does not match the manifest's candidate (${record.git_sha}) -- refusing to record evidence for the wrong SHA.`,
    );
  }
  return {
    ...record,
    evidence: {
      ...(record.evidence || {}),
      PREPROD_E2E_VERIFIED: {
        candidate_sha: candidateSha,
        source,
        observed_at: new Date().toISOString(),
      },
    },
    updated_at: new Date().toISOString(),
  };
}

export function assertProductionGate(record) {
  if (!['BACKUP_VERIFIED', 'PRODUCTION_APPROVED'].includes(record?.release_state)) {
    throw new Error('Production gate requires BACKUP_VERIFIED evidence for this candidate');
  }
  if (record?.backup?.state !== 'BACKUP_VERIFIED') {
    throw new Error('Production gate requires backup.state=BACKUP_VERIFIED');
  }
  const preprod = record?.evidence?.PREPROD_E2E_VERIFIED;
  if (!preprod) {
    throw new Error(
      'Production gate requires PREPROD_E2E_VERIFIED evidence (real-backend E2E against BACKUP) -- none recorded for this candidate',
    );
  }
  if (preprod.candidate_sha !== record?.git_sha) {
    throw new Error(
      `Production gate requires PREPROD_E2E_VERIFIED evidence for THIS candidate (${record?.git_sha}), but recorded evidence is for ${preprod.candidate_sha} -- a stale pass from an earlier SHA does not carry forward`,
    );
  }
  return true;
}

export function assertCertificationGate(record) {
  if (record?.release_state !== 'PRODUCTION_VERIFIED') {
    throw new Error('Certification requires PRODUCTION_VERIFIED evidence');
  }
  if (record?.production?.state !== 'PRODUCTION_VERIFIED') {
    throw new Error('Certification requires production.state=PRODUCTION_VERIFIED');
  }
  return true;
}
