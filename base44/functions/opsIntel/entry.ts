import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// opsIntel — serves the Architecture Ops Portal's sensitive metadata
// (internal secret names/purposes + the security risk register) at
// runtime, behind clearance, so none of it ships in the client bundle.
//   risks       : any agency member (Risk Register is moderator-visible)
//   secrets     : admin only (Security Center is admin-only)
//   fn_secrets  : admin only (per-function secret mapping)
// This is read-only metadata about which secrets exist — never values.
// Values are only ever read server-side via Deno.env.get().

const accessOf = (u) => (u && (u.access ?? u.data?.access)) || 'member';
const roleOf = (u) => (u && (u.role ?? u.data?.role)) || 'user';
const agencyOf = (u) => !!(u && (u.agency ?? u.data?.agency));
const IS_ADMIN = (u) => !!u && (roleOf(u) === 'admin' || accessOf(u) === 'admin');
const IS_AGENCY = (u) => !!u && (IS_ADMIN(u) || agencyOf(u));

// ── sensitive metadata (kept server-side) ─────────────────────
const SECRETS = [
  ['PERSONA_KEY', 'personaCtl', 'Alternate admin auth for the clearance controller.'],
  ['N8N_WEBHOOK_URL', 'n8nPing', 'Target webhook URL for the Base44 → n8n bridge.'],
  ['BASE44_APP_ID', 'n8nPing, checkout fns', 'App id on outbound payloads / Stripe metadata.'],
  ['INVESTOR_TOKEN_SECRET', 'investorAccess', 'HMAC secret for signing investor session tokens.'],
  ['INVESTOR_ACCESS_CODE', 'investorAccess', 'Shared access code gating the investor area.'],
  ['STRIPE_SECRET_KEY', 'checkout fns', 'Stripe API key for Checkout sessions.'],
  ['STRIPE_WEBHOOK_SECRET', 'stripeWebhook', 'Verifies the Stripe webhook signature.'],
];

const FN_SECRETS = {
  createDonationCheckout: 'STRIPE_SECRET_KEY, BASE44_APP_ID',
  createProductCheckout: 'STRIPE_SECRET_KEY, BASE44_APP_ID',
  investorAccess: 'INVESTOR_ACCESS_CODE, INVESTOR_TOKEN_SECRET',
  n8nPing: 'N8N_WEBHOOK_URL — test action only',
  stripeWebhook: 'STRIPE_WEBHOOK_SECRET',
  personaCtl: 'admin OR PERSONA_KEY header',
};

const RISKS = [
  ['R-01', 'Polygon vs Base chain mismatch in CryptoDonations.jsx; wallets pending.', 'high', 'Treasury / Web3', 'Reconcile target chain; resolve pending wallets.'],
  ['R-02', 'Naming drift: $OUTOFHELL (zoraConfig) vs hardcoded $OOHEX.', 'med', 'Coin Registry', 'Make zoraConfig the single source; strip hardcoded strings.'],
  ['R-03', 'No release-tagging pipeline. CI build-verify now runs via GitHub Actions.', 'med', 'Infra / Deploy', 'Ship promoteBackup for release tags + CHANGELOG; CI build-verify already live.'],
  ['R-04', 'No incident-tracking system.', 'med', 'Security', 'Ship incidentLog; retire the manual SECURITY.md process.'],
  ['R-05', 'No rate limiting on public read functions.', 'med', 'Security', 'Per-IP throttle on fieldStats / cryptoWatch / fetchMapLocations.'],
  ['R-06', 'No secrets rotation cadence or scanning.', 'med', 'Security', 'Define rotation; add secret-scanning; ship secretsAudit.'],
  ['R-07', 'No dependency scanning / SBOM.', 'low', 'Security', 'Add SCA to CI; publish SBOM.'],
  ['R-08', 'pump.fun community coin is a placeholder.', 'low', 'Coin Registry', 'Swap placeholder before any launch-ready treatment.'],
];

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

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405, headers });

  try {
    const base44 = createClientFromRequest(req);
    let caller = null;
    try { caller = await base44.auth.me(); } catch { caller = null; }

    if (!IS_AGENCY(caller)) {
      return Response.json({ error: 'Forbidden — agency clearance required.' }, { status: 403, headers });
    }

    const admin = IS_ADMIN(caller);
    return Response.json({
      ok: true,
      risks: RISKS,                       // moderator-visible (all agency)
      secrets: admin ? SECRETS : null,    // admin only
      fn_secrets: admin ? FN_SECRETS : null,
    }, { headers });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500, headers });
  }
});
