import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// claimLead — server-side write path for "claim a lead" (ClaimLeadDialog.jsx).
//
// LeadClaim.create is restricted to admin in entity RLS (base44/entities/
// LeadClaim.jsonc) -- this function is the elevated path, matching the
// pattern already used by moderate/entry.ts for Location/DigitalBust
// verification. Anonymous/pseudonymous claiming stays frictionless by
// design (operative_handle is self-typed, not tied to a real account) --
// this function validates and bounds the payload server-side rather than
// adding a login wall, per the product's existing crowdsourced-tip model.

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

function cors(origin: string | null) {
  const o = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://oohearth.app';
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405, headers });

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const locationId = String(body?.location_id || '').trim();
    const handle = String(body?.operative_handle || '').trim();
    const note = String(body?.note || '')
      .trim()
      .slice(0, NOTE_MAX);

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

    // Validate location_id against a real Location record -- never trust a
    // client-supplied title, and never let a claim attach to a location that
    // doesn't exist.
    const locations = await base44.asServiceRole.entities.Location.filter({ id: locationId });
    const location = locations?.[0];
    if (!location)
      return Response.json({ error: 'That location no longer exists.' }, { status: 404, headers });

    // Prevent an obviously duplicate claim -- one active (pending/accepted)
    // claim per location at a time, using the status field the entity
    // already has. Not a hard uniqueness constraint (Base44 entities don't
    // support one here), just a check-then-write guard against the common
    // case; a true race is still possible but low-stakes for this feature.
    const existing = await base44.asServiceRole.entities.LeadClaim.filter({
      location_id: locationId,
    });
    if (
      (existing || []).some((c: { status?: string }) => ACTIVE_STATUSES.has(c?.status || 'pending'))
    ) {
      return Response.json({ error: 'This lead is already claimed.' }, { status: 409, headers });
    }

    const claim = await base44.asServiceRole.entities.LeadClaim.create({
      location_id: locationId,
      location_title: location.title || '',
      operative_handle: handle,
      note,
    });

    return Response.json({ ok: true, claim }, { headers });
  } catch (err) {
    return Response.json({ error: 'Could not submit claim.' }, { status: 500, headers });
  }
});
