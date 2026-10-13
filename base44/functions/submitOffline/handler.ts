import { correlationHeaders, telemetryFor } from './telemetry.ts';
import { validateSubmission } from './validate.ts';

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

// What a replay may reveal about an existing (possibly pending, private) record.
// Deliberately excludes ownership, notes, address, photo and coordinates: a retry
// only needs to know the report exists and its id/status.
const REPLAY_FIELDS = ['id', 'status', 'client_operation_id', 'created_date', 'type'];

function replayReceipt(record: Record<string, unknown>) {
  return Object.fromEntries(
    REPLAY_FIELDS.filter((key) => key in record).map((k) => [k, record[k]]),
  );
}

// BOUNDED MITIGATION, NOT ATOMIC IDEMPOTENCY. The platform has no unique constraint
// ("Base44 entities don't support unique constraints") and ignores a caller-chosen
// id, so lookup-before-create cannot stop two truly concurrent identical requests
// from both creating (measured on BACKUP: 8 of 10 simultaneous pairs).
//
// After a create, re-read by operation id (service role, which can see pending
// records). If a strictly earlier record from the SAME submitter exists, this
// request deletes only the record it just created and returns the earlier one.
// It never deletes a record it did not create, never touches another identity's
// record, and never fails the request: any error leaves the duplicate in place
// (pending, visible to moderators). Residual window: if the other request has not
// committed when this one re-reads, both survive.
async function reconcileDuplicate(
  lookup: any,
  operationId: string,
  created: Record<string, any>,
): Promise<{ record: Record<string, any>; removedDuplicate: boolean }> {
  try {
    const siblings: Array<Record<string, any>> =
      (await lookup.filter({ client_operation_id: operationId }, 'created_date', 10)) ?? [];
    const others = siblings.filter((r) => r?.id && r.id !== created.id);
    if (!others.length) return { record: created, removedDuplicate: false };
    const order = (r: Record<string, any>) => `${r.created_date ?? ''}|${r.id}`;
    const earliest = others.reduce((a, b) => (order(a) <= order(b) ? a : b));
    const sameSubmitter = (earliest.created_by_id ?? null) === (created.created_by_id ?? null);
    if (!sameSubmitter || order(earliest) >= order(created)) {
      return { record: created, removedDuplicate: false };
    }
    await lookup.delete(created.id);
    return { record: earliest, removedDuplicate: true };
  } catch {
    return { record: created, removedDuplicate: false };
  }
}

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

  // Privileged / server-owned fields are removed first, then everything else is
  // validated against the entity's allowlist and bounds (see validate.ts). A wrong
  // value is a permanent 422 -- the client must not queue and retry it.
  const stripped = Object.fromEntries(
    Object.entries(payload).filter(([key]) => !STRIPPED_FIELDS.has(key)),
  );
  const checked = validateSubmission(entityType, stripped);
  if (!checked.ok) {
    telemetry.finish('rejected', {
      error_code: 'VALIDATION_REJECTED',
      issue_count: checked.issues.length,
    });
    return Response.json(
      { error: 'Invalid submission', code: 'VALIDATION', fields: checked.issues },
      { status: 422, headers: correlationHeaders(telemetry) },
    );
  }
  const safePayload = checked.payload;
  // Dropped fields are reported (names only) so a caller/telemetry can see them.
  const notices =
    checked.ignored.length || checked.normalized.length
      ? { ignored_fields: checked.ignored, normalized_fields: checked.normalized }
      : undefined;
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
        { ok: true, duplicate: true, record: replayReceipt(existing[0]) },
        { headers: correlationHeaders(telemetry) },
      );
    }
    const created = await entity.create(safePayload);
    const { record, removedDuplicate } = await reconcileDuplicate(lookup, operationId, created);
    telemetry.finish('success', {
      operation: removedDuplicate ? 'create_reconciled' : 'create',
      entity: entityType,
    });
    await recordHealth?.('success', now() - startedAt);
    if (removedDuplicate) {
      return Response.json(
        { ok: true, duplicate: true, record: replayReceipt(record) },
        { headers: correlationHeaders(telemetry) },
      );
    }
    return Response.json(
      { ok: true, duplicate: false, record, ...(notices ? { notices } : {}) },
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
