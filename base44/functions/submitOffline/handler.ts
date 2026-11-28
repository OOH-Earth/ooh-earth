import { correlationHeaders, telemetryFor } from './telemetry.ts';
import { sha256Hex, statusOf, submitWithTicket } from './tickets.ts';

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

// Who is calling: a signed-in user's id, or 'anonymous'. Only a definite "not signed in" counts
// as anonymous; if the check itself fails the request fails, so a ticket is never re-attributed.
async function callerId(base44: any): Promise<string> {
  try {
    return (await base44.auth.me())?.id || 'anonymous';
  } catch (error) {
    const status = statusOf(error);
    if (status === 401 || status === 403) return 'anonymous';
    throw error;
  }
}

function isOperationId(value: unknown): value is string {
  return typeof value === 'string' && OPERATION_ID.test(value);
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

  // Step 1 of a submission: obtain the ticket that the send will claim.
  if (body?.action === 'reserve') {
    const operation = body?.operation_id;
    if (!ENTITY_NAMES.has(entityType) || !isOperationId(operation)) {
      telemetry.finish('rejected', { error_code: 'INVALID_INPUT' });
      return jsonError('Invalid reservation', 400, correlationHeaders(telemetry), 'VALIDATION');
    }
    try {
      const base44 = createClientFromRequest(req);
      const ticket = await base44.asServiceRole.entities.SubmissionTicket.create({
        operation_hash: await sha256Hex(operation),
        entity_type: entityType,
        owner_id: await callerId(base44),
        state: 'open',
      });
      telemetry.finish('success', { operation: 'reserve', entity: entityType });
      return Response.json(
        { ok: true, ticket_id: ticket.id },
        { headers: correlationHeaders(telemetry) },
      );
    } catch (error) {
      telemetry.finish('failed', { error_code: 'DEPENDENCY_FAILURE' });
      console.error(
        'submitOffline reserve failed:',
        error instanceof Error ? error.name : 'unknown',
      );
      return jsonError('Submission unavailable', 503, correlationHeaders(telemetry));
    }
  }

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
  if (!isOperationId(operationId)) {
    telemetry.finish('rejected', { error_code: 'INVALID_INPUT' });
    return jsonError('Invalid operation id', 400, correlationHeaders(telemetry));
  }

  const safePayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => !STRIPPED_FIELDS.has(key)),
  );
  try {
    const base44 = createClientFromRequest(req);
    const entity = base44.entities[entityType];
    // Lookups use the service role: an anonymous submitter cannot read their own pending
    // record, so a caller-scoped lookup misses it and a replay creates a second one.
    // Creation stays caller-scoped, so RLS, field locks and ownership are unchanged.
    const lookup = (base44.asServiceRole ?? base44).entities[entityType];

    if (typeof body.ticket_id === 'string' && body.ticket_id) {
      const outcome = await submitWithTicket(
        {
          tickets: base44.asServiceRole.entities.SubmissionTicket,
          lookup,
          create: (data) => entity.create(data),
          now,
        },
        {
          ticketId: body.ticket_id,
          operationId: operationId as string,
          entityType,
          ownerId: await callerId(base44),
          payload: safePayload,
        },
      );
      const headers = correlationHeaders(telemetry);
      if (outcome.kind === 'created' || outcome.kind === 'duplicate') {
        const replay = outcome.kind === 'duplicate';
        telemetry.finish('success', {
          operation: replay ? 'replay' : 'create',
          entity: entityType,
        });
        await recordHealth?.('success', now() - startedAt);
        return Response.json(
          {
            ok: true,
            duplicate: replay,
            record: replay ? { id: outcome.recordId } : outcome.record,
          },
          { headers },
        );
      }
      if (outcome.kind === 'pending') {
        telemetry.finish('success', { operation: 'pending', entity: entityType });
        return Response.json(
          { ok: false, pending: true, retry_after_ms: outcome.retryAfterMs },
          { status: 202, headers },
        );
      }
      if (outcome.kind === 'rejected') {
        telemetry.finish('rejected', { error_code: outcome.code });
        return jsonError('Submission rejected', outcome.status, headers, outcome.code);
      }
      telemetry.finish('failed', { error_code: 'DEPENDENCY_FAILURE' });
      await recordHealth?.('failed', now() - startedAt, 'DEPENDENCY_FAILURE');
      return jsonError('Delivery unknown', 503, headers, 'OUTCOME_UNKNOWN');
    }

    // No ticket: a client from before tickets existed. This path is check-then-create and can
    // still duplicate under concurrency; it only closes the sequential-replay case.
    const existing = await lookup.filter({ client_operation_id: operationId }, '-created_date', 1);
    if (existing?.[0]) {
      const found = existing[0];
      const owner = found.created_by_id;
      if (owner && owner !== 'anonymous' && (await callerId(base44)) !== owner) {
        telemetry.finish('rejected', { error_code: 'OPERATION_ID_CONFLICT' });
        return jsonError(
          'Operation id already used',
          409,
          correlationHeaders(telemetry),
          'CONFLICT',
        );
      }
      telemetry.finish('success', { operation: 'replay', entity: entityType });
      await recordHealth?.('success', now() - startedAt);
      // A receipt, not the record: possession of an operation id must not expose a submission.
      const { id, status, lat, lng, location_id } = found;
      return Response.json(
        { ok: true, duplicate: true, record: { id, status, lat, lng, location_id } },
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
    // A request that can never succeed must not look like an outage, or clients retry it.
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
