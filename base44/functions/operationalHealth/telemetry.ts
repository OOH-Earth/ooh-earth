export function telemetryFor(req: Request, options: { functionName: string; now?: () => number }) {
  const now = options.now || (() => Date.now());
  const correlationId =
    req.headers.get('x-request-id') || req.headers.get('x-correlation-id') || crypto.randomUUID();
  const startedAt = now();
  const emit = (event: string, fields: Record<string, unknown> = {}) => {
    try {
      console.info(
        JSON.stringify({
          timestamp: new Date(now()).toISOString(),
          level: 'info',
          event: `function.${event}`,
          function: options.functionName,
          correlation_id: /^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/.test(correlationId)
            ? correlationId
            : 'unknown',
          release: 'unknown',
          ...Object.fromEntries(
            Object.entries(fields).filter(([key]) =>
              ['outcome', 'operation', 'error_code'].includes(key),
            ),
          ),
          duration_ms: Math.max(0, now() - startedAt),
        }),
      );
    } catch {
      // Telemetry is fail-open.
    }
  };
  return {
    correlationId,
    finish: (outcome: string, fields?: Record<string, unknown>) =>
      emit('completed', { outcome, ...fields }),
  };
}

export function correlationHeaders(context: { correlationId: string }) {
  return { 'x-correlation-id': context.correlationId };
}
