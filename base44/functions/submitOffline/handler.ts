import { correlationHeaders, telemetryFor } from '../_shared/telemetry.ts';

const OPERATION_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const ENTITY_NAMES = new Set(['Location', 'FieldCheck']);
const STRIPPED_FIELDS = new Set(['id', 'created_by_id', 'created_date', 'updated_date']);

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
};

function jsonError(error: string, status: number, headers?: Record<string, string>) {
  return Response.json({ error }, { status, headers });
}

export async function handleSubmitOffline(req: Request, { createClientFromRequest }: Dependencies) {
  const telemetry = telemetryFor(req, { functionName: 'submitOffline' });
  telemetry.emit('received');
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
    const existing = await entity.filter({ client_operation_id: operationId }, '-created_date', 1);
    if (existing?.[0]) {
      telemetry.finish('success', { operation: 'replay', entity: entityType });
      return Response.json(
        { ok: true, duplicate: true, record: existing[0] },
        { headers: correlationHeaders(telemetry) },
      );
    }
    const record = await entity.create(safePayload);
    telemetry.finish('success', { operation: 'create', entity: entityType });
    return Response.json(
      { ok: true, duplicate: false, record },
      { headers: correlationHeaders(telemetry) },
    );
  } catch (error) {
    telemetry.finish('failed', { error_code: 'DEPENDENCY_FAILURE' });
    console.error('submitOffline failed:', error instanceof Error ? error.name : 'unknown');
    return jsonError('Submission unavailable', 503, correlationHeaders(telemetry));
  }
}
