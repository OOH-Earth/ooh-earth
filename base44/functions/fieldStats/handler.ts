import { correlationHeaders, telemetryFor } from './telemetry.ts';

const CACHE_TTL_MS = 30_000;
let cached: { expiresAt: number; body: Record<string, unknown> } | null = null;
let inFlight: Promise<Record<string, unknown>> | null = null;

export function resetFieldStatsCache() {
  cached = null;
  inFlight = null;
}

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  now?: () => number;
};

async function listAll(entity: any, sort: string, pageSize = 500, hardCap = 50_000) {
  const out: any[] = [];
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

const AI_AGENTS = [
  'capture-vision',
  'objection-writer',
  'atlas-intel',
  'verify-assist',
  'treasury-watch',
  'automation-hub',
];

async function compute(base44: any) {
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
    let p = 10;
    if (r.status === 'verified') {
      p += 40;
      verified += 1;
    }
    if (r.image_url) p += 50;
    points += p;
    if (r.created_by_id) ops.add(r.created_by_id);
    const parts = String(r.address || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) cities.add(parts[parts.length - 1]);
  }
  const confirmed = (leads || []).filter((l) => l.channel === 'stripe' || l.channel === 'crypto');
  const raised = confirmed.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  return {
    reports: active.length,
    verified,
    operatives: ops.size,
    ai_agents: AI_AGENTS.length,
    leads: Math.max(0, active.length - verified),
    cities: cities.size,
    points,
    raised,
    donors: confirmed.length,
    digital_busts: (busts || []).filter((r) => r.status !== 'rejected').length,
  };
}

export async function handleFieldStats(
  _req: Request,
  { createClientFromRequest, now = () => Date.now() }: Dependencies,
) {
  const telemetry = telemetryFor(_req, { functionName: 'fieldStats', now });
  telemetry.emit('received');
  const current = now();
  if (cached && cached.expiresAt > current) {
    telemetry.finish('success', { operation: 'cache_hit' });
    return Response.json(cached.body, { headers: correlationHeaders(telemetry) });
  }
  const wasInFlight = Boolean(inFlight);
  if (!inFlight) {
    inFlight = (async () => {
      const result = await compute(createClientFromRequest(_req));
      cached = { body: result, expiresAt: now() + CACHE_TTL_MS };
      return result;
    })().finally(() => {
      inFlight = null;
    });
  }
  try {
    const result = await inFlight;
    telemetry.finish('success', { operation: wasInFlight ? 'coalesced' : 'compute' });
    return Response.json(result, { headers: correlationHeaders(telemetry) });
  } catch (error) {
    telemetry.finish('failed', { error_code: 'DEPENDENCY_FAILURE' });
    console.error('fieldStats failed:', error instanceof Error ? error.name : 'unknown');
    return Response.json(
      { error: 'Stats unavailable' },
      { status: 500, headers: correlationHeaders(telemetry) },
    );
  }
}
