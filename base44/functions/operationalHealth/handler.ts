import { isAppAdmin } from './auth.ts';
import { correlationHeaders, telemetryFor } from './telemetry.ts';

const ALLOWED_ENVIRONMENTS = new Set(['backup', 'production', 'unknown']);

export async function handleOperationalHealth(
  req: Request,
  {
    createClientFromRequest,
    now = () => Date.now(),
  }: { createClientFromRequest: (req: Request) => any; now?: () => number },
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
    const user = await client.auth.me();
    if (!isAppAdmin(user)) {
      telemetry.finish('rejected', { error_code: 'AUTH_REQUIRED' });
      return Response.json(
        { error: 'Forbidden' },
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
    const filter = environment ? { environment } : {};
    const rows = await client.asServiceRole.entities.OperationalHealth.filter(filter);
    const snapshots = (rows || []).slice(0, 24).map((row: Record<string, unknown>) => ({
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
      release: row.release,
      evidence_status: row.evidence_status || 'NOT_VERIFIED',
      updated_at: row.updated_at,
    }));
    telemetry.finish('success', { operation: 'read' });
    return Response.json(
      {
        status: snapshots.length ? 'HEALTHY' : 'UNKNOWN',
        evidence_status: snapshots.length ? 'VERIFIED' : 'INSUFFICIENT_DATA',
        generated_at: now(),
        services: snapshots,
      },
      { headers: correlationHeaders(telemetry) },
    );
  } catch {
    telemetry.finish('failed', { error_code: 'DEPENDENCY_FAILURE' });
    return Response.json(
      { error: 'Operational health unavailable' },
      { status: 503, headers: correlationHeaders(telemetry) },
    );
  }
}
