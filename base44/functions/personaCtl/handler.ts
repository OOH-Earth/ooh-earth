import { accessOf, agencyOf, isAppAdmin, roleOf } from '../_shared/auth.ts';

const ROLES = new Set(['admin', 'user']);
const ACCESS = new Set(['admin', 'moderator', 'operative', 'member']);
const ALLOWED_ORIGINS = new Set([
  'https://oohearth.app',
  'https://www.oohearth.app',
  'https://ooh.earth',
  'http://localhost:5173',
  'http://localhost:3000',
]);

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  getEnv?: (name: string) => string | undefined;
};

function cors(origin: string | null) {
  const value = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://oohearth.app';
  return {
    'Access-Control-Allow-Origin': value,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Persona-Key',
    Vary: 'Origin',
  };
}

async function constantTimeEqual(left: string, right: string) {
  if (!left || !right) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(left)),
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(right)),
  ]);
  const aa = new Uint8Array(a);
  const bb = new Uint8Array(b);
  let difference = 0;
  for (let index = 0; index < aa.length; index++) difference |= aa[index] ^ bb[index];
  return difference === 0;
}

export async function handlePersonaCtl(
  req: Request,
  { createClientFromRequest, getEnv = (name) => Deno.env.get(name) }: Dependencies,
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
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return Response.json({ error: 'Invalid request body' }, { status: 400, headers });
  const action =
    body.action === undefined
      ? 'list'
      : typeof body.action === 'string'
        ? body.action.toLowerCase()
        : '';
  if (!['list', 'set', 'reset'].includes(action))
    return Response.json({ error: 'Unknown action.' }, { status: 400, headers });
  const base44 = createClientFromRequest(req);
  let caller = null;
  try {
    caller = await base44.auth.me();
  } catch {
    caller = null;
  }
  const suppliedKey =
    req.headers.get('x-persona-key') || (typeof body.key === 'string' ? body.key : '');
  const expectedKey = getEnv('PERSONA_KEY') || '';
  const keyOk = await constantTimeEqual(suppliedKey, expectedKey);
  if (!keyOk && !isAppAdmin(caller))
    return Response.json({ error: 'Unauthorized' }, { status: 403, headers });
  const via = keyOk && !isAppAdmin(caller) ? 'key' : 'panel';
  const users = base44.asServiceRole.entities.User;
  const roster = async () =>
    ((await users.list('-created_date', 500)) || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: roleOf(user),
      access: accessOf(user),
      agency: agencyOf(user),
    }));
  const audit = async (record: any) => {
    try {
      await base44.asServiceRole.entities.AccessLog.create({
        via,
        actor_email: caller?.email || (keyOk ? 'system:key' : ''),
        actor_id: caller?.id || '',
        ...record,
      });
    } catch (error) {
      console.error('personaCtl audit failed:', error instanceof Error ? error.name : 'unknown');
    }
  };
  try {
    if (action === 'list')
      return Response.json({ ok: true, action, users: await roster() }, { headers });
    if (action === 'set') {
      const patch: any = {};
      if (body.role !== undefined) {
        if (typeof body.role !== 'string' || !ROLES.has(body.role.toLowerCase()))
          return Response.json({ error: 'Invalid role.' }, { status: 400, headers });
        patch.role = body.role.toLowerCase();
      }
      if (body.access !== undefined) {
        if (typeof body.access !== 'string' || !ACCESS.has(body.access.toLowerCase()))
          return Response.json({ error: 'Invalid access.' }, { status: 400, headers });
        patch.access = body.access.toLowerCase();
      }
      if (body.agency !== undefined) {
        if (typeof body.agency !== 'boolean')
          return Response.json({ error: 'agency must be boolean.' }, { status: 400, headers });
        patch.agency = body.agency;
      }
      if (!Object.keys(patch).length)
        return Response.json({ error: 'Nothing to set.' }, { status: 400, headers });
      let target = null;
      if (body.id !== undefined) {
        if (typeof body.id !== 'string' || !body.id)
          return Response.json({ error: 'Invalid target id.' }, { status: 400, headers });
        target = await users.get(body.id).catch(() => null);
      } else if (body.email !== undefined) {
        if (typeof body.email !== 'string' || !body.email.trim())
          return Response.json({ error: 'Invalid target email.' }, { status: 400, headers });
        target = (await users.filter({ email: body.email.trim() }, '-created_date', 1))[0] || null;
      }
      if (!target)
        return Response.json({ error: 'Target user not found.' }, { status: 404, headers });
      if (
        patch.role === 'user' &&
        roleOf(target) === 'admin' &&
        ((await users.list('-created_date', 500)) || []).filter(
          (user: any) => roleOf(user) === 'admin',
        ).length <= 1
      )
        return Response.json(
          { error: 'Cannot remove the last platform admin.' },
          { status: 409, headers },
        );
      const before = { role: roleOf(target), access: accessOf(target) };
      await users.update(target.id, patch);
      const after = { ...before, ...patch };
      await audit({
        action: 'set',
        target_email: target.email,
        target_id: target.id,
        from_role: before.role,
        to_role: after.role,
        from_access: before.access,
        to_access: after.access,
      });
      return Response.json(
        {
          ok: true,
          action,
          changed: { id: target.id, email: target.email, from: before, to: after },
          users: await roster(),
        },
        { headers },
      );
    }
    if (typeof body.anchor_email !== 'string' || !body.anchor_email.trim())
      return Response.json({ error: 'reset requires anchor_email.' }, { status: 400, headers });
    const all = (await users.list('-created_date', 500)) || [];
    const anchor = all.find(
      (user: any) =>
        String(user.email || '').toLowerCase() === body.anchor_email.trim().toLowerCase(),
    );
    if (!anchor)
      return Response.json({ error: 'Anchor user not found.' }, { status: 404, headers });
    for (const user of all) {
      const wanted =
        user.id === anchor.id
          ? { role: 'admin', access: 'admin' }
          : { role: 'user', access: 'member' };
      if (roleOf(user) !== wanted.role || accessOf(user) !== wanted.access) {
        await users.update(user.id, wanted);
        await audit({
          action: 'reset',
          target_email: user.email,
          target_id: user.id,
          from_role: roleOf(user),
          to_role: wanted.role,
          from_access: accessOf(user),
          to_access: wanted.access,
        });
      }
    }
    return Response.json(
      { ok: true, action, anchor: anchor.email, users: await roster() },
      { headers },
    );
  } catch (error) {
    console.error('personaCtl failed:', error instanceof Error ? error.name : 'unknown');
    return Response.json({ error: 'Persona operation unavailable' }, { status: 500, headers });
  }
}
