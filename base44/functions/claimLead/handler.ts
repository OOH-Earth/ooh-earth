const HANDLE_MAX = 80;
const NOTE_MAX = 1000;
const ACTIVE_STATUSES = new Set(['pending', 'accepted']);
const ALLOWED_ORIGINS = new Set([
  'https://oohearth.app',
  'https://www.oohearth.app',
  'https://ooh.earth',
  'http://localhost:5173',
  'http://localhost:3000',
]);

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  inFlight?: Map<string, Promise<ClaimResult>>;
};
type ClaimResult = { status: number; body: unknown };

function cors(origin: string | null) {
  const value = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://oohearth.app';
  return {
    'Access-Control-Allow-Origin': value,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

function stringField(body: any, key: string) {
  return body?.[key] === undefined ? '' : typeof body[key] === 'string' ? body[key].trim() : null;
}

export async function handleClaimLead(
  req: Request,
  { createClientFromRequest, inFlight = new Map() }: Dependencies,
) {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405, headers });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers });
  }
  const locationId = stringField(body, 'location_id');
  const handle = stringField(body, 'operative_handle');
  const note = stringField(body, 'note');
  if (locationId === null || handle === null || note === null) {
    return Response.json({ error: 'Fields must be strings.' }, { status: 400, headers });
  }
  if (!locationId)
    return Response.json({ error: 'Missing location_id.' }, { status: 400, headers });
  if (!handle)
    return Response.json({ error: 'A member handle is required.' }, { status: 400, headers });
  if (handle.length > HANDLE_MAX) {
    return Response.json(
      { error: `Handle must be ${HANDLE_MAX} characters or fewer.` },
      { status: 400, headers },
    );
  }
  if (note.length > NOTE_MAX) {
    return Response.json(
      { error: `Note must be ${NOTE_MAX} characters or fewer.` },
      { status: 400, headers },
    );
  }

  const existingOperation = inFlight.get(locationId);
  if (existingOperation) {
    const result = await existingOperation;
    return Response.json(result.body, { status: result.status, headers });
  }

  const operation = (async () => {
    const base44 = createClientFromRequest(req);
    const locations = await base44.asServiceRole.entities.Location.filter({ id: locationId });
    const location = locations?.[0];
    if (!location) return { status: 404, body: { error: 'That location no longer exists.' } };
    const existing = await base44.asServiceRole.entities.LeadClaim.filter({
      location_id: locationId,
    });
    if ((existing || []).some((claim: any) => ACTIVE_STATUSES.has(claim?.status || 'pending'))) {
      return { status: 409, body: { error: 'This lead is already claimed.' } };
    }
    const claim = await base44.asServiceRole.entities.LeadClaim.create({
      location_id: locationId,
      location_title: typeof location.title === 'string' ? location.title : '',
      operative_handle: handle,
      note,
    });
    return { status: 200, body: { ok: true, claim } };
  })();
  inFlight.set(locationId, operation);
  try {
    const result = await operation;
    return Response.json(result.body, { status: result.status, headers });
  } catch (error) {
    console.error('claimLead failed:', error instanceof Error ? error.name : 'unknown');
    return Response.json({ error: 'Could not submit claim.' }, { status: 500, headers });
  } finally {
    inFlight.delete(locationId);
  }
}
