import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// claimQuest — server-authoritative quest claim. XP is looked up from a
// server-side table (never trusted from the client), the period key is
// computed server-side, and a duplicate claim for the same user + quest +
// period is rejected. Entity RLS locks direct client creates of
// QuestCompletion, so a client can no longer mint arbitrary xp_awarded.
//
// NOTE: this closes the arbitrary-XP-inflation vuln (bounded to real rewards,
// one claim per period). Verifying the user actually met the quest target
// server-side is a further hardening step (would recompute the metric here).

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

// server-authoritative quest table — mirrors QUESTS reward_xp / type
const QUESTS = {
  daily_report: { type: 'daily', reward_xp: 50 },
  daily_photo: { type: 'daily', reward_xp: 50 },
  weekly_reports: { type: 'weekly', reward_xp: 200 },
  weekly_busts: { type: 'weekly', reward_xp: 150 },
  weekly_mint: { type: 'weekly', reward_xp: 300 },
};

function periodKey(type) {
  const now = new Date();
  if (type === 'daily') return now.toISOString().slice(0, 10);
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = (now.getTime() - start.getTime()) / 86400000;
  const week = Math.ceil((diff + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405, headers });
  try {
    const base44 = createClientFromRequest(req);
    let caller = null;
    try { caller = await base44.auth.me(); } catch { caller = null; }
    if (!caller?.id) return Response.json({ error: 'Authentication required.' }, { status: 401, headers });

    const body = await req.json().catch(() => ({}));
    const questId = String(body?.quest_id || body?.questId || '');
    const quest = QUESTS[questId];
    if (!quest) return Response.json({ error: 'Unknown quest.' }, { status: 400, headers });

    const period = periodKey(quest.type);

    // dedupe — one claim per user + quest + period
    const existing = await base44.asServiceRole.entities.QuestCompletion.filter(
      { quest_id: questId, period_key: period, created_by_id: caller.id }, '-created_date', 1
    );
    if (existing && existing.length) {
      return Response.json({ ok: true, already: true }, { headers });
    }

    await base44.asServiceRole.entities.QuestCompletion.create({
      quest_id: questId,
      period_key: period,
      xp_awarded: quest.reward_xp, // server-authoritative — client value ignored
      created_by_id: caller.id,
    });
    return Response.json({ ok: true, xp_awarded: quest.reward_xp, period_key: period }, { headers });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500, headers });
  }
});
