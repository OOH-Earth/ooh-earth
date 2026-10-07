type Outcome = 'success' | 'failed';

const INTERVAL_MS = 60_000;
const WINDOW_MS = 5 * 60_000;
const APP_IDS: Record<string, 'backup' | 'production'> = {
  '6a6748e009b947cb29591871': 'backup',
  '6a62213cff3ccbca88c04ff5': 'production',
};
const lastWrites = new Map<string, number>();
const safeCode = new Set([
  'AUTH_REQUIRED',
  'INVALID_METHOD',
  'INVALID_INPUT',
  'DEPENDENCY_TIMEOUT',
  'DEPENDENCY_FAILURE',
  'SCHEMA_UNAVAILABLE',
  'REPLAY_CONFLICT',
  'INTERNAL_FAILURE',
]);

function environment(req: Request, getEnv: (name: string) => string | undefined) {
  const configured = getEnv('OOH_EARTH_ENVIRONMENT');
  if (configured === 'backup' || configured === 'production') return configured;
  const appId = req.headers.get('base44-app-id') || req.headers.get('x-app-id');
  if (appId && APP_IDS[appId]) return APP_IDS[appId];
  const host = new URL(req.url).hostname;
  if (host === 'ooh-earth-backup.base44.app') return 'backup';
  if (host === 'oohearth.base44.app') return 'production';
  return 'unknown';
}

function release(getEnv: (name: string) => string | undefined) {
  for (const name of ['BASE44_RELEASE_ID', 'RELEASE_ID', 'GIT_SHA', 'BASE44_FUNCTIONS_VERSION']) {
    const value = getEnv(name);
    if (value && /^[A-Za-z0-9._:-]{1,96}$/.test(value)) return value;
  }
  return 'unknown';
}

export async function recordFieldStatsHealth(
  req: Request,
  outcome: Outcome,
  durationMs: number,
  clientFactory: (req: Request) => any,
  now = () => Date.now(),
  getEnv = (name: string) => Deno.env.get(name),
  errorCode?: string,
) {
  try {
    const current = now();
    const stateKey = `fieldStats:${environment(req, getEnv)}`;
    const status = outcome === 'success' ? 'HEALTHY' : 'DEGRADED';
    const entity = clientFactory(req).asServiceRole.entities.OperationalHealth;
    const rows = await entity.filter({ state_key: stateKey });
    const existing = rows?.[0];
    if (
      existing &&
      current - Number(existing.updated_at || 0) < INTERVAL_MS &&
      existing.status === status
    ) {
      lastWrites.set(stateKey, current);
      return;
    }
    if (!existing && current - (lastWrites.get(stateKey) || 0) < INTERVAL_MS) return;
    const inWindow = existing && current - Number(existing.window_started_at || 0) < WINDOW_MS;
    const snapshot: Record<string, unknown> = {
      state_key: stateKey,
      service: 'fieldStats',
      environment: environment(req, getEnv),
      status,
      success_count_window:
        (inWindow ? Number(existing.success_count_window || 0) : 0) +
        (outcome === 'success' ? 1 : 0),
      failure_count_window:
        (inWindow ? Number(existing.failure_count_window || 0) : 0) +
        (outcome === 'failed' ? 1 : 0),
      window_started_at: inWindow ? Number(existing.window_started_at) : current,
      release: release(getEnv),
      evidence_status: 'VERIFIED',
      updated_at: current,
      last_duration_ms: Math.max(0, Math.min(120_000, Math.round(Number(durationMs) || 0))),
    };
    if (outcome === 'success') snapshot.last_success_at = current;
    else {
      snapshot.last_failure_at = current;
      snapshot.last_error_code =
        typeof errorCode === 'string' && safeCode.has(errorCode) ? errorCode : 'INTERNAL_FAILURE';
    }
    if (existing?.last_success_at && outcome === 'failed')
      snapshot.last_success_at = existing.last_success_at;
    if (existing?.last_failure_at && outcome === 'success')
      snapshot.last_failure_at = existing.last_failure_at;
    if (existing?.id) await entity.update(existing.id, snapshot);
    else await entity.create(snapshot);
    lastWrites.set(stateKey, current);
  } catch {
    // Operational state is never allowed to change business behavior.
  }
}
