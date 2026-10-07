type Outcome = 'success' | 'failed';
const INTERVAL = 60_000;
const WINDOW = 5 * 60_000;
const APP_IDS: Record<string, 'backup' | 'production'> = {
  '6a6748e009b947cb29591871': 'backup',
  '6a62213cff3ccbca88c04ff5': 'production',
};
const lastWrites = new Map<string, number>();
const safeCode = new Set(['DEPENDENCY_FAILURE', 'INTERNAL_FAILURE']);
function environment(req: Request, getEnv: (name: string) => string | undefined) {
  const configured = getEnv('OOH_EARTH_ENVIRONMENT');
  if (configured === 'backup' || configured === 'production') return configured;
  const appId = req.headers.get('base44-app-id') || req.headers.get('x-app-id');
  if (appId && APP_IDS[appId]) return APP_IDS[appId];
  const host = new URL(req.url).hostname;
  return host === 'ooh-earth-backup.base44.app'
    ? 'backup'
    : host === 'oohearth.base44.app'
      ? 'production'
      : 'unknown';
}
function release(getEnv: (name: string) => string | undefined) {
  for (const name of ['BASE44_RELEASE_ID', 'RELEASE_ID', 'GIT_SHA', 'BASE44_FUNCTIONS_VERSION']) {
    const value = getEnv(name);
    if (value && /^[A-Za-z0-9._:-]{1,96}$/.test(value)) return value;
  }
  return 'unknown';
}
export async function recordOperationalHealth(
  req: Request,
  service: string,
  outcome: Outcome,
  durationMs: number,
  options: { createClientFromRequest: (req: Request) => any; error_code?: string },
) {
  try {
    const now = Date.now();
    const env = environment(req, (name) => Deno.env.get(name));
    const key = `${service}:${env}`;
    const entity = options.createClientFromRequest(req).asServiceRole.entities.OperationalHealth;
    const existing = (await entity.filter({ state_key: key }))?.[0];
    const status = outcome === 'success' ? 'HEALTHY' : 'DEGRADED';
    if (existing && now - Number(existing.updated_at || 0) < INTERVAL && existing.status === status)
      return;
    if (!existing && now - (lastWrites.get(key) || 0) < INTERVAL) return;
    const inWindow = existing && now - Number(existing.window_started_at || 0) < WINDOW;
    const snapshot: Record<string, unknown> = {
      state_key: key,
      service,
      environment: env,
      status,
      success_count_window:
        (inWindow ? Number(existing.success_count_window || 0) : 0) +
        (outcome === 'success' ? 1 : 0),
      failure_count_window:
        (inWindow ? Number(existing.failure_count_window || 0) : 0) +
        (outcome === 'failed' ? 1 : 0),
      window_started_at: inWindow ? Number(existing.window_started_at) : now,
      release: release((name) => Deno.env.get(name)),
      evidence_status: 'VERIFIED',
      updated_at: now,
      last_duration_ms: Math.max(0, Math.min(120_000, Math.round(Number(durationMs) || 0))),
    };
    if (outcome === 'success') snapshot.last_success_at = now;
    else {
      snapshot.last_failure_at = now;
      snapshot.last_error_code = safeCode.has(options.error_code || '')
        ? options.error_code
        : 'INTERNAL_FAILURE';
      if (existing?.last_success_at) snapshot.last_success_at = existing.last_success_at;
    }
    if (existing?.last_failure_at && outcome === 'success')
      snapshot.last_failure_at = existing.last_failure_at;
    if (existing?.id) await entity.update(existing.id, snapshot);
    else await entity.create(snapshot);
    lastWrites.set(key, now);
  } catch {
    /* state persistence is never a business dependency */
  }
}
