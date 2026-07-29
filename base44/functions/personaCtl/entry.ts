import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// personaCtl — admin-only identity/clearance controller.
//   role   : Base44 built-in platform gate   [admin | user]
//   access : app-level clearance ladder       [admin | moderator | operative | member]
// Every change is written to the AccessLog audit entity (best-effort).
// Authorize by an authenticated admin (role/access) OR the PERSONA_KEY secret.

const ROLES = new Set(['admin', 'user']);
const ACCESS = new Set(['admin', 'moderator', 'operative', 'member']);

// Read clearance regardless of whether the SDK returns it flat or under .data
const accessOf = (u) => (u && (u.access ?? u.data?.access)) || 'member';
const roleOf = (u) => (u && (u.role ?? u.data?.role)) || 'user';
const isElevated = (u) => !!u && (roleOf(u) === 'admin' || accessOf(u) === 'admin');

const ALLOWED_ORIGINS = new Set([
  'https://oohearth.app', 'https://www.oohearth.app', 'https://ooh.earth',
  'http://localhost:5173', 'http://localhost:3000',
]);

function cors(origin) {
  const o = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://oohearth.app';
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Persona-Key',
    'Vary': 'Origin',
  };
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405, headers });

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'list').toLowerCase();

    let caller = null;
    try { caller = await base44.auth.me(); } catch { caller = null; }
    const keyProvided = req.headers.get('x-persona-key') || body?.key || '';
    const keyExpected = Deno.env.get('PERSONA_KEY') || '';
    const keyOk = keyExpected.length > 0 && keyProvided === keyExpected;

    if (!keyOk && !isElevated(caller)) {
      return Response.json(
        { error: 'Unauthorized — sign in as an admin, or send a valid X-Persona-Key.' },
        { status: 403, headers },
      );
    }

    const svc = base44.asServiceRole.entities.User;
    const via = keyOk && !isElevated(caller) ? 'key' : 'panel';

    const roster = async () => {
      const users = await svc.list('-created_date', 500);
      return (users || []).map((u) => ({
        id: u.id, email: u.email, full_name: u.full_name,
        role: roleOf(u), access: accessOf(u),
      }));
    };

    const logChange = async (rec) => {
      try {
        await base44.asServiceRole.entities.AccessLog.create({
          via,
          actor_email: caller?.email || (keyOk ? 'system:key' : ''),
          actor_id: caller?.id || '',
          ...rec,
        });
      } catch { /* audit failure must never break the operation */ }
    };

    if (action === 'list') {
      return Response.json({ ok: true, action, users: await roster() }, { headers });
    }

    if (action === 'set') {
      const patch = {};
      if (body?.role !== undefined) {
        const role = String(body.role).toLowerCase();
        if (!ROLES.has(role)) return Response.json({ error: `Invalid role. Use: ${[...ROLES].join(', ')}` }, { status: 400, headers });
        patch.role = role;
      }
      if (body?.access !== undefined) {
        const access = String(body.access).toLowerCase();
        if (!ACCESS.has(access)) return Response.json({ error: `Invalid access. Use: ${[...ACCESS].join(', ')}` }, { status: 400, headers });
        patch.access = access;
      }
      if (!('role' in patch) && !('access' in patch)) {
        return Response.json({ error: 'Nothing to set — pass role and/or access.' }, { status: 400, headers });
      }

      let target = null;
      if (body?.id) { try { target = await svc.get(String(body.id)); } catch { target = null; } }
      else if (body?.email) { const f = await svc.filter({ email: String(body.email) }, '-created_date', 1); target = (f || [])[0] || null; }
      if (!target) return Response.json({ error: 'Target user not found — pass a valid id or email.' }, { status: 404, headers });

      // lockout guard: never drop the last platform admin
      if (patch.role === 'user' && roleOf(target) === 'admin') {
        const all = await svc.list('-created_date', 500);
        if ((all || []).filter((u) => roleOf(u) === 'admin').length <= 1) {
          return Response.json({ error: 'Refused — that is the last platform admin. Promote another account first.' }, { status: 409, headers });
        }
      }

      const before = { role: roleOf(target), access: accessOf(target) };
      await svc.update(target.id, patch);
      const after = { ...before, ...patch };

      await logChange({
        action: 'set', target_email: target.email, target_id: target.id,
        from_role: before.role, to_role: after.role,
        from_access: before.access, to_access: after.access,
      });

      return Response.json({
        ok: true, action,
        changed: { id: target.id, email: target.email, from: before, to: after },
        users: await roster(),
      }, { headers });
    }

    if (action === 'reset') {
      const anchor = String(body?.anchor_email || '').toLowerCase();
      if (!anchor) return Response.json({ error: 'reset requires anchor_email.' }, { status: 400, headers });
      const all = await svc.list('-created_date', 500);
      const anchorUser = (all || []).find((u) => String(u.email || '').toLowerCase() === anchor);
      if (!anchorUser) return Response.json({ error: `anchor_email ${anchor} not found in this app.` }, { status: 404, headers });

      for (const u of all || []) {
        const want = u.id === anchorUser.id ? { role: 'admin', access: 'admin' } : { role: 'user', access: 'member' };
        const before = { role: roleOf(u), access: accessOf(u) };
        if (before.role !== want.role || before.access !== want.access) {
          await svc.update(u.id, want);
          await logChange({
            action: 'reset', target_email: u.email, target_id: u.id,
            from_role: before.role, to_role: want.role,
            from_access: before.access, to_access: want.access,
          });
        }
      }
      return Response.json({ ok: true, action, anchor: anchorUser.email, users: await roster() }, { headers });
    }

    return Response.json({ error: `Unknown action '${action}'. Use: list | set | reset.` }, { status: 400, headers });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500, headers });
  }
});
