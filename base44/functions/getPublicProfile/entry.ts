import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// getPublicProfile — safe public projection of a member's Founding Profile,
// looked up by handle. This is the ONLY path a visitor (or the owner, when
// checking handle availability) has to read another member's identity —
// there is no general client-side User.filter() exposed to non-admins, by
// design. This function must never return id/email/role/access/agency, and
// must never expose pending/rejected Location or FieldCheck rows.
//
// Two modes:
//   view  (default) — full public profile + public contribution counts.
//   check            — "is this handle taken, and is it mine?" only, used
//                       by the edit form before save. Compares against the
//                       CALLER's own identity (not service-role), so it can
//                       never be used to enumerate other users' ids.

const ALLOWED_ORIGINS = new Set([
  'https://oohearth.app',
  'https://www.oohearth.app',
  'https://ooh.earth',
  'http://localhost:5173',
  'http://localhost:3000',
]);

function cors(origin) {
  const o = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://oohearth.app';
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

async function countVerified(entity, userId) {
  try {
    const rows = await entity.filter(
      { created_by_id: userId, status: 'verified' },
      '-created_date',
      500,
    );
    return Array.isArray(rows) ? rows.length : 0;
  } catch {
    return 0;
  }
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405, headers });

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const mode = body?.mode === 'check' ? 'check' : 'view';
    const handle = String(body?.handle || '')
      .trim()
      .replace(/^@/, '');

    if (!handle) return Response.json({ error: 'handle required' }, { status: 400, headers });

    const matches = await base44.asServiceRole.entities.User.filter({ handle });
    const match = matches?.[0] || null;

    if (mode === 'check') {
      let caller = null;
      try {
        caller = await base44.auth.me();
      } catch {
        caller = null;
      }
      const taken = !!match;
      const mine = !!(match && caller && match.id === caller.id);
      return Response.json({ taken, mine }, { headers });
    }

    // A handle that exists but isn't explicitly public responds identically
    // to one that doesn't exist at all -- profile_public is the ONLY gate,
    // checked here regardless of who's asking (including the owner: this
    // endpoint is the PUBLIC view, not a preview -- Account.jsx already has
    // the owner's own data from auth.me() and doesn't need this to show it).
    if (!match || !match.profile_public) return Response.json({ found: false }, { headers });

    const [verifiedReports, verifiedRechecks] = await Promise.all([
      countVerified(base44.asServiceRole.entities.Location, match.id),
      countVerified(base44.asServiceRole.entities.FieldCheck, match.id),
    ]);

    return Response.json(
      {
        found: true,
        profile: {
          handle: match.handle || '',
          full_name: match.full_name || '',
          avatar_url: match.avatar_url || '',
          bio: match.bio || '',
          region: match.region || '',
          focus_areas: Array.isArray(match.focus_areas) ? match.focus_areas : [],
          founding_member: !!match.founding_member,
          member_since: match.created_date || null,
        },
        contributions: {
          verified_reports: verifiedReports,
          verified_rechecks: verifiedRechecks,
        },
      },
      { headers },
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers });
  }
});
