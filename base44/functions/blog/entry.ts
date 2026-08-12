import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// blog — the only read/write path for BlogPost. Entity RLS is admin-only;
// this function serves posts with audience gating:
//   audience "public" → anyone (published only)
//   audience "agency" → agency members + admins only (published only)
//   drafts            → admins only
// Actions (POST JSON):
//   { action: "list", scope: "public" | "agency", category?, includeDrafts? }
//   { action: "get", slug: "..." }
//   { action: "save", post: {...} }   // admin only

const agencyOf = (u) => !!u && !!(u.agency ?? u.data?.agency);
const roleOf = (u) => (u && (u.role ?? u.data?.role)) || 'user';
const accessOf = (u) => (u && (u.access ?? u.data?.access)) || 'member';
const isAdmin = (u) => roleOf(u) === 'admin' || accessOf(u) === 'admin';
const isAgency = (u) => isAdmin(u) || agencyOf(u);

const CARD_FIELDS = [
  'id',
  'title',
  'slug',
  'excerpt',
  'category',
  'audience',
  'status',
  'author',
  'cover_image',
  'network',
  'cta',
  'pinned',
  'published_date',
];
const pick = (o, keys) => keys.reduce((a, k) => (o[k] !== undefined ? ((a[k] = o[k]), a) : a), {});

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

const sortPosts = (a, b) =>
  Number(b.pinned) - Number(a.pinned) ||
  String(b.published_date || '').localeCompare(String(a.published_date || ''));

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405, headers });

  try {
    const base44 = createClientFromRequest(req);
    let caller = null;
    try {
      caller = await base44.auth.me();
    } catch {
      caller = null;
    }

    const svc = base44.asServiceRole.entities.BlogPost;
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'list').toLowerCase();

    if (action === 'list') {
      const scope = String(body?.scope || 'public').toLowerCase();
      const wantDrafts = !!body?.includeDrafts && isAdmin(caller);
      if (scope === 'agency' && !isAgency(caller)) {
        return Response.json(
          { error: 'Forbidden — agency access required.' },
          { status: 403, headers },
        );
      }
      const audience = scope === 'agency' ? 'agency' : 'public';
      let posts = (await svc.filter({ audience }, '-published_date', 300)) || [];
      if (!wantDrafts) posts = posts.filter((p) => p.status === 'published');
      if (body?.category) posts = posts.filter((p) => p.category === body.category);
      posts = posts.sort(sortPosts).map((p) => pick(p, CARD_FIELDS));
      return Response.json({ ok: true, scope, count: posts.length, posts }, { headers });
    }

    if (action === 'get') {
      const slug = String(body?.slug || '');
      if (!slug) return Response.json({ error: 'Missing slug.' }, { status: 400, headers });
      const found = await svc.filter({ slug }, '-published_date', 1);
      const post = (found || [])[0];
      if (!post) return Response.json({ error: 'Not found.' }, { status: 404, headers });
      if (post.audience === 'agency' && !isAgency(caller)) {
        return Response.json(
          { error: 'Forbidden — agency access required.' },
          { status: 403, headers },
        );
      }
      if (post.status !== 'published' && !isAdmin(caller)) {
        return Response.json({ error: 'Not found.' }, { status: 404, headers });
      }
      return Response.json({ ok: true, post }, { headers });
    }

    if (action === 'save') {
      if (!isAdmin(caller))
        return Response.json({ error: 'Forbidden — admin only.' }, { status: 403, headers });
      const p = body?.post || {};
      if (!p.title) return Response.json({ error: 'title required.' }, { status: 400, headers });
      const saved = p.id ? await svc.update(p.id, p) : await svc.create(p);
      return Response.json({ ok: true, post: saved }, { headers });
    }

    return Response.json(
      { error: `Unknown action '${action}'. Use: list | get | save.` },
      { status: 400, headers },
    );
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500, headers });
  }
});
