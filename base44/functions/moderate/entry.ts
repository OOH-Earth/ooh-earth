import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// moderate — verification surface for the ops ladder.
// Entity RLS stays admin-only; this function is the elevated path.
//   queue  (read incoming) : admin | moderator | operative
//   verify (approve/reject): admin | moderator

// Read clearance regardless of whether the SDK returns it flat or under .data
const accessOf = (u) => (u && (u.access ?? u.data?.access)) || 'member';
const roleOf = (u) => (u && (u.role ?? u.data?.role)) || 'user';
const CAN_VIEW = (u) => !!u && (roleOf(u) === 'admin' || ['admin', 'moderator', 'operative'].includes(accessOf(u)));
const CAN_ACT = (u) => !!u && (roleOf(u) === 'admin' || ['admin', 'moderator'].includes(accessOf(u)));

const ENTITIES = new Set(['Location', 'DigitalBust']);
const VERIFY_STATUS = new Set(['verified', 'rejected']);

const ALLOWED_ORIGINS = new Set([
  'https://oohearth.app', 'https://www.oohearth.app', 'https://ooh.earth',
  'http://localhost:5173', 'http://localhost:3000',
]);

function cors(origin) {
  const o = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://oohearth.app';
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405, headers });

  try {
    const base44 = createClientFromRequest(req);
    let caller = null;
    try { caller = await base44.auth.me(); } catch { caller = null; }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'queue').toLowerCase();

    if (action === 'queue') {
      if (!CAN_VIEW(caller)) return Response.json({ error: 'Forbidden — operator clearance required.' }, { status: 403, headers });
      const [locations, digital_busts] = await Promise.all([
        base44.asServiceRole.entities.Location.filter({ status: 'pending' }, '-created_date', 200),
        base44.asServiceRole.entities.DigitalBust.filter({ status: 'pending' }, '-created_date', 200),
      ]);
      return Response.json({
        ok: true, action,
        readonly: !CAN_ACT(caller),
        moderator: { email: caller.email, role: roleOf(caller), access: accessOf(caller) },
        locations: locations || [],
        digital_busts: digital_busts || [],
      }, { headers });
    }

    if (action === 'verify') {
      if (!CAN_ACT(caller)) return Response.json({ error: 'Forbidden — moderator or admin clearance required.' }, { status: 403, headers });
      const entity = String(body?.entity || 'Location');
      const id = String(body?.id || '');
      const status = String(body?.status || '').toLowerCase();
      if (!ENTITIES.has(entity)) return Response.json({ error: `Invalid entity. Use: ${[...ENTITIES].join(', ')}` }, { status: 400, headers });
      if (!id) return Response.json({ error: 'Missing id.' }, { status: 400, headers });
      if (!VERIFY_STATUS.has(status)) return Response.json({ error: `Invalid status. Use: ${[...VERIFY_STATUS].join(', ')}` }, { status: 400, headers });
      const status_updated_at = new Date().toISOString();
      await base44.asServiceRole.entities[entity].update(id, { status, status_updated_at });
      // Cascade to gallery photos so a verified location's uploaded photos become visible
      // in the same action — there's no separate per-photo moderation UI.
      if (entity === 'Location') {
        try {
          const photos = await base44.asServiceRole.entities.LocationPhoto.filter({ location_id: id, status: 'pending' });
          await Promise.all((photos || []).map((p) => base44.asServiceRole.entities.LocationPhoto.update(p.id, { status })));
        } catch { /* gallery cascade is best-effort — location status change still succeeds */ }
      }
      return Response.json({ ok: true, action, changed: { entity, id, status } }, { headers });
    }

    return Response.json({ error: `Unknown action '${action}'. Use: queue | verify.` }, { status: 400, headers });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500, headers });
  }
});
