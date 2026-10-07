import { errorCode } from './telemetry.ts';

export type OperationalOutcome = 'success' | 'failed';
export type OperationalStatus = 'HEALTHY' | 'DEGRADED' | 'UNKNOWN';
export type OperationalEnvironment = 'backup' | 'production' | 'unknown';

export type OperationalSnapshot = {
  state_key: string;
  service: string;
  environment: OperationalEnvironment;
  status: OperationalStatus;
  last_success_at?: number;
  last_failure_at?: number;
  last_error_code?: string;
  last_duration_ms?: number;
  success_count_window: number;
  failure_count_window: number;
  window_started_at: number;
  release: string;
  evidence_status: 'VERIFIED' | 'INSUFFICIENT_DATA' | 'NOT_VERIFIED';
  updated_at: number;
};

const SNAPSHOT_INTERVAL_MS = 60_000;
const WINDOW_MS = 5 * 60_000;
const APP_IDS: Record<string, OperationalEnvironment> = {
  '6a6748e009b947cb29591871': 'backup',
  '6a62213cff3ccbca88c04ff5': 'production',
};
const localCooldown = new Map<string, number>();

function boundedRelease(getEnv: (name: string) => string | undefined) {
  for (const name of ['BASE44_RELEASE_ID', 'RELEASE_ID', 'GIT_SHA', 'BASE44_FUNCTIONS_VERSION']) {
    const value = getEnv(name);
    if (value && /^[A-Za-z0-9._:-]{1,96}$/.test(value)) return value;
  }
  return 'unknown';
}

function environmentFromRequest(
  req: Request,
  getEnv: (name: string) => string | undefined,
): OperationalEnvironment {
  const configured = getEnv('OOH_EARTH_ENVIRONMENT');
  if (configured === 'backup' || configured === 'production') return configured;
  const appId = req.headers.get('base44-app-id') || req.headers.get('x-app-id');
  if (appId && APP_IDS[appId]) return APP_IDS[appId];
  const host = new URL(req.url).hostname;
  if (host === 'ooh-earth-backup.base44.app') return 'backup';
  if (host === 'oohearth.base44.app') return 'production';
  return 'unknown';
}

function cleanService(value: string) {
  return /^[A-Za-z0-9._:-]{1,64}$/.test(value) ? value : 'unknown';
}

export function resolveOperationalEnvironment(
  req: Request,
  getEnv: (name: string) => string | undefined = (name) => Deno.env.get(name),
) {
  return environmentFromRequest(req, getEnv);
}

export async function recordOperationalHealth(
  req: Request,
  service: string,
  outcome: OperationalOutcome,
  durationMs: number,
  options: {
    createClientFromRequest: (req: Request) => any;
    now?: () => number;
    getEnv?: (name: string) => string | undefined;
    error_code?: string;
  },
) {
  // This is deliberately best-effort. A state store outage must not change the
  // business result of the instrumented function.
  try {
    const now = options.now || (() => Date.now());
    const getEnv = options.getEnv || ((name) => Deno.env.get(name));
    const current = now();
    const environment = environmentFromRequest(req, getEnv);
    const safeService = cleanService(service);
    const stateKey = `${safeService}:${environment}`;
    const status: OperationalStatus = outcome === 'success' ? 'HEALTHY' : 'DEGRADED';
    const lastWrite = localCooldown.get(stateKey) || 0;
    const entity = options.createClientFromRequest(req).asServiceRole.entities.OperationalHealth;
    const rows = await entity.filter({ state_key: stateKey });
    const existing = rows && rows[0];
    if (
      existing &&
      current - Number(existing.updated_at || 0) < SNAPSHOT_INTERVAL_MS &&
      existing.status === status
    ) {
      localCooldown.set(stateKey, current);
      return;
    }
    if (!existing && current - lastWrite < SNAPSHOT_INTERVAL_MS) return;

    const windowStartedAt =
      existing && current - Number(existing.window_started_at || 0) < WINDOW_MS
        ? Number(existing.window_started_at)
        : current;
    const snapshot: OperationalSnapshot = {
      state_key: stateKey,
      service: safeService,
      environment,
      status,
      success_count_window:
        (current - windowStartedAt < WINDOW_MS ? Number(existing?.success_count_window || 0) : 0) +
        (outcome === 'success' ? 1 : 0),
      failure_count_window:
        (current - windowStartedAt < WINDOW_MS ? Number(existing?.failure_count_window || 0) : 0) +
        (outcome === 'failed' ? 1 : 0),
      window_started_at: windowStartedAt,
      release: boundedRelease(getEnv),
      evidence_status: 'VERIFIED',
      updated_at: current,
      last_duration_ms: Math.max(0, Math.min(120_000, Math.round(Number(durationMs) || 0))),
    };
    if (outcome === 'success') snapshot.last_success_at = current;
    else {
      snapshot.last_failure_at = current;
      snapshot.last_error_code = errorCode(options.error_code);
      if (existing?.last_success_at) snapshot.last_success_at = existing.last_success_at;
    }
    if (existing?.last_failure_at && outcome === 'success') {
      snapshot.last_failure_at = existing.last_failure_at;
    }
    if (existing?.id) await entity.update(existing.id, snapshot);
    else await entity.create(snapshot);
    localCooldown.set(stateKey, current);
  } catch {
    // Operational state is an observability aid, never a business dependency.
  }
}

export function resetOperationalStateCooldown() {
  localCooldown.clear();
}
