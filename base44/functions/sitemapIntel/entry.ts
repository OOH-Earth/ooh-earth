import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// sitemapIntel — admin-gated source for the /sitemap internal sections:
// the access ladder, the system architecture, and the loose-ends checklist.
// This data used to be imported as static modules and shipped in the client
// bundle (readable by anyone who downloaded the JS). It now lives here and is
// returned ONLY to admins, failing closed for everyone else so nothing
// sensitive reaches a non-admin browser.

// --- access & clearance ladder (internal reference) ---
const ACCESS_LADDER = [
  {
    tier: 'member',
    gate: 'default',
    powers: 'File reports, browse the verified atlas, manage own captures.',
    cls: 'border-slate2/60 text-darkgray',
  },
  {
    tier: 'operative',
    gate: 'access: operative',
    powers: "Read-only 'field intel' — sees the incoming verification queue. No approve/reject.",
    cls: 'border-silver/40 text-silver',
  },
  {
    tier: 'moderator',
    gate: 'access: moderator',
    powers:
      'Approve / reject captures via the moderate function. No funding, store, or persona control.',
    cls: 'border-flare/50 text-flare',
  },
  {
    tier: 'admin',
    gate: 'role: admin  OR  access: admin',
    powers: 'Everything — plus Persona Control (assign role + access) and the audit log.',
    cls: 'border-ozone/50 text-ozone',
  },
];

// --- system architecture (internal / stage) — conceptual, no secrets or ids ---
const ARCHITECTURE = [
  {
    layer: 'Access & clearance',
    vis: 'internal',
    detail:
      'Two layers per account: the Base44 platform role (admin | user) as the hard gate, plus a custom access ladder (member → operative → moderator → admin). Moderation flows through the server-gated moderate function; entity row-level security stays admin-only, so the data layer is never widened.',
  },
  {
    layer: 'Backend',
    vis: 'internal',
    detail:
      'Base44 (Deno) functions + entities. personaCtl (admin/key-gated identity control, writes AccessLog), moderate (queue + verify), plus donation/checkout/stats/map/import functions. Service-role writes bypass RLS inside functions only.',
  },
  {
    layer: 'Content & newsroom',
    vis: 'internal',
    detail:
      'BlogPost entity + the blog function serve two blogs: public (anyone) and agency (agency members + admins). Audience gating lives in the function; a boolean agency flag on User (admin-toggled in Persona Control) grants newsroom access, orthogonal to the moderation ladder.',
  },
  {
    layer: 'Automation spine',
    vis: 'internal',
    detail:
      'An n8n ops hub bridges the civic app to back-office ops (donation events, task mirroring, social routing) over a proven Base44↔n8n webhook. Webhook URLs, keys, and tokens live in n8n / env — never in the client bundle. Trigger wiring is in progress.',
  },
  {
    layer: 'Source & licence',
    vis: 'internal',
    detail:
      'Code mirrors from Base44 (S3 canonical) to GitHub (oohearth/ooh-earth, public, AGPL-3.0 + CC BY-SA 4.0) as a non-destructive bidirectional mirror. BACKUP → oohearth/ooh-earth-backup.',
  },
  {
    layer: 'Environments',
    vis: 'stage',
    detail:
      'Two Base44 apps: STAGE / BACKUP (this build — internal review) and LIVE (production). Standing rule: prove on BACKUP before promoting to main. The stage build carries a persistent hazard banner, a [STAGE] title prefix, and a noindex tag.',
  },
];

// --- loose-ends checklist (insider review material) ---
const LOOSE_ENDS = [
  // --- A. MVP blockers / QA ---
  {
    item: 'Access clearance read-path',
    status: 'verify',
    vis: 'internal',
    note: 'New access ladder shipped to both apps. Confirm in a live session that a moderator/operative account actually gains its queue. Reads are hardened for both SDK shapes; fails safe (admins run off role).',
  },
  {
    item: 'Blog authoring UI',
    status: 'partial',
    vis: 'internal',
    note: 'Posts are seeded/edited via the blog function (save action, admin-only). A compose form in the console is not built yet — add when needed.',
  },
  {
    item: 'Sitemap internal tiers are UI-gated',
    status: 'clarify',
    vis: 'internal',
    note: 'Internal/stage entries are hidden from non-admins at render, but their strings still ship in the client bundle. Keep true secrets (keys, wallet seeds, webhook URLs) out of code entirely — never rely on UI gating for those.',
  },
  {
    item: 'Image assets 404 on oohearth.app host',
    status: 'workaround',
    vis: 'internal',
    note: 'Components point to legacy ooh.earth media — migrate to a stable host before publish.',
  },
  {
    item: 'TrueCost / TrashID camera scan',
    status: 'blocked',
    vis: 'internal',
    note: 'Requires HTTPS; blocked inside the preview iframe. Works only on a published domain.',
  },
  {
    item: 'Stripe checkout',
    status: 'blocked',
    vis: 'internal',
    note: 'Blocked in preview iframe; works on publish. No Stripe products configured yet.',
  },
  {
    item: 'USDC.e vs native USDC',
    status: 'clarify',
    vis: 'internal',
    note: 'Funding panel needs explicit labeling of which stablecoin donors should send.',
  },
  {
    item: 'Leaderboard / Operative Network',
    status: 'partial',
    vis: 'internal',
    note: 'Relies on Location.created_by_id; not yet surfacing 0101001 Operative entities.',
  },
  {
    item: 'Crypto receive addresses',
    status: 'verify',
    vis: 'internal',
    note: 'Addresses configured — ownership confirmation needed before public launch.',
  },
  {
    item: 'Portal dashboards use scaffold data',
    status: 'partial',
    vis: 'internal',
    note: '/portal/investor and /portal/client are live and gated; traction/treasury/client feeds are placeholders pending live wiring (n8n → Base44).',
  },
  {
    item: 'Investor access code is client-side',
    status: 'clarify',
    vis: 'internal',
    note: 'Shared code at /investor-access is a light preview gate (ships in the bundle). Change the code, and validate server-side (Base44 function → signed token) before exposing sensitive data.',
  },

  // --- B. Roadmap — features waiting to be completed (same semaphore as the Journey Map) ---
  {
    item: 'Web3 / crypto treasury',
    status: 'building',
    vis: 'internal',
    note: 'CryptoDonations live in /campaign but not shippable: Polygon vs Base chain mismatch unresolved, wallet addresses pending. Pick one chain, set wallets, then ship.',
  },
  {
    item: 'Zora creator-fee rail',
    status: 'building',
    vis: 'internal',
    note: 'Mint pipeline + Mint entity exist; on-chain fee routing to treasury not yet wired.',
  },
  {
    item: 'n8n donation-event triggers',
    status: 'building',
    vis: 'internal',
    note: 'Bridge proven; real donation event → n8n trigger still to wire (drives receipts, ledger, supporter updates).',
  },
  {
    item: 'n8n social routing',
    status: 'building',
    vis: 'internal',
    note: "Operative 'Share' fans out to channels via n8n. Bridge proven; routing triggers to wire.",
  },
  {
    item: 'n8n ↔ Asana task mirroring',
    status: 'building',
    vis: 'internal',
    note: 'Mirror ops tasks to Asana over the automation spine. Not yet wired.',
  },
  {
    item: 'Physical credentials (CR80)',
    status: 'building',
    vis: 'internal',
    note: 'Three-tier CR80 cards, lanyard, badge holder, tri-fold field-guide map — designed and production-ready. Awaiting print run + fulfilment; store surface to follow.',
  },
  {
    item: 'Objection Generator route',
    status: 'building',
    vis: 'internal',
    note: 'Formal objection generation exists in the field flow; a standalone /objection surface is not built.',
  },
  {
    item: 'City stats — OSM / Overpass',
    status: 'planned',
    vis: 'internal',
    note: 'Per-city density normalised on population via Overpass/OSM billboard data. Unlocks the density layer on Atlas + City Ambassador command view.',
  },
  {
    item: 'AFC Correspondents network',
    status: 'planned',
    vis: 'internal',
    note: 'Adfree Cities Correspondents roster feeding a shared city desk. Concept drafted, in outreach packs; awaiting first partner.',
  },
  {
    item: 'Precedent library',
    status: 'exploring',
    vis: 'internal',
    note: 'Citable legal precedent (A/69/286, Déboulonneurs 2013) surfaced behind objections. Scoping only.',
  },
  {
    item: 'Operative streaks / nudges',
    status: 'exploring',
    vis: 'internal',
    note: 'Retention loop toward the next tier. Not built.',
  },
  {
    item: 'City export / press pack',
    status: 'exploring',
    vis: 'internal',
    note: 'Export city-level impact for council submissions + press. Not built.',
  },
  {
    item: 'Supporter update cadence',
    status: 'exploring',
    vis: 'internal',
    note: 'Ongoing impact updates to donors, routed through n8n. Not built.',
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let me = null;
    try {
      me = await base44.auth.me();
    } catch {
      me = null;
    }
    const role = me && (me.role ?? me.data?.role);
    const access = me && (me.access ?? me.data?.access);
    const isAdmin = role === 'admin' || access === 'admin';

    // Fail closed — non-admins get no sensitive content at all.
    if (!isAdmin) return Response.json({ ok: false }, { status: 200 });

    return Response.json(
      {
        ok: true,
        access_ladder: ACCESS_LADDER,
        architecture: ARCHITECTURE,
        loose_ends: LOOSE_ENDS,
      },
      { status: 200 },
    );
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 200 });
  }
});
