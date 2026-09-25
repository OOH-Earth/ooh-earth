const OWNED = [
  'Location',
  'DigitalBust',
  'FieldCheck',
  'LocationPhoto',
  'QuestCompletion',
  'LeadClaim',
];
const RETAINED_BY_POLICY = [
  'Mint (on-chain/public history)',
  'FundingLead (financial/audit history)',
  'Purchase (entitlement/payment history)',
  'Subscription (billing history)',
];
const PAGE_SIZE = 500;
const ALLOWED_ORIGINS = new Set([
  'https://oohearth.app',
  'https://www.oohearth.app',
  'https://ooh.earth',
  'http://localhost:5173',
  'http://localhost:3000',
]);

type Dependencies = { createClientFromRequest: (req: Request) => any };

function cors(origin: string | null) {
  const value = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://oohearth.app';
  return {
    'Access-Control-Allow-Origin': value,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

async function purgeOwned(svc: any, entity: string, userId: string) {
  const result = { deleted: 0, failed: 0, capped: false };
  try {
    const rows = await svc.entities[entity].filter(
      { created_by_id: userId },
      '-created_date',
      PAGE_SIZE,
    );
    result.capped = (rows || []).length >= PAGE_SIZE;
    for (const row of rows || []) {
      try {
        await svc.entities[entity].delete(row.id);
        result.deleted++;
      } catch {
        result.failed++;
      }
    }
  } catch {
    result.failed++;
  }
  return result;
}

export async function handleDeleteMyAccount(
  req: Request,
  { createClientFromRequest }: Dependencies,
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
  if (!body || body.confirm !== true)
    return Response.json(
      { error: 'Missing confirmation. Send { confirm: true }.' },
      { status: 400, headers },
    );
  const base44 = createClientFromRequest(req);
  let caller = null;
  try {
    caller = await base44.auth.me();
  } catch {
    caller = null;
  }
  if (!caller?.id) return Response.json({ error: 'Not authenticated.' }, { status: 401, headers });
  try {
    const svc = base44.asServiceRole;
    const purged: Record<string, { deleted: number; failed: number; capped: boolean }> = {};
    for (const entity of OWNED) purged[entity] = await purgeOwned(svc, entity, caller.id);
    let userRemoved = false;
    let piiScrubbed = false;
    try {
      await svc.entities.User.delete(caller.id);
      userRemoved = true;
    } catch {
      try {
        await svc.entities.User.update(caller.id, {
          full_name: 'Deleted user',
          handle: null,
          bio: null,
          avatar_url: null,
          prefs: null,
        });
        piiScrubbed = true;
      } catch {
        // Report blocked instead of claiming completion.
      }
    }
    const blocked = Object.values(purged).some((result) => result.failed > 0 || result.capped);
    const identityComplete = userRemoved || piiScrubbed;
    const status = !identityComplete ? 'blocked' : blocked ? 'partial' : 'completed';
    return Response.json(
      {
        ok: status === 'completed',
        status,
        user_removed: userRemoved,
        pii_scrubbed: piiScrubbed,
        purged,
        retained_by_policy: RETAINED_BY_POLICY,
      },
      { status: status === 'completed' ? 200 : 207, headers },
    );
  } catch (error) {
    console.error('deleteMyAccount failed:', error instanceof Error ? error.name : 'unknown');
    return Response.json(
      { error: 'Account deletion unavailable', status: 'blocked' },
      { status: 500, headers },
    );
  }
}
