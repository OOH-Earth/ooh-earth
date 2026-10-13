import { correlationHeaders, telemetryFor } from './telemetry.ts';

const OPERATION_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const ENTITY_NAMES = new Set(['Location', 'FieldCheck']);
// `status`/`status_updated_at` are stripped for the same reason as the
// identity/timestamp fields above: `moderate.ts` (asServiceRole) is the
// only legitimate writer of a Location/FieldCheck's verification state,
// after a human reviews it. Location and FieldCheck both have
// `rls.create: null` (open, by design, so anyone can submit a report) with
// no field-level restriction on `status` -- without stripping it here, an
// unauthenticated POST to this function could set `status: "verified"`
// directly on creation and skip moderation entirely. Every legitimate
// caller (FieldCheckCamera, FieldReport, QuickCapture) already only ever
// sends 'pending' or omits the field, so stripping it changes nothing for
// real submissions; it only removes fields no honest client needs to set.
const STRIPPED_FIELDS = new Set([
  'id',
  'created_by_id',
  'created_date',
  'updated_date',
  'status',
  'status_updated_at',
]);

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  now?: () => number;
  recordHealth?: (
    outcome: 'success' | 'failed',
    durationMs: number,
    errorCode?: string,
  ) => Promise<void> | void;
};

function jsonError(error: string, status: number, headers?: Record<string, string>, code?: string) {
  return Response.json(code ? { error, code } : { error }, { status, headers });
}

// HTTP status carried by an SDK/platform error, if any (Base44Error.status, or
// an axios-style response.status).
function statusOf(error: any): number | undefined {
  const status = Number(error?.status ?? error?.response?.status);
  return Number.isFinite(status) ? status : undefined;
}

export async function handleSubmitOffline(
  req: Request,
  { createClientFromRequest, now = () => Date.now(), recordHealth }: Dependencies,
) {
  const telemetry = telemetryFor(req, { functionName: 'submitOffline' });
  telemetry.emit('received');
  const startedAt = now();
  if (req.method !== 'POST') {
    telemetry.finish('rejected', { error_code: 'INVALID_METHOD' });
    return jsonError('POST only', 405, correlationHeaders(telemetry));
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    telemetry.finish('rejected', { error_code: 'INVALID_INPUT' });
    return jsonError('Malformed JSON', 400, correlationHeaders(telemetry));
  }

  const entityType = String(body?.entity_type || '');
  const payload = body?.payload;
  const operationId = payload?.client_operation_id;
  if (
    !ENTITY_NAMES.has(entityType) ||
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    telemetry.finish('rejected', { error_code: 'INVALID_INPUT' });
    return jsonError('Invalid submission', 400, correlationHeaders(telemetry));
  }
  if (typeof operationId !== 'string' || !OPERATION_ID.test(operationId)) {
    telemetry.finish('rejected', { error_code: 'INVALID_INPUT' });
    return jsonError('Invalid operation id', 400, correlationHeaders(telemetry));
  }

  const safePayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => !STRIPPED_FIELDS.has(key)),
  );
  try {
    const base44 = createClientFromRequest(req);
    const entity = base44.entities[entityType];
    // Idempotency lookup runs with the service role: a pending report is
    // invisible to its own anonymous submitter (read RLS is verified-only /
    // own-by-user-id), so a caller-scoped lookup never finds the record an
    // anonymous retry already created and a replay would create a duplicate.
    // The operation id is an unguessable client UUID, so possession of it is
    // the capability to replay. The create below stays caller-scoped, so RLS,
    // field locks and ownership are unchanged.
    const lookup = (base44.asServiceRole ?? base44).entities[entityType];
    const existing = await lookup.filter({ client_operation_id: operationId }, '-created_date', 1);
    if (existing?.[0]) {
      // A record owned by a signed-in user may only be replayed by that user;
      // anonymous-owned records are replayable by whoever holds the operation id.
      const owner = existing[0].created_by_id;
      if (owner && owner !== 'anonymous') {
        const me = await base44.auth?.me?.().catch?.(() => null);
        if (me?.id !== owner) {
          telemetry.finish('rejected', { error_code: 'OPERATION_ID_CONFLICT' });
          return jsonError(
            'Operation id already used',
            409,
            correlationHeaders(telemetry),
            'CONFLICT',
          );
        }
      }
      telemetry.finish('success', { operation: 'replay', entity: entityType });
      await recordHealth?.('success', now() - startedAt);
      return Response.json(
        { ok: true, duplicate: true, record: existing[0] },
        { headers: correlationHeaders(telemetry) },
      );
    }
    const record = await entity.create(safePayload);
    telemetry.finish('success', { operation: 'create', entity: entityType });
    await recordHealth?.('success', now() - startedAt);
    return Response.json(
      { ok: true, duplicate: false, record },
      { headers: correlationHeaders(telemetry) },
    );
  } catch (error) {
    // Permanent client errors must not look like a transient outage: the
    // client would queue and retry a request that can never succeed. Only
    // genuinely unknown/server-side failures stay 503 (retryable).
    const status = statusOf(error);
    if (status === 400 || status === 422) {
      telemetry.finish('rejected', { error_code: 'VALIDATION_REJECTED' });
      return jsonError('Invalid submission', 422, correlationHeaders(telemetry), 'VALIDATION');
    }
    if (status === 403) {
      telemetry.finish('rejected', { error_code: 'FORBIDDEN' });
      return jsonError('Not permitted', 403, correlationHeaders(telemetry), 'FORBIDDEN');
    }
    telemetry.finish('failed', { error_code: 'DEPENDENCY_FAILURE' });
    await recordHealth?.('failed', now() - startedAt, 'DEPENDENCY_FAILURE');
    console.error('submitOffline failed:', error instanceof Error ? error.name : 'unknown');
    return jsonError('Submission unavailable', 503, correlationHeaders(telemetry));
  }
}
