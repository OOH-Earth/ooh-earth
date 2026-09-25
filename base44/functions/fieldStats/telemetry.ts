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
const FIELDS = new Set([
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

const bounded = (value: unknown) =>
  typeof value === 'string'
    ? value.slice(0, 96)
    : typeof value === 'number' || typeof value === 'boolean' || value === null
      ? value
      : undefined;
const safeError = (value: unknown) =>
  typeof value === 'string' && ERROR_CODES.has(value) ? value : 'INTERNAL_FAILURE';
const release = (getEnv: (name: string) => string | undefined) => {
  for (const name of ['BASE44_RELEASE_ID', 'RELEASE_ID', 'GIT_SHA', 'BASE44_FUNCTIONS_VERSION']) {
    const value = getEnv(name);
    if (value && /^[A-Za-z0-9._:-]{1,96}$/.test(value)) return value;
  }
  return 'unknown';
};

export function telemetryFor(
  req: Request,
  {
    functionName,
    now = () => Date.now(),
    getEnv = (name: string) => Deno.env.get(name),
    logger = console,
  }: any,
) {
  const inbound = req.headers.get('x-request-id') || req.headers.get('x-correlation-id');
  const correlationId = inbound && CORRELATION_ID.test(inbound) ? inbound : crypto.randomUUID();
  const startedAt = now();
  const emit = (event: string, fields: Record<string, unknown> = {}) => {
    try {
      const clean: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (!FIELDS.has(key)) continue;
        clean[key] = key === 'error_code' ? safeError(value) : bounded(value);
      }
      logger.info(
        JSON.stringify({
          timestamp: new Date(now()).toISOString(),
          level: 'info',
          event: `function.${event}`,
          function: functionName,
          correlation_id: correlationId,
          release: release(getEnv),
          ...clean,
        }),
      );
    } catch {
      // Telemetry is fail-open.
    }
  };
  return {
    correlationId,
    startedAt,
    emit,
    finish: (outcome: string, fields: Record<string, unknown> = {}) =>
      emit('completed', { outcome, duration_ms: Math.max(0, now() - startedAt), ...fields }),
  };
}

export const correlationHeaders = (context: { correlationId: string }) => ({
  'x-correlation-id': context.correlationId,
});
