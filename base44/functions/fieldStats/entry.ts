import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleFieldStats } from './handler.ts';

Deno.serve((req) => handleFieldStats(req, { createClientFromRequest }));

/*

// Public, PII-free aggregate field stats for the orbital HUD.
// Returns counts/totals only — never exposes donor or operative records.

// R-05 mitigation: this function pages through every Location/FundingLead/
// DigitalBust record on every call, so repeated hits (legitimate concurrent
// pageviews or abuse) each redo the full scan. A shared 30s cache (reusing
// IntelCache, the same entity/pattern cachedIntel already uses) caps that
// work at once per window regardless of caller count -- fail-open on any
// cache read/write error, since a broken cache must never block a response.
const CACHE_KEY = 'fieldStats';
const CACHE_WINDOW_MS = 30_000;

async function readCache(base44, periodKey) {
  try {
    const hits = await base44.asServiceRole.entities.IntelCache.filter({
      cache_key: CACHE_KEY,
      period_key: periodKey,
    });
    if (hits && hits.length && hits[0].payload) return JSON.parse(hits[0].payload);
  } catch {
    /* cache read failure must never block a response */
  }
  return null;
}

async function writeCache(base44, periodKey, payload) {
  try {
    await base44.asServiceRole.entities.IntelCache.create({
      cache_key: CACHE_KEY,
      period_key: periodKey,
      payload: JSON.stringify(payload),
    });
  } catch {
    /* cache write failure must never block a response */
  }
}

// Page through an entity so counts aren't silently capped. The previous
// version fetched a flat 500, which undercounted once the London import
// pushed Location past 700 records.
async function listAll(entity, sort, pageSize = 500, hardCap = 50000) {
  const out = [];
  let skip = 0;
  while (out.length < hardCap) {
    const page = await entity.list(sort, pageSize, skip);
    if (!page || page.length === 0) break;
    out.push(...page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return out;
}

// Active automated field agents — real platform subsystems that operate
// autonomously alongside human operatives: vision capture, objection drafting,
// atlas intel, verification assist, treasury watch, and the automation hub.
const AI_AGENTS = [
  'capture-vision',
  'objection-writer',
  'atlas-intel',
  'verify-assist',
  'treasury-watch',
  'automation-hub',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const periodKey = String(Math.floor(Date.now() / CACHE_WINDOW_MS));
    const cached = await readCache(base44, periodKey);
    if (cached) return Response.json(cached);

    const [locs, leads, busts] = await Promise.all([
      listAll(base44.asServiceRole.entities.Location, '-created_date'),
      listAll(base44.asServiceRole.entities.FundingLead, '-created_date'),
      listAll(base44.asServiceRole.entities.DigitalBust, '-created_date'),
    ]);

    const active = (locs || []).filter((r) => r.status !== 'rejected');
    let points = 0;
    let verified = 0;
    const ops = new Set();
    const cities = new Set();
    for (const r of active) {
      let p = 10; // base credit per filed report
      if (r.status === 'verified') {
        p += 40;
        verified += 1;
      }
      if (r.image_url) p += 50; // photo evidence bonus
      points += p;
      if (r.created_by_id) ops.add(r.created_by_id);
      const parts = String(r.address || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length) cities.add(parts[parts.length - 1]);
    }
    // Public "raised"/"donors" count CONFIRMED donations only (stripe/crypto).
    // Lead-channel pledges are captured but never counted as raised, so neither
    // pledges nor any fabricated record can inflate the public trust metric.
    const confirmed = (leads || []).filter((l) => l.channel === 'stripe' || l.channel === 'crypto');
    const raised = confirmed.reduce((s, l) => s + (Number(l.amount) || 0), 0);
    const digitalBusts = (busts || []).filter((r) => r.status !== 'rejected').length;

    const payload = {
      reports: active.length,
      verified,
      operatives: ops.size,
      ai_agents: AI_AGENTS.length,
      leads: Math.max(0, active.length - verified),
      cities: cities.size,
      points,
      raised,
      donors: confirmed.length,
      digital_busts: digitalBusts,
    };
    await writeCache(base44, periodKey, payload);
    return Response.json(payload);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
*/
