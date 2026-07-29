// Whole-site map data: routes, UX explainers, audiences, auth, onward flows,
// AND an audience-visibility tier per entry so the review artifact can separate
// public-safe knowledge from low-key insider / agency-internal detail.
// Drives /sitemap.

// --- audience visibility tiers ---
// public   : fine for anyone (renders for any signed-in viewer)
// internal : agency / admin only — insider knowledge, never shown to members
// stage    : internal AND only on the stage/BACKUP build (pre-release / env detail)
export const VISIBILITY = {
  public:   { text: "Public",     cls: "border-[#39FF14]/50 text-[#39FF14]", note: "OK for anyone." },
  internal: { text: "Internal",   cls: "border-ozone/60 text-ozone",         note: "Agency / admin only." },
  stage:    { text: "Stage-only", cls: "border-[#FF0040]/60 text-[#FF0040]", note: "Only on the stage build." },
};

export const AUTH_LABEL = {
  none: { text: "Public", cls: "border-[#39FF14]/50 text-[#39FF14]" },
  optional: { text: "Login optional", cls: "border-ozone/50 text-ozone" },
  required: { text: "Login required", cls: "border-flare/50 text-flare" },
  protected: { text: "Protected", cls: "border-flare/50 text-flare" },
};

export const SITEMAP_GROUPS = [
  {
    group: "Public Surface",
    accent: "text-[#39FF14]",
    desc: "Open to everyone, no login. The atlas, the mission, the revenue funnel.",
    routes: [
      { path: "/", name: "Home", vis: "public", ux: "Cinematic hero, live MetroKit telemetry grid, 3D globe, and the full narrative stack — mandate, atlas, offenders, operatives, manifesto, on-chain. The front door; dispatches visitors to map, report, or fund.", audience: "All visitors", auth: "none", flows: ["/map", "/report", "/campaign", "/portfolio"] },
      { path: "/map", name: "Field Atlas", vis: "public", ux: "Interactive 3D globe + 2D map of logged advertising offenses and adbusts. Filter by type/status, click pins for detail, claim leads. Defaults to globe view; touch-rotation on mobile.", audience: "All visitors", auth: "optional", flows: ["/location/:id", "/report"] },
      { path: "/about", name: "About", vis: "public", ux: "Mission, origin story, the 'Orbital Perspective' design system, and the open-source / community-funded model.", audience: "All visitors", auth: "none", flows: ["/campaign", "/careers"] },
      { path: "/campaign", name: "Fund the Offensive", vis: "public", ux: "Treasury funding hub: crypto receive addresses, Stripe checkout, live donation-momentum meter, and impact ledger. The primary revenue funnel.", audience: "Donors", auth: "none", flows: ["/portfolio", "/support"] },
      { path: "/store", name: "Store", vis: "public", ux: "Two-wing commerce surface: the Library sells field research and docs; the Store fronts digital products built on the app (plugins, UI kits, the Base44 theme), then NFT drops and one-off physical prototypes. Stripe checkout for paid digital goods.", audience: "All visitors", auth: "none", flows: ["/campaign", "/portfolio"] },
      { path: "/channel", name: "OOH·TV", vis: "public", ux: "Curated video channel of subvertising reels and field dispatches.", audience: "All visitors", auth: "none", flows: ["/"] },
      { path: "/careers", name: "Careers", vis: "public", ux: "Open roles for the 0101001 operative unit and street-art collaborators.", audience: "Recruits", auth: "none", flows: ["/register", "/about"] },
      { path: "/plans", name: "Plans / Roadmap", vis: "public", ux: "Public plan tiers and roadmap — what each funding level unlocks.", audience: "Donors", auth: "none", flows: ["/campaign"] },
      { path: "/support", name: "Support", vis: "public", ux: "Help, contact, and FAQ.", audience: "All visitors", auth: "none", flows: ["/about"] },
      { path: "/bus-stops", name: "Bus Stop Directory", vis: "public", ux: "Area directory of adopted bus-stop ad panels, grouped by region.", audience: "All visitors", auth: "none", flows: ["/bus-stop/:id"] },
      { path: "/location/:id", name: "Location Detail", vis: "public", ux: "Full record for a single logged location: photo, type, coords, access key, source, status, and claim/mint actions.", audience: "All visitors", auth: "optional", flows: ["/map", "/zora"] },
      { path: "/bus-stop/:id", name: "Bus Stop Detail", vis: "public", ux: "Single bus-stop panel: status, location, and field activity.", audience: "All visitors", auth: "none", flows: ["/bus-stops"] },
      { path: "/blog", name: "Blog", vis: "public", ux: "Public field dispatches — launches, evidence drops, and movement thinking. Served via the gated blog function (public audience).", audience: "All visitors", auth: "none", flows: ["/blog/:slug", "/campaign"] },
      { path: "/blog/:slug", name: "Blog Post", vis: "public", ux: "A single published public post, with a light markdown-ish body renderer and breadcrumbs.", audience: "All visitors", auth: "none", flows: ["/blog"] },
    ],
  },
  {
    group: "Field Tools",
    accent: "text-ozone",
    desc: "Browse openly; contributing data requires an operative session.",
    routes: [
      { path: "/report", name: "Field Report", vis: "public", ux: "File a new advertising-offense report: location, type, photo, access key, notes. Saves to Location entity as pending.", audience: "Operatives", auth: "required", flows: ["/dashboard", "/map"] },
      { path: "/ar", name: "AR Lens", vis: "public", ux: "AR overlay tool — visualize adbusts in situ via camera. Field-readiness gated.", audience: "Operatives", auth: "optional", flows: ["/report"] },
      { path: "/scan", name: "TrueCost", vis: "public", ux: "UPC barcode scan → product impact / true-cost analysis. Camera requires HTTPS publish; blocked in preview iframe.", audience: "Operatives", auth: "optional", flows: ["/report"] },
      { path: "/trash", name: "Trash ID", vis: "public", ux: "Waste traceability — scan/ID waste to map corporate polluters. Camera requires HTTPS publish.", audience: "Operatives", auth: "optional", flows: ["/report"] },
      { path: "/inhome", name: "In-Home", vis: "public", ux: "In-home / digital-surface busting tools — screen grids and digital scenes.", audience: "Operatives", auth: "optional", flows: ["/report"] },
      { path: "/zora", name: "Zora Mint", vis: "public", ux: "Location-to-NFT minting pipeline (non-custodial, client-side metadata builder). Mints route creator fees to the operative wallet.", audience: "Operatives", auth: "required", flows: ["/portfolio", "/location/:id"] },
      { path: "/field-id", name: "Field ID", vis: "public", ux: "Operative field ID card generator (printable).", audience: "Operatives", auth: "optional", flows: ["/dashboard"] },
      { path: "/card", name: "Union Card", vis: "public", ux: "Digital union membership / credential card.", audience: "Operatives", auth: "optional", flows: ["/dashboard"] },
      { path: "/guides", name: "Guides", vis: "public", ux: "Status matrix + journey steps — onboarding guides for new operatives.", audience: "Operatives", auth: "none", flows: ["/report", "/dashboard"] },
      { path: "/kit", name: "UI Kit", vis: "internal", ux: "Internal design-system showcase (BrandPalette, TypeScale, PinLab, ComponentShowcase). Dev reference.", audience: "Devs", auth: "none", flows: ["/"] },
    ],
  },
  {
    group: "Authentication",
    accent: "text-flare",
    desc: "Platform-owned auth backend. Hard redirects on success.",
    routes: [
      { path: "/login", name: "Login", vis: "public", ux: "Email + password and Google OAuth. Hard-redirects home on success.", audience: "Operatives", auth: "none", flows: ["/"] },
      { path: "/register", name: "Register", vis: "public", ux: "Email + password + confirm, Google, then OTP verification → token → hard redirect home.", audience: "Operatives", auth: "none", flows: ["/"] },
      { path: "/forgot-password", name: "Forgot Password", vis: "public", ux: "Email → reset link. Always shows generic success (API hides whether email exists).", audience: "Operatives", auth: "none", flows: ["/reset-password"] },
      { path: "/reset-password", name: "Reset Password", vis: "public", ux: "Reads ?token= + new password + confirm → reset → redirect to login.", audience: "Operatives", auth: "none", flows: ["/login"] },
    ],
  },
  {
    group: "Internal · Protected",
    accent: "text-ozone",
    desc: "Behind ProtectedRoute — login required. Operative + admin consoles.",
    routes: [
      { path: "/dashboard", name: "Operative Console", vis: "public", ux: "Your console — your field captures, a verification queue if you hold clearance, an access-aware badge, and account controls. Realtime-synced via Location subscription.", audience: "Operatives / Admin", auth: "protected", flows: ["/report", "/map", "/fde"] },
      { path: "/fde", name: "FDE Portal", vis: "internal", ux: "0101001 forward-deployed engineer portal: active deployments, triage preview, reporting tools, operative roster.", audience: "Engineers / Admin", auth: "protected", flows: ["/dashboard", "/report", "/portfolio"] },
      { path: "/portfolio", name: "Atari Portfolio", vis: "internal", ux: "Treasury console: live on-chain holdings, copy-to-clipboard receive addresses, inbound tx feed, minted coins, fiat pledges. Guided tour + tooltips.", audience: "Admin", auth: "protected", flows: ["/campaign", "/zora"] },
    ],
  },
  {
    group: "Ops · Access & Moderation",
    accent: "text-ozone",
    desc: "The clearance model behind the console. Insider knowledge — never shown publicly.",
    routes: [
      { path: "dashboard › Persona Control", name: "Persona Control", vis: "internal", ux: "Admin-only panel in the console: assign platform role + app clearance per account, with a last-admin lockout guard and a live audit readout. Backed by the personaCtl function.", audience: "Admin", auth: "protected", flows: ["/dashboard"] },
      { path: "fn › moderate", name: "Moderation Service", vis: "internal", ux: "Server-gated function that is the only elevated path for the queue: operatives read incoming (field intel), moderators + admins approve/reject. Entity RLS stays admin-only — powers live in the function, not the data layer.", audience: "Moderators / Admin", auth: "protected", flows: ["/dashboard"] },
      { path: "entity › AccessLog", name: "Access Audit Log", vis: "internal", ux: "Append-only record of every role/access change: who changed whom, when, and via which path (panel vs key). Admin-read only.", audience: "Admin", auth: "protected", flows: ["/dashboard"] },
    ],
  },
  {
    group: "Content · Newsroom",
    accent: "text-ozone",
    desc: "The blogs. Public dispatches for anyone; the agency newsroom for agency members.",
    routes: [
      { path: "/agency", name: "Agency HQ", vis: "internal", ux: "Newsroom intranet hub: quick-launch tiles, live dispatch feed, LinkedIn KPI panel, the Road-to-1,000 ladder, and the post queue with copy-to-post. Gated to agency members + admins.", audience: "Agency / Admin", auth: "protected", flows: ["/agency/blog", "/kit", "/sitemap"] },
      { path: "/agency/blog", name: "Agency Newsroom", vis: "internal", ux: "Internal newsroom / agency blog: Q4 strategy, dispatch notes, and the posts queued to share across networks. Gated to agency members + admins via the blog function.", audience: "Agency / Admin", auth: "protected", flows: ["/agency/blog/:slug", "/dashboard"] },
      { path: "fn \u203a blog", name: "Blog Service", vis: "internal", ux: "Server-gated read/write for BlogPost. Public audience \u2192 anyone (published); agency audience \u2192 agency members + admins; drafts \u2192 admins. The only path to posts; entity RLS stays admin-only.", audience: "System", auth: "protected", flows: ["/blog", "/agency/blog"] },
      { path: "entity \u203a BlogPost", name: "BlogPost", vis: "internal", ux: "audience (public|agency), status (draft|published), category, network, pinned, slug, body. Agency posts never reach a non-agency client.", audience: "System", auth: "protected", flows: [] },
      { path: "user \u203a agency", name: "Agency status flag", vis: "internal", ux: "Boolean on User, admin-toggled in Persona Control. Grants read access to the agency newsroom. Orthogonal to the moderation ladder.", audience: "Admin", auth: "protected", flows: ["/dashboard"] },
    ],
  },
  {
    group: "Capital · Investor",
    accent: "text-ozone",
    desc: "Funder-facing surface. Public lead pages are marketing; the hub, console, valuation logic, and portals are agency-internal.",
    routes: [
      { path: "/investor-access", name: "Investor Access", vis: "public", ux: "Branded investor entry: enter a shared access code (no account needed) or sign in with an account. The front door to the gated investor area.", audience: "Funders / Investors", auth: "none", flows: ["/investor", "/login"] },
      { path: "/capital/impact-grants", name: "Impact Grants — Lead Page", vis: "public", ux: "Deep-lead page for SDG-anchored civic-infrastructure grantmakers. Angle: measurable public-space outcomes + precedent library.", audience: "Grant funders", auth: "none", flows: ["/console"] },
      { path: "/capital/philanthropic", name: "Philanthropic Capital — Lead Page", vis: "public", ux: "Deep-lead page for family offices and values-aligned donors. Angle: in-kind assets already built; capital compounds reach, not equity.", audience: "Philanthropy", auth: "none", flows: ["/console"] },
      { path: "/capital/retro-pgf", name: "Retro Public Goods — Lead Page", vis: "public", ux: "Deep-lead page for retroactive public-goods / ecosystem funds. Angle: open, copyleft, on-chain-native civic infrastructure.", audience: "Retro-PGF / ecosystems", auth: "none", flows: ["/console"] },
      { path: "/capital/civic-tech", name: "Civic-Tech Backers — Lead Page", vis: "public", ux: "Deep-lead page for civic-tech accelerators and gov-tech / open-data funds. Angle: a working PWA + live ops spine as a flagship case study.", audience: "Civic-tech backers", auth: "none", flows: ["/console"] },
      { path: "/investor", name: "Investor Hub", vis: "internal", ux: "Gated landing for the investor area (account login OR investor access code). Indexes the console, dashboards, capital pathways, and references.", audience: "Funders / Investors", auth: "protected", flows: ["/console", "/portal/investor", "/capital/impact-grants"] },
      { path: "/console", name: "Investor Console", vis: "internal", ux: "Capital & ops console: two-stage valuation (replacement-cost floor → traction/movement premium → ask), live-ops traction snapshot, agency studio, ecosystem map, capital pathways, and portals. Gated (investor-class).", audience: "Funders / Investors", auth: "protected", flows: ["/capital/impact-grants", "/portal/client", "/kit"] },
      { path: "/portal/client", name: "Client Portal", vis: "internal", ux: "Gated agency workspace: active briefs, live campaigns, deliverables, and evidence. Scaffold live; client feeds wire in via the n8n ops spine.", audience: "Agency clients", auth: "protected", flows: ["/map", "/report"] },
      { path: "/portal/investor", name: "Investor Dashboard", vis: "internal", ux: "Gated investor dashboard: traction snapshot, roadmap, data-room index, and a link to the live treasury console (/portfolio).", audience: "Investors", auth: "protected", flows: ["/console", "/portfolio"] },
      { path: "/brand", name: "Brand Guide", vis: "internal", ux: "Orbital Perspective brand system — palette, Inter Tight, reticle signature. Served today by the existing /kit UI Kit; planned as a standalone brand route.", audience: "Team / Partners", auth: "none", flows: ["/kit"], planned: true },
    ],
  },
];

// --- access & clearance ladder (internal reference) ---
export const ACCESS_LADDER = [
  { tier: "member", gate: "default", powers: "File reports, browse the verified atlas, manage own captures.", cls: "border-slate2/60 text-darkgray" },
  { tier: "operative", gate: "access: operative", powers: "Read-only 'field intel' — sees the incoming verification queue. No approve/reject.", cls: "border-silver/40 text-silver" },
  { tier: "moderator", gate: "access: moderator", powers: "Approve / reject captures via the moderate function. No funding, store, or persona control.", cls: "border-flare/50 text-flare" },
  { tier: "admin", gate: "role: admin  OR  access: admin", powers: "Everything — plus Persona Control (assign role + access) and the audit log.", cls: "border-ozone/50 text-ozone" },
];

// --- system architecture (internal / stage) — conceptual, no secrets or ids ---
export const ARCHITECTURE = [
  { layer: "Access & clearance", vis: "internal", detail: "Two layers per account: the Base44 platform role (admin | user) as the hard gate, plus a custom access ladder (member → operative → moderator → admin). Moderation flows through the server-gated moderate function; entity row-level security stays admin-only, so the data layer is never widened." },
  { layer: "Backend", vis: "internal", detail: "Base44 (Deno) functions + entities. personaCtl (admin/key-gated identity control, writes AccessLog), moderate (queue + verify), plus donation/checkout/stats/map/import functions. Service-role writes bypass RLS inside functions only." },
  { layer: "Content & newsroom", vis: "internal", detail: "BlogPost entity + the blog function serve two blogs: public (anyone) and agency (agency members + admins). Audience gating lives in the function; a boolean agency flag on User (admin-toggled in Persona Control) grants newsroom access, orthogonal to the moderation ladder." },
  { layer: "Automation spine", vis: "internal", detail: "An n8n ops hub bridges the civic app to back-office ops (donation events, task mirroring, social routing) over a proven Base44↔n8n webhook. Webhook URLs, keys, and tokens live in n8n / env — never in the client bundle." },
  { layer: "Environments", vis: "stage", detail: "Two Base44 apps: STAGE / BACKUP (this build — internal review) and LIVE (production). Standing rule: prove on BACKUP before promoting to main. The stage build carries a persistent hazard banner, a [STAGE] title prefix, and a noindex tag." },
];

export const JOURNEYS = [
  { label: "Visitor", color: "text-[#39FF14]", steps: ["Home", "Atlas", "Report", "Register", "Dashboard"] },
  { label: "Donor", color: "text-ozone", steps: ["Campaign", "Crypto / Stripe", "Portfolio"] },
  { label: "Operative", color: "text-flare", steps: ["FDE Portal", "Field Tools", "Zora Mint", "Portfolio"] },
  { label: "Funder", color: "text-ozone", steps: ["Hub", "Console", "Valuation", "Capital Pathways", "Data Room"] },
];

// note: the loose-ends checklist is insider review material — gated to internal.
export const LOOSE_ENDS = [
  { item: "Access clearance read-path", status: "verify", vis: "internal", note: "New access ladder shipped to both apps. Confirm in a live session that a moderator/operative account actually gains its queue. Reads are hardened for both SDK shapes; fails safe (admins run off role)." },
  { item: "Blog authoring UI", status: "partial", vis: "internal", note: "Posts are seeded/edited via the blog function (save action, admin-only). A compose form in the console is not built yet — add when needed." },
  { item: "Sitemap internal tiers are UI-gated", status: "clarify", vis: "internal", note: "Internal/stage entries are hidden from non-admins at render, but their strings still ship in the client bundle. Keep true secrets (keys, wallet seeds, webhook URLs) out of code entirely — never rely on UI gating for those." },
  { item: "Image assets 404 on oohearth.app host", status: "workaround", vis: "internal", note: "Components point to legacy ooh.earth media — migrate to a stable host before publish." },
  { item: "TrueCost / TrashID camera scan", status: "blocked", vis: "internal", note: "Requires HTTPS; blocked inside the preview iframe. Works only on a published domain." },
  { item: "Stripe checkout", status: "blocked", vis: "internal", note: "Blocked in preview iframe; works on publish. No Stripe products configured yet." },
  { item: "USDC.e vs native USDC", status: "clarify", vis: "internal", note: "Funding panel needs explicit labeling of which stablecoin donors should send." },
  { item: "Leaderboard / Operative Network", status: "partial", vis: "internal", note: "Relies on Location.created_by_id; not yet surfacing 0101001 Operative entities." },
  { item: "Crypto receive addresses", status: "verify", vis: "internal", note: "Addresses configured — ownership confirmation needed before public launch." },
  { item: "Zora creator-fee rail", status: "pending", vis: "internal", note: "Mint pipeline + Mint entity exist; on-chain fee routing to treasury not yet wired." },
  { item: "Portal dashboards use scaffold data", status: "partial", vis: "internal", note: "/portal/investor and /portal/client are live and gated; traction/treasury/client feeds are placeholders pending live wiring (n8n → Base44)." },
  { item: "Investor access code is client-side", status: "clarify", vis: "internal", note: "Shared code at /investor-access is a light preview gate (ships in the bundle). Change the code, and validate server-side (Base44 function → signed token) before exposing sensitive data." },
];

export const LOOSE_STATUS = {
  workaround: { text: "Workaround", cls: "border-ozone/50 text-ozone" },
  blocked: { text: "Blocked", cls: "border-flare/50 text-flare" },
  clarify: { text: "Clarify", cls: "border-ozone/50 text-ozone" },
  limit: { text: "Platform limit", cls: "border-slate2/60 text-darkgray" },
  partial: { text: "Partial", cls: "border-ozone/50 text-ozone" },
  verify: { text: "Verify", cls: "border-flare/50 text-flare" },
  pending: { text: "Pending", cls: "border-flare/50 text-flare" },
};
