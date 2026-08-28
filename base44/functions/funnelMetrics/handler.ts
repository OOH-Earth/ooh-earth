const EVENTS = new Set([
  'qualified_visit',
  'map_engaged',
  'location_viewed',
  'report_started',
  'report_submitted',
  'support_viewed',
  'plans_viewed',
  'store_viewed',
  'professional_intent',
  'checkout_started',
]);
const SOURCES = new Set(['github', 'owned', 'search', 'community', 'research', 'share', 'direct', 'synthetic_test']);
const MEDIUMS = new Set(['referral', 'content', 'organic', 'social', 'verification', 'direct']);
const CAMPAIGNS = new Set(['transit_evidence', 'github_readme', 'aggregate_roundtrip', 'none']);
const BODY_KEYS = new Set([
  'action',
  'event_name',
  'source',
  'medium',
  'campaign',
  'landing_path',
  'from_day',
  'to_day',
]);
const MAX_BODY_BYTES = 4096;
const MAX_INGEST_PER_MINUTE = 120;
const RETENTION_DAYS = 90;
let recentIngests: number[] = [];
let lastPurgeAt = 0;

const ALLOWED_ORIGINS = new Set([
  'https://oohearth.app',
  'https://www.oohearth.app',
  'https://ooh.earth',
  'http://localhost:5173',
  'http://localhost:3000',
]);

function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://oohearth.app',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

function isAdmin(user: any) {
  const role = user?.role ?? user?.data?.role ?? 'user';
  const access = user?.access ?? user?.data?.access ?? 'member';
  return !!user && (role === 'admin' || access === 'admin');
}

function bounded(value: unknown, max: number) {
  return typeof value === 'string' && value.length > 0 && value.length <= max ? value : null;
}

function safeDay(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function validPath(value: unknown) {
  if (value === undefined) return true;
  const path = bounded(value, 160);
  return !!path && /^\/(?:blog(?:\/[-A-Za-z0-9_]+)?|map|report|location\/[A-Za-z0-9_-]+|support|plans|store(?:\/[-A-Za-z0-9_]+)?)$/.test(path);
}

function consumeRateLimit(now = Date.now()) {
  recentIngests = recentIngests.filter((at) => at > now - 60_000);
  if (recentIngests.length >= MAX_INGEST_PER_MINUTE) return false;
  recentIngests.push(now);
  return true;
}

async function purgeExpired(entity: any, now = new Date()) {
  if (Date.now() - lastPurgeAt < 3_600_000) return;
  lastPurgeAt = Date.now();
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 86400000).toISOString().slice(0, 10);
  const expired = (await entity.filter({ day: { $lt: cutoff } }, 'day', 500)) || [];
  await Promise.all(expired.map((row: any) => entity.delete(row.id)));
}

function groupRows(rows: any[]) {
  const groups = new Map<string, any>();
  for (const row of rows) {
    const key = `${row.day}|${row.source}|${row.medium}|${row.campaign}`;
    const group = groups.get(key) || {
      date: row.day,
      source: row.source,
      medium: row.medium,
      campaign: row.campaign,
      raw_event_count: 0,
      synthetic_event_count: 0,
    };
    const count = Math.max(0, Number(row.count) || 0);
    const synthetic = Math.min(count, Math.max(0, Number(row.synthetic_count) || 0));
    const qualified = count - synthetic;
    group.raw_event_count += count;
    group.synthetic_event_count += synthetic;
    const field = {
      qualified_visit: 'qualified_visits',
      map_engaged: 'map_engagements',
      location_viewed: 'location_views',
      report_started: 'report_starts',
      report_submitted: 'report_submissions',
      support_viewed: 'support_views',
      professional_intent: 'professional_intent',
      checkout_started: 'checkout_starts',
    }[row.event_name];
    if (field) group[field] = (group[field] || 0) + qualified;
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => ({
    date: group.date,
    source: group.source,
    medium: group.medium,
    campaign: group.campaign,
    raw_event_count: group.raw_event_count,
    synthetic_event_count: group.synthetic_event_count,
    qualified_visits: group.qualified_visits || 0,
    map_engagements: group.map_engagements || 0,
    location_views: group.location_views || 0,
    report_starts: group.report_starts || 0,
    report_submissions: group.report_submissions || 0,
    support_views: group.support_views || 0,
    professional_intent: group.professional_intent || 0,
    checkout_starts: group.checkout_starts || 0,
  }));
}

export async function handleFunnelMetrics(
  req: Request,
  { createClientFromRequest, now = () => new Date() }: { createClientFromRequest: (req: Request) => any; now?: () => Date },
) {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405, headers });
  if (Number(req.headers.get('content-length') || 0) > MAX_BODY_BYTES)
    return Response.json({ error: 'Payload too large.' }, { status: 413, headers });

  try {
    const bodyText = await req.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES)
      return Response.json({ error: 'Payload too large.' }, { status: 413, headers });
    const body = JSON.parse(bodyText || '{}');
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return Response.json({ error: 'Invalid payload.' }, { status: 400, headers });
    if (Object.keys(body).some((key) => !BODY_KEYS.has(key)))
      return Response.json({ error: 'Unexpected fields.' }, { status: 400, headers });

    const action = String(body.action || 'ingest');
    const base44 = createClientFromRequest(req);
    const entity = base44.asServiceRole.entities.FunnelAggregate;
    const current = now();

    if (action === 'ingest') {
      if (!consumeRateLimit()) return Response.json({ error: 'Rate limit exceeded.' }, { status: 429, headers });
      const event = bounded(body.event_name, 40);
      const source = bounded(body.source, 32);
      const medium = bounded(body.medium, 32);
      const campaign = bounded(body.campaign, 64);
      if (!event || !EVENTS.has(event) || !source || !SOURCES.has(source) || !medium || !MEDIUMS.has(medium) || !campaign || !CAMPAIGNS.has(campaign) || !validPath(body.landing_path))
        return Response.json({ error: 'Invalid measurement event.' }, { status: 400, headers });
      if (event === 'payment_confirmed') return Response.json({ error: 'Payment events are provider-authoritative.' }, { status: 400, headers });
      const synthetic = source === 'synthetic_test' && medium === 'verification' && campaign === 'aggregate_roundtrip';
      if (source === 'synthetic_test' && !synthetic) return Response.json({ error: 'Invalid synthetic classification.' }, { status: 400, headers });
      await purgeExpired(entity, current);
      const day = safeDay(current);
      const existing = (await entity.filter({ day, source, medium, campaign, event_name: event }, '-updated_date', 1)) || [];
      if (existing[0]) await entity.update(existing[0].id, { $inc: { count: 1, synthetic_count: synthetic ? 1 : 0 } });
      else await entity.create({ day, source, medium, campaign, event_name: event, count: 1, synthetic_count: synthetic ? 1 : 0 });
      return Response.json({ ok: true }, { headers });
    }

    if (action === 'read') {
      let caller = null;
      try { caller = await base44.auth.me(); } catch { caller = null; }
      if (!isAdmin(caller)) return Response.json({ error: 'Forbidden.' }, { status: 403, headers });
      const from = body.from_day ? bounded(body.from_day, 10) : null;
      const to = body.to_day ? bounded(body.to_day, 10) : null;
      const today = safeDay(current);
      const cutoff = new Date(current.getTime() - RETENTION_DAYS * 86400000).toISOString().slice(0, 10);
      if (
        (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) ||
        (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) ||
        (from && from < cutoff) ||
        (to && to > today)
      )
        return Response.json({ error: 'Invalid date range.' }, { status: 400, headers });
      const query: any = {};
      if (from || to) query.day = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
      if (body.source && SOURCES.has(body.source)) query.source = body.source;
      if (body.campaign && CAMPAIGNS.has(body.campaign)) query.campaign = body.campaign;
      const rows = (await entity.filter(query, 'day', 500)) || [];
      return Response.json({ ok: true, retention_days: RETENTION_DAYS, records: groupRows(rows) }, { headers });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400, headers });
  } catch {
    return Response.json({ error: 'Measurement unavailable.' }, { status: 503, headers });
  }
}
