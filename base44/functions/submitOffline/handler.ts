const OPERATION_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const ENTITY_NAMES = new Set(['Location', 'FieldCheck']);
const STRIPPED_FIELDS = new Set(['id', 'created_by_id', 'created_date', 'updated_date']);

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
};

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function handleSubmitOffline(req: Request, { createClientFromRequest }: Dependencies) {
  if (req.method !== 'POST') return jsonError('POST only', 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError('Malformed JSON', 400);
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
    return jsonError('Invalid submission', 400);
  }
  if (typeof operationId !== 'string' || !OPERATION_ID.test(operationId)) {
    return jsonError('Invalid operation id', 400);
  }

  const safePayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => !STRIPPED_FIELDS.has(key)),
  );
  try {
    const base44 = createClientFromRequest(req);
    const entity = base44.entities[entityType];
    const existing = await entity.filter({ client_operation_id: operationId }, '-created_date', 1);
    if (existing?.[0]) {
      return Response.json({ ok: true, duplicate: true, record: existing[0] });
    }
    const record = await entity.create(safePayload);
    return Response.json({ ok: true, duplicate: false, record });
  } catch (error) {
    console.error('submitOffline failed:', error instanceof Error ? error.name : 'unknown');
    return jsonError('Submission unavailable', 503);
  }
}
