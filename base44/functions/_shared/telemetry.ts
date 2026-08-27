/**
 * Small, fail-open telemetry seam for Base44 functions.
 *
 * This intentionally emits to the runtime logger only. It performs no network
 * I/O and never receives a request body, provider response, or user record.
 */
const CORRELATION_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/;
const ERROR_CODES = new Set([
  'AUTH_REQUIRED',
  'INVALID_METHOD',
  'INVALID_INPUT',
  'DEPENDENCY_TIMEOUT',
  'DEPENDENCY_FAILURE',
  'SCHEMA_UNAVAILABLE',
  'REPLAY_CONFLICT',
  'INTERNAL_FAILURE',
]);
const FIELD_ALLOWLIST = new Set([
  'operation',
  'outcome',
  'duration_ms',
  'error_code',
  'retryable',
  'entity',
  'event_type',
  'cache',
  'duplicate',
]);

export type TelemetryContext = {
  correlationId: string;
  startedAt: number;
  emit: (event: string, fields?: Record<string, unknown>) => void;
  finish: (outcome: 'success' | 'rejected' | 'failed', fields?: Record<string, unknown>) => void;
};

type Options = {
  functionName: string;
  now?: () => number;
  logger?: Pick<Console, 'info' | 'error'>;
  getEnv?: (name: string) => string | undefined;
};

function safeCorrelationId(value: string | null | undefined) {
  return value && CORRELATION_ID.test(value) ? value : null;
}

function releaseId(getEnv: (name: string) => string | undefined) {
  for (const name of ['BASE44_RELEASE_ID', 'RELEASE_ID', 'GIT_SHA', 'BASE44_FUNCTIONS_VERSION']) {
    const value = getEnv(name);
    if (value && /^[A-Za-z0-9._:-]{1,96}$/.test(value)) return value;
  }
  return 'unknown';
}

function bounded(value: unknown) {
  if (typeof value === 'string') return value.slice(0, 96);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  return undefined;
}

export function telemetryFor(req: Request, options: Options): TelemetryContext {
  const now = options.now || (() => Date.now());
  const getEnv = options.getEnv || ((name) => Deno.env.get(name));
  const logger = options.logger || console;
  const inbound = safeCorrelationId(
    req.headers.get('x-request-id') || req.headers.get('x-correlation-id'),
  );
  const correlationId = inbound || crypto.randomUUID();
  const startedAt = now();
  const emit = (event: string, fields: Record<string, unknown> = {}) => {
    try {
      const clean: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (!FIELD_ALLOWLIST.has(key)) continue;
        const item = key === 'error_code' ? errorCode(value) : bounded(value);
        if (item !== undefined) clean[key] = item;
      }
      logger.info(
        JSON.stringify({
          timestamp: new Date(now()).toISOString(),
          level: 'info',
          event: `function.${event}`,
          function: options.functionName,
          correlation_id: correlationId,
          release: releaseId(getEnv),
          ...clean,
        }),
      );
    } catch {
      // Telemetry must never affect the business operation.
    }
  };
  const finish = (outcome: 'success' | 'rejected' | 'failed', fields = {}) =>
    emit('completed', { outcome, duration_ms: Math.max(0, now() - startedAt), ...fields });
  return { correlationId, startedAt, emit, finish };
}

export function errorCode(value: unknown) {
  return typeof value === 'string' && ERROR_CODES.has(value) ? value : 'INTERNAL_FAILURE';
}

export function correlationHeaders(context: TelemetryContext) {
  return { 'x-correlation-id': context.correlationId };
}

export function isValidCorrelationId(value: string) {
  return CORRELATION_ID.test(value);
}
