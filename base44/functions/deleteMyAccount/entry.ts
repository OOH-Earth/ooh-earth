import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// deleteMyAccount — self-service account + data erasure.
// The caller can ONLY delete themselves: the target id always comes from
// auth.me(), never from the request body, so there's no way to delete
// another user. Requires { confirm: true }.
//
// Steps:
//   1. Delete records the caller owns (Location, DigitalBust, QuestCompletion,
//      LeadClaim) via created_by_id — each entity best-effort so one missing
//      entity can't abort the rest.
//   2. Remove the User record. If the platform blocks hard-deleting the auth
//      user from a function, fall back to scrubbing PII (name/handle/bio/
//      avatar/prefs) so nothing identifying remains.
// The client signs the user out immediately after this returns.

const OWNED = ['Location', 'DigitalBust', 'QuestCompletion', 'LeadClaim'];

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

async function purgeOwned(svc, entity, userId) {
  let deleted = 0;
  try {
    const rows = await svc.entities[entity].filter({ created_by_id: userId }, '-created_date', 500);
    for (const r of (rows || [])) {
      try { await svc.entities[entity].delete(r.id); deleted++; } catch { /* skip individual failures */ }
    }
  } catch { /* entity absent or no ownership field — skip */ }
  return deleted;
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405, headers });

  try {
    const base44 = createClientFromRequest(req);

    let caller = null;
    try { caller = await base44.auth.me(); } catch { caller = null; }
    if (!caller?.id) return Response.json({ error: 'Not authenticated.' }, { status: 401, headers });

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== true) {
      return Response.json({ error: 'Missing confirmation. Send { confirm: true }.' }, { status: 400, headers });
    }

    const svc = base44.asServiceRole;
    const uid = caller.id;

    // 1 — delete owned records
    const purged = {};
    for (const entity of OWNED) purged[entity] = await purgeOwned(svc, entity, uid);

    // 2 — remove the user, or scrub PII if hard-delete is blocked
    let userRemoved = false;
    let scrubbed = false;
    try {
      await svc.entities.User.delete(uid);
      userRemoved = true;
    } catch {
      try {
        await svc.entities.User.update(uid, {
          full_name: 'Deleted user',
          handle: null, bio: null, avatar_url: null, prefs: null,
        });
        scrubbed = true;
      } catch { /* nothing more we can do server-side */ }
    }

    return Response.json({
      ok: true,
      user_removed: userRemoved,
      pii_scrubbed: scrubbed,
      purged,
      note: userRemoved
        ? 'Account and owned records removed.'
        : 'Owned records removed and profile scrubbed. Contact Base44 support to fully remove the auth record.',
    }, { headers });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500, headers });
  }
});
