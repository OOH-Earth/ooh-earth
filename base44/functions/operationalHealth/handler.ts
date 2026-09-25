import { isAppAdmin } from './auth.ts';
import { correlationHeaders, telemetryFor } from './telemetry.ts';

const ALLOWED_ENVIRONMENTS = new Set(['backup', 'production', 'unknown']);
const SHA_PATTERN = /^[0-9a-f]{7,64}$/i;
const HEALTH_STALE_MS = 15 * 60 * 1000;

export type OperationalHealthReason =
  | 'HEALTHY'
  | 'SERVICE_DEGRADED'
  | 'NO_SERVICE_SNAPSHOT'
  | 'SERVICE_SNAPSHOT_STALE'
  | 'CANDIDATE_MISMATCH'
  | 'RELEASE_EVIDENCE_MISSING'
  | 'HEALTH_STORE_UNAVAILABLE'
  | 'INVALID_INPUT';

function boundedRelease(value: unknown) {
  return typeof value === 'string' && SHA_PATTERN.test(value) ? value : 'unknown';
}

export function evaluateOperationalSnapshots(
  rows: Record<string, unknown>[],
  { now, environment, candidateSha }: { now: number; environment: string; candidateSha?: string },
) {
  const services = rows
    .filter((row) => row && row.environment === environment)
    .slice(0, 24)
    .map((row) => ({
      state_key: row.state_key,
      service: row.service,
      environment: row.environment,
      status: row.status,
      last_success_at: row.last_success_at,
      last_failure_at: row.last_failure_at,
      last_error_code: row.last_error_code,
      last_duration_ms: row.last_duration_ms,
      success_count_window: row.success_count_window,
      failure_count_window: row.failure_count_window,
      window_started_at: row.window_started_at,
      release: boundedRelease(row.release),
      evidence_status: row.evidence_status || 'NOT_VERIFIED',
      updated_at: row.updated_at,
    }));

  const base = { services, generated_at: now, environment, candidate_sha: candidateSha || null };
  if (!services.length) {
    return {
      ...base,
      status: 'UNKNOWN',
      evidence_status: 'INSUFFICIENT_DATA',
      reason_code: 'NO_SERVICE_SNAPSHOT' as OperationalHealthReason,
      retryable: true,
    };
  }

  if (candidateSha) {
    const mismatched = services.some(
      (service) => service.release !== 'unknown' && service.release !== candidateSha,
    );
    const missing = services.some((service) => service.release === 'unknown');
    if (mismatched) {
      return {
        ...base,
        status: 'UNKNOWN',
        evidence_status: 'NOT_VERIFIED',
        reason_code: 'CANDIDATE_MISMATCH' as OperationalHealthReason,
        retryable: false,
      };
    }
    if (missing) {
      return {
        ...base,
        status: 'UNKNOWN',
        evidence_status: 'INSUFFICIENT_DATA',
        reason_code: 'RELEASE_EVIDENCE_MISSING' as OperationalHealthReason,
        retryable: true,
      };
    }
  }

  const stale = services.some((service) => now - Number(service.updated_at || 0) > HEALTH_STALE_MS);
  if (stale) {
    return {
      ...base,
      status: 'UNKNOWN',
      evidence_status: 'INSUFFICIENT_DATA',
      reason_code: 'SERVICE_SNAPSHOT_STALE' as OperationalHealthReason,
      retryable: true,
    };
  }
  const degraded = services.some((service) => service.status === 'DEGRADED');
  return {
    ...base,
    status: degraded ? 'DEGRADED' : 'HEALTHY',
    evidence_status: services.every((service) => service.evidence_status === 'VERIFIED')
      ? 'VERIFIED'
      : 'NOT_VERIFIED',
    reason_code: (degraded ? 'SERVICE_DEGRADED' : 'HEALTHY') as OperationalHealthReason,
    retryable: degraded,
  };
}

export async function handleOperationalHealth(
  req: Request,
  {
    createClientFromRequest,
    now = () => Date.now(),
    getEnv = (name: string) => Deno.env.get(name),
  }: {
    createClientFromRequest: (req: Request) => any;
    now?: () => number;
    getEnv?: (name: string) => string | undefined;
  },
) {
  const telemetry = telemetryFor(req, { functionName: 'operationalHealth', now });
  if (req.method !== 'GET') {
    telemetry.finish('rejected', { error_code: 'INVALID_METHOD' });
    return Response.json(
      { error: 'GET only' },
      { status: 405, headers: correlationHeaders(telemetry) },
    );
  }
  try {
    const client = createClientFromRequest(req);
    let user;
    try {
      user = await client.auth.me();
    } catch {
      telemetry.finish('rejected', { error_code: 'AUTH_REQUIRED' });
      return Response.json(
        {
          error: 'Authentication required',
          reason_code: 'AUTHENTICATION_FAILURE',
          retryable: false,
        },
        { status: 401, headers: correlationHeaders(telemetry) },
      );
    }
    if (!user) {
      telemetry.finish('rejected', { error_code: 'AUTH_REQUIRED' });
      return Response.json(
        {
          error: 'Authentication required',
          reason_code: 'AUTHENTICATION_FAILURE',
          retryable: false,
        },
        { status: 401, headers: correlationHeaders(telemetry) },
      );
    }
    if (!isAppAdmin(user)) {
      telemetry.finish('rejected', { error_code: 'AUTH_REQUIRED' });
      return Response.json(
        { error: 'Forbidden', reason_code: 'AUTHORIZATION_FAILURE', retryable: false },
        { status: 403, headers: correlationHeaders(telemetry) },
      );
    }
    const query = new URL(req.url).searchParams;
    const environment = query.get('environment') || undefined;
    if (environment && !ALLOWED_ENVIRONMENTS.has(environment)) {
      telemetry.finish('rejected', { error_code: 'INVALID_INPUT' });
      return Response.json(
        { error: 'Invalid environment' },
        { status: 400, headers: correlationHeaders(telemetry) },
      );
    }
    const candidateSha = query.get('candidate_sha') || undefined;
    if (candidateSha && !SHA_PATTERN.test(candidateSha)) {
      telemetry.finish('rejected', { error_code: 'INVALID_INPUT' });
      return Response.json(
        { error: 'Invalid candidate SHA', reason_code: 'INVALID_INPUT' },
        { status: 400, headers: correlationHeaders(telemetry) },
      );
    }
    // Base44's filtered entity read has historically thrown for an empty match in
    // some environments. A bounded list followed by local filtering turns that
    // deterministic no-data state into UNKNOWN instead of a misleading 503.
    const rows = await client.asServiceRole.entities.OperationalHealth.list('-updated_at', 100);
    let configuredEnvironment;
    try {
      configuredEnvironment = getEnv('OOH_EARTH_ENVIRONMENT');
    } catch {
      configuredEnvironment = undefined;
    }
    const result = evaluateOperationalSnapshots(rows || [], {
      now: now(),
      environment: environment || configuredEnvironment || 'unknown',
      candidateSha,
    });
    telemetry.finish('success', { operation: 'read' });
    return Response.json(result, { headers: correlationHeaders(telemetry) });
  } catch (error) {
    const reason =
      error instanceof Error && /auth|forbidden|unauthor/i.test(error.message)
        ? 'HEALTH_STORE_UNAVAILABLE'
        : 'HEALTH_STORE_UNAVAILABLE';
    telemetry.finish('failed', { error_code: 'DEPENDENCY_FAILURE' });
    return Response.json(
      {
        status: 'UNKNOWN',
        evidence_status: 'INSUFFICIENT_DATA',
        reason_code: reason,
        retryable: true,
        error: 'Operational health unavailable',
      },
      { status: 503, headers: correlationHeaders(telemetry) },
    );
  }
}
