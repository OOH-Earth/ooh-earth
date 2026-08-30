// Mission Control reads only the bounded operational-health contract. It never
// scrapes logs or exposes the access token to application code outside fetch.
import { appParams } from '@/lib/app-params';
import { IS_STAGE, IS_LIVE } from '@/lib/appEnv';

export const ENVIRONMENTS = {
  production: { label: 'Production', short: 'PROD', appId: '6a62213cff3ccbca88c04ff5' },
  backup: { label: 'BACKUP', short: 'BACKUP', appId: '6a6748e009b947cb29591871' },
};

const STATUS = new Set(['HEALTHY', 'DEGRADED', 'UNKNOWN']);
const EVIDENCE = new Set(['VERIFIED', 'INSUFFICIENT_DATA', 'NOT_VERIFIED']);
const SERVICES = ['fieldStats', 'submitOffline', 'stripeWebhook'];

function safeSnapshot(value) {
  if (!value || typeof value !== 'object') return null;
  const snapshot = {};
  for (const key of [
    'state_key',
    'service',
    'environment',
    'status',
    'last_success_at',
    'last_failure_at',
    'last_error_code',
    'last_duration_ms',
    'success_count_window',
    'failure_count_window',
    'window_started_at',
    'release',
    'evidence_status',
    'updated_at',
  ]) {
    if (value[key] !== undefined && value[key] !== null) snapshot[key] = value[key];
  }
  if (!STATUS.has(snapshot.status)) snapshot.status = 'UNKNOWN';
  if (!EVIDENCE.has(snapshot.evidence_status)) snapshot.evidence_status = 'NOT_VERIFIED';
  return snapshot.service && snapshot.environment ? snapshot : null;
}

export function normalizeOperationalHealth(payload, environment) {
  const services = Array.isArray(payload?.services)
    ? payload.services.map(safeSnapshot).filter(Boolean)
    : [];
  const status = STATUS.has(payload?.status)
    ? payload.status
    : services.length
      ? 'HEALTHY'
      : 'UNKNOWN';
  const evidenceStatus = EVIDENCE.has(payload?.evidence_status)
    ? payload.evidence_status
    : services.length
      ? 'VERIFIED'
      : 'INSUFFICIENT_DATA';
  return {
    environment,
    status,
    evidence_status: evidenceStatus,
    generated_at: typeof payload?.generated_at === 'number' ? payload.generated_at : null,
    services,
  };
}

function currentEnvironment() {
  if (IS_STAGE) return 'backup';
  if (IS_LIVE) return 'production';
  return null;
}

async function fetchHealth(environment) {
  const target = ENVIRONMENTS[environment];
  const token =
    appParams.token || localStorage.getItem('base44_access_token') || localStorage.getItem('token');
  const headers = { Accept: 'application/json', 'X-App-Id': target.appId };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(
    `https://base44.app/api/apps/${target.appId}/functions/operationalHealth?environment=${environment}`,
    { method: 'GET', headers },
  );
  if (response.status === 401 || response.status === 403) {
    const error = Object.assign(new Error('Authorization required'), {
      code: 'AUTHORIZATION_REQUIRED',
    });
    throw error;
  }
  if (!response.ok) {
    const error = Object.assign(new Error('Operational data unavailable'), {
      code: 'OPERATIONAL_DATA_UNAVAILABLE',
    });
    throw error;
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    const error = Object.assign(new Error('Invalid operational contract'), {
      code: 'INVALID_OPERATIONAL_CONTRACT',
    });
    throw error;
  }
  if (!Array.isArray(payload?.services) || typeof payload !== 'object') {
    const error = Object.assign(new Error('Invalid operational contract'), {
      code: 'INVALID_OPERATIONAL_CONTRACT',
    });
    throw error;
  }
  let release = null;
  try {
    const releaseResponse = await fetch('/release-manifest.json', { cache: 'no-store' });
    if (releaseResponse.ok) {
      const candidate = await releaseResponse.json();
      if (
        candidate &&
        typeof candidate === 'object' &&
        candidate.schema === 'ooh-earth.release-manifest.v2'
      ) {
        release = {
          git_sha: typeof candidate.git_sha === 'string' ? candidate.git_sha : 'UNKNOWN',
          release_state:
            typeof candidate.release_state === 'string' ? candidate.release_state : 'UNKNOWN',
          runtime_revision:
            typeof candidate.runtime_revision === 'string' ? candidate.runtime_revision : 'UNKNOWN',
          source: 'deployed static release manifest',
        };
      }
    }
  } catch {
    // Release metadata is supplemental; operational health remains readable.
  }
  return { ...normalizeOperationalHealth(payload, environment), release };
}

export async function fetchMissionControlHealth(environment) {
  return fetchHealth(environment);
}

export function environmentFromBuild() {
  return currentEnvironment() || 'production';
}

export function serviceRows(health) {
  const indexed = new Map((health?.services || []).map((snapshot) => [snapshot.service, snapshot]));
  return SERVICES.map((service) => ({ service, snapshot: indexed.get(service) || null }));
}
