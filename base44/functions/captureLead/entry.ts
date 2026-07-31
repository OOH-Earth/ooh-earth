import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// captureLead — the ONLY client-facing path to create a FundingLead.
// Forces channel="lead" (a pledge / interest signal, never a confirmed
// payment) and sanitises all input. Confirmed donations/purchases are created
// solely by stripeWebhook via asServiceRole. Entity RLS locks direct client
// creates, so a client can no longer inject a fake channel="stripe" record.

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
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405, headers });
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const email = String(body?.email || '').trim().slice(0, 200);
    if (!isEmail(email)) return Response.json({ error: 'Valid email required.' }, { status: 400, headers });
    const name = String(body?.name || '').trim().slice(0, 200);
    const message = String(body?.message || '').trim().slice(0, 2000);

    // Pledge amount is captured but NEVER counts as raised (fieldStats sums
    // confirmed channels only). Clamp to a sane range; ignore anything weird.
    let amount = Number(body?.amount);
    if (!Number.isFinite(amount) || amount < 0) amount = 0;
    amount = Math.min(amount, 1000000);

    let caller = null;
    try { caller = await base44.auth.me(); } catch { caller = null; }

    const rec = { name, email, amount, channel: 'lead', message };
    if (caller?.id) rec.created_by_id = caller.id;

    await base44.asServiceRole.entities.FundingLead.create(rec);
    return Response.json({ ok: true }, { headers });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500, headers });
  }
});
