// Whole-site map data: routes, UX explainers, audiences, auth, onward flows,
// AND an audience-visibility tier per entry so the review artifact can separate
// public-safe knowledge from low-key insider / agency-internal detail.
// Drives /sitemap. Canonical IA model — the NavMenu is the navigable subset;
// keep the two in step. Group order mirrors the menu hierarchy.

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

// --- build status (roadmap) — same semaphore as the Journey Map (/journey) ---
export const STATUS = {
  live:      { text: "Live",      cls: "border-[#39FF14]/50 text-[#39FF14]" },
  testing:   { text: "Testing",   cls: "border-[#1F51FF]/60 text-[#1F51FF]" },
  building:  { text: "Building",  cls: "border-[#EDFF00]/50 text-[#EDFF00]" },
  planned:   { text: "Planned",   cls: "border-[#FF5C00]/60 text-[#FF5C00]" },
  exploring: { text: "Exploring", cls: "border-white/25 text-silver/60" },
};

export const SITEMAP_GROUPS = [
  {
    group: "Explore · Public Surface",
    accent: "text-[#39FF14]",
    desc: "Open to everyone, no login. The atlas, the mission, the revenue funnel.",
    routes: [
      { path: "/", name: "Home", vis: "public", status: "live", ux: "Cinematic hero, live MetroKit telemetry grid, 3D globe, and the full narrative stack — mandate, atlas, offenders, operatives, manifesto, on-chain. The front door; dispatches visitors to map, report, or fund.", audience: "All visitors", auth: "none", flows: ["/map", "/report", "/campaign", "/portfolio"] },
      { path: "/map", name: "Field Atlas", vis: "public", status: "live", ux: "Interactive 3D globe + 2D map of logged advertising offenses and adbusts. Filter by type/status, click pins for detail, claim leads. Defaults to globe view; touch-rotation on mobile.", audience: "All visitors", auth: "optional", flows: ["/location/:id", "/report"] },
      { path: "map › density", name: "City Density · OSM", vis: "public", status: "planned", ux: "Per-city offense density normalised against population, powered by an Overpass / OpenStreetMap billboard-data ingest. Turns raw pin counts into rates per 10k so cities are comparable.", audience: "All visitors", auth: "none", flows: ["/map"], planned: true },
      { path: "/channel", name: "OOH·TV", vis: "public", status: "live", ux: "Curated video channel of subvertising reels and field dispatches.", audience: "All visitors", auth: "none", flows: ["/"] },
      { path: "/blog", name: "Blog", vis: "public", status: "live", ux: "Public field dispatches — launches, evidence drops, and movement thinking. Served via the gated blog function (public audience).", audience: "All visitors", auth: "none", flows: ["/blog/:slug", "/campaign"] },
      { path: "/blog/:slug", name: "Blog Post", vis: "public", status: "live", ux: "A single published public post, with a light markdown-ish body renderer and breadcrumbs.", audience: "All visitors", auth: "none", flows: ["/blog"] },
      { path: "/about", name: "About", vis: "public", status: "live", ux: "Mission, origin story, the 'Orbital Perspective' design system, and the open-source / community-funded model.", audience: "All visitors", auth: "none", flows: ["/campaign", "/careers"] },
      { path: "/location/:id", name: "Location Detail", vis: "public", status: "live", ux: "Full record for a single logged location: photo, type, coords, access key, source, status, and claim/mint actions.", audience: "All visitors", auth: "optional", flows: ["/map", "/zora"] },
    ],
  },
  {
    group: "Categories · Directories",
    accent: "text-[#39FF14]",
    desc: "The public record split by surface type. An index + a directory per type, each cross-linking to the others.",
    routes: [
      { path: "/categories", name: "Category Index", vis: "public", status: "live", ux: "Index of every surface-type directory — Bus Stops, Billboards, Digital, Transit, Painted, and more — with live counts. The front door to browsing the record by what the asset physically is.", audience: "All visitors", auth: "none", flows: ["/category/:slug", "/bus-stops"] },
      { path: "/regions", name: "Regions & Coverage", vis: "public", status: "live", ux: "Geographic expansion roadmap. Every region carries two axes — coverage status (Live/Partial/WIP/Planned) and open-data regime (Open access / Field-only), surfacing the Global North/South asymmetry in public-space data. Directories filter by region. Live: London (open). Partial: Bangkok (field-only). The rest queued.", audience: "All visitors", auth: "none", flows: ["/categories", "/category/:slug"] },
      { path: "/category/:slug", name: "Category Directory", vis: "public", status: "live", ux: "Generic per-type directory (billboard | digital | transit | painted | projection | mural | sticker | other). Lists every logged site of that type from the Location record (live entity + mapSeed fallback), with a switcher to every other category. Bus Stops keeps its own richer page.", audience: "All visitors", auth: "optional", flows: ["/location/:id", "/categories"] },
      { path: "/bus-stops", name: "Bus Stop Directory", vis: "public", status: "live", ux: "Dedicated bus-stop directory — accessible shelters and poles from the public record, grouped by area, with search + facing/shape filters. The richest category (its own dataset).", audience: "All visitors", auth: "none", flows: ["/bus-stop/:id", "/categories"] },
      { path: "/bus-stop/:id", name: "Bus Stop Detail", vis: "public", status: "live", ux: "Single bus-stop panel: status, location, unit type, facing, and a probable access key (unconfirmed until a field check).", audience: "All visitors", auth: "none", flows: ["/bus-stops"] },
    ],
  },
  {
    group: "Campaigns · Thematic Atlases",
    accent: "text-[#39FF14]",
    desc: "Issue-scoped views of the atlas. Public map portals for each front of the offensive.",
    routes: [
      { path: "/adbusting", name: "Adbusting", vis: "public", status: "live", ux: "Portal for the core adbusting campaign — subverted ads, reclaim actions, and the reel.", audience: "All visitors", auth: "none", flows: ["/map", "/report"] },
      { path: "/ecology", name: "Ecology", vis: "public", status: "live", ux: "Environmental front: greenwashing offenses and ecological reclaim of ad space.", audience: "All visitors", auth: "none", flows: ["/map", "/report"] },
      { path: "/rivers", name: "Rivers", vis: "public", status: "live", ux: "Waterways campaign portal — pollution accountability tied to outdoor advertising.", audience: "All visitors", auth: "none", flows: ["/map"] },
      { path: "/warzones", name: "War Zones", vis: "public", status: "live", ux: "Conflict-linked advertising and the campaign against it.", audience: "All visitors", auth: "none", flows: ["/map"] },
      { path: "/correspondents", name: "AFC Correspondents", vis: "internal", status: "planned", ux: "Adfree Cities Correspondents network — a roster of local eyes feeding one city desk, bridging the app to the wider movement. Concept drafted; in outreach packs.", audience: "Ambassadors / Partners", auth: "none", flows: ["/journey"], planned: true },
    ],
  },
  {
    group: "Field Ops",
    accent: "text-ozone",
    desc: "Browse openly; contributing data requires an operative session.",
    routes: [
      { path: "/report", name: "Field Report", vis: "public", status: "live", ux: "File a new advertising-offense report: location, type, photo, access key, notes. Saves to Location entity as pending.", audience: "Operatives", auth: "required", flows: ["/dashboard", "/map"] },
      { path: "/ar", name: "AR Lens", vis: "public", status: "testing", ux: "AR overlay tool — visualize adbusts in situ via camera. Field-readiness gated.", audience: "Operatives", auth: "optional", flows: ["/report"] },
      { path: "/scan", name: "TrueCost", vis: "public", status: "testing", ux: "UPC barcode scan → product impact / true-cost analysis. Camera requires HTTPS publish; blocked in preview iframe.", audience: "Operatives", auth: "optional", flows: ["/report"] },
      { path: "/trash", name: "Trash ID", vis: "public", status: "testing", ux: "Waste traceability — scan/ID waste to map corporate polluters. Camera requires HTTPS publish.", audience: "Operatives", auth: "optional", flows: ["/report"] },
      { path: "/inhome", name: "In-Home", vis: "public", status: "live", ux: "In-home / digital-surface busting tools — screen grids and digital scenes.", audience: "Operatives", auth: "optional", flows: ["/report"] },
      { path: "/zora", name: "Zora Mint", vis: "public", status: "testing", ux: "Location-to-NFT minting pipeline (non-custodial, client-side metadata builder). Mints route creator fees to the operative wallet.", audience: "Operatives", auth: "required", flows: ["/portfolio", "/location/:id"] },
      { path: "/field-id", name: "Field ID", vis: "public", status: "live", ux: "Operative field ID card generator (printable).", audience: "Operatives", auth: "optional", flows: ["/dashboard"] },
      { path: "/card", name: "Union Card", vis: "public", status: "live", ux: "Digital union membership / credential card.", audience: "Operatives", auth: "optional", flows: ["/dashboard"] },
      { path: "/access-keys", name: "Access Keys", vis: "public", status: "live", ux: "Open-access key registry — the standard tools that unlock transit-shelter and ad-space housings (H60, T-Handle, Circle, JCD Superlock, 4-Way Utility and more), each with a map of the bus-stop locations it likely fits. Keys are unconfirmed until a field check.", audience: "Operatives", auth: "none", flows: ["/bus-stops", "/access-keys/:slug"] },
      { path: "fn › objection", name: "Objection Generator", vis: "public", status: "building", ux: "Generates a formal, citable planning-consent objection for a specific billboard — offense grounds + precedent baked in. Feature exists in the field flow; a standalone route is not built yet.", audience: "Operatives", auth: "optional", flows: ["/report"], planned: true },
      { path: "lib › precedent", name: "Precedent Library", vis: "internal", status: "exploring", ux: "Citable legal precedent (A/69/286, Les Déboulonneurs 2013, First Things First) surfaced behind objections. Scoping only.", audience: "Operatives", auth: "none", flows: [], planned: true },
    ],
  },
  {
    group: "Operate · Your Account",
    accent: "text-ozone",
    desc: "Progression and personal console for a signed-in operative.",
    routes: [
      { path: "/operative", name: "Operative Profile", vis: "public", status: "live", ux: "Operative identity, tier progression (Scout → Field Operative → City Ambassador), and personal field record.", audience: "Operatives", auth: "optional", flows: ["/dashboard", "/field-id"] },
      { path: "/dashboard", name: "Operative Console", vis: "public", status: "live", ux: "Your console — your field captures, a verification queue if you hold clearance, an access-aware badge, and account controls. Realtime-synced via Location subscription.", audience: "Operatives / Admin", auth: "protected", flows: ["/report", "/map", "/fde"] },
      { path: "/guides", name: "Guides", vis: "public", status: "live", ux: "Status matrix + journey steps — onboarding guides for new operatives.", audience: "Operatives", auth: "none", flows: ["/report", "/dashboard"] },
      { path: "feat › streaks", name: "Streaks & Nudges", vis: "internal", status: "exploring", ux: "Retention loop — capture streaks and next-best-action nudges toward the next tier. Not built.", audience: "Operatives", auth: "optional", flows: ["/operative"], planned: true },
    ],
  },
  {
    group: "Fund & Store",
    accent: "text-ozone",
    desc: "The revenue funnel: donations, plans, commerce, and support.",
    routes: [
      { path: "/campaign", name: "Fund the Offensive", vis: "public", status: "testing", ux: "Treasury funding hub: crypto receive addresses, Stripe checkout, live donation-momentum meter, and impact ledger. The primary revenue funnel.", audience: "Donors", auth: "none", flows: ["/portfolio", "/support"] },
      { path: "campaign › on-chain", name: "On-chain Treasury", vis: "public", status: "building", ux: "Web3 donation path (CryptoDonations). Live in the campaign page but not shippable — Polygon vs Base chain mismatch unresolved, wallet addresses pending confirmation.", audience: "Donors", auth: "none", flows: ["/campaign", "/portfolio"], planned: true },
      { path: "/plans", name: "Plans / Roadmap", vis: "public", status: "live", ux: "Public plan tiers and roadmap — what each funding level unlocks.", audience: "Donors", auth: "none", flows: ["/campaign"] },
      { path: "/store", name: "Store", vis: "public", status: "live", ux: "Two-wing commerce surface: the Library sells field research and docs; the Store fronts digital products built on the app (plugins, UI kits, the Base44 theme), then NFT drops and one-off physical prototypes.", audience: "All visitors", auth: "none", flows: ["/campaign", "/portfolio"] },
      { path: "store › credentials", name: "Field Credentials · CR80", vis: "public", status: "building", ux: "Physical kit — CR80 ID cards (three tiers), lanyard, badge holder, tri-fold field-guide map. Designed and production-ready; awaiting the print run + fulfilment.", audience: "Operatives", auth: "optional", flows: ["/store", "/field-id"], planned: true },
      { path: "/support", name: "Support", vis: "public", status: "live", ux: "Help, contact, and FAQ.", audience: "All visitors", auth: "none", flows: ["/about"] },
      { path: "/careers", name: "Careers", vis: "public", status: "live", ux: "Open roles for the 0101001 operative unit and street-art collaborators.", audience: "Recruits", auth: "none", flows: ["/register", "/about"] },
    ],
  },
  {
    group: "Authentication",
    accent: "text-flare",
    desc: "Platform-owned auth backend. Hard redirects on success.",
    routes: [
      { path: "/login", name: "Login", vis: "public", status: "live", ux: "Email + password and Google OAuth. Hard-redirects home on success.", audience: "Operatives", auth: "none", flows: ["/"] },
      { path: "/register", name: "Register", vis: "public", status: "live", ux: "Email + password + confirm, Google, then OTP verification → token → hard redirect home.", audience: "Operatives", auth: "none", flows: ["/"] },
      { path: "/forgot-password", name: "Forgot Password", vis: "public", status: "live", ux: "Email → reset link. Always shows generic success (API hides whether email exists).", audience: "Operatives", auth: "none", flows: ["/reset-password"] },
      { path: "/reset-password", name: "Reset Password", vis: "public", status: "live", ux: "Reads ?token= + new password + confirm → reset → redirect to login.", audience: "Operatives", auth: "none", flows: ["/login"] },
    ],
  },
  {
    group: "Capital · Investor",
    accent: "text-ozone",
    desc: "Funder-facing surface. Public lead pages are marketing; the hub, console, valuation logic, and portals are agency-internal.",
    routes: [
      { path: "/investor-access", name: "Investor Access", vis: "public", status: "live", ux: "Branded investor entry: enter a shared access code (no account needed) or sign in with an account. The front door to the gated investor area.", audience: "Funders / Investors", auth: "none", flows: ["/investor", "/login"] },
      { path: "/capital/impact-grants", name: "Impact Grants — Lead Page", vis: "public", status: "live", ux: "Deep-lead page for SDG-anchored civic-infrastructure grantmakers. Angle: measurable public-space outcomes + precedent library.", audience: "Grant funders", auth: "none", flows: ["/console"] },
      { path: "/capital/philanthropic", name: "Philanthropic Capital — Lead Page", vis: "public", status: "live", ux: "Deep-lead page for family offices and values-aligned donors. Angle: in-kind assets already built; capital compounds reach, not equity.", audience: "Philanthropy", auth: "none", flows: ["/console"] },
      { path: "/capital/retro-pgf", name: "Retro Public Goods — Lead Page", vis: "public", status: "live", ux: "Deep-lead page for retroactive public-goods / ecosystem funds. Angle: open, copyleft, on-chain-native civic infrastructure.", audience: "Retro-PGF / ecosystems", auth: "none", flows: ["/console"] },
      { path: "/capital/civic-tech", name: "Civic-Tech Backers — Lead Page", vis: "public", status: "live", ux: "Deep-lead page for civic-tech accelerators and gov-tech / open-data funds. Angle: a working PWA + live ops spine as a flagship case study.", audience: "Civic-tech backers", auth: "none", flows: ["/console"] },
      { path: "/investor", name: "Investor Hub", vis: "internal", status: "live", ux: "Gated landing for the investor area (account login OR investor access code). Indexes the console, dashboards, capital pathways, and references.", audience: "Funders / Investors", auth: "protected", flows: ["/console", "/portal/investor", "/capital/impact-grants"] },
      { path: "/console", name: "Investor Console", vis: "internal", status: "live", ux: "Capital & ops console: two-stage valuation, live-ops traction snapshot, agency studio, ecosystem map, capital pathways, and portals. Gated (investor-class).", audience: "Funders / Investors", auth: "protected", flows: ["/capital/impact-grants", "/portal/client", "/kit"] },
      { path: "/portal/investor", name: "Investor Dashboard", vis: "internal", status: "live", ux: "Gated investor dashboard: traction snapshot, roadmap, data-room index, and a link to the live treasury console (/portfolio).", audience: "Investors", auth: "protected", flows: ["/console", "/portfolio"] },
      { path: "/portal/client", name: "Client Portal", vis: "internal", status: "building", ux: "Gated agency workspace: active briefs, live campaigns, deliverables, and evidence. Scaffold live; client feeds wire in via the n8n ops spine (placeholder data today).", audience: "Agency clients", auth: "protected", flows: ["/map", "/report"] },
    ],
  },
  {
    group: "Agency · Internal",
    accent: "text-ozone",
    desc: "Back-office ops. Consoles, treasury, newsroom, and the automation spine.",
    routes: [
      { path: "/agency", name: "Agency HQ", vis: "internal", status: "live", ux: "Newsroom intranet hub: quick-launch tiles, live dispatch feed, LinkedIn KPI panel, the Road-to-1,000 ladder, and the post queue with copy-to-post. Gated to agency members + admins.", audience: "Agency / Admin", auth: "protected", flows: ["/agency/blog", "/kit", "/sitemap"] },
      { path: "/agency/blog", name: "Agency Newsroom", vis: "internal", status: "live", ux: "Internal newsroom / agency blog: strategy, dispatch notes, and posts queued to share across networks. Gated to agency members + admins via the blog function.", audience: "Agency / Admin", auth: "protected", flows: ["/agency/blog/:slug", "/dashboard"] },
      { path: "/fde", name: "FDE Portal", vis: "internal", status: "live", ux: "0101001 forward-deployed engineer portal: active deployments, triage preview, reporting tools, operative roster.", audience: "Engineers / Admin", auth: "protected", flows: ["/dashboard", "/report", "/portfolio"] },
      { path: "/portfolio", name: "Treasury Console (Atari Portfolio)", vis: "internal", status: "live", ux: "Treasury console: live on-chain holdings, copy-to-clipboard receive addresses, inbound tx feed, minted coins, fiat pledges. Guided tour + tooltips.", audience: "Admin", auth: "protected", flows: ["/campaign", "/zora"] },
      { path: "/radio-ops", name: "Radio Ops", vis: "internal", status: "live", ux: "Field-radio operations surface — ambient comms / soundscape ops for the operative unit.", audience: "Operatives / Admin", auth: "protected", flows: ["/dashboard"] },
      { path: "n8n › automation", name: "Automation · n8n", vis: "stage", status: "building", ux: "The ops spine (oohearth.app.n8n.cloud). Base44↔n8n webhook bridge proven end-to-end; donation-event triggers, Asana task mirroring, and social routing are being wired. Back-office only — never a client route.", audience: "Admin", auth: "protected", flows: [], planned: true },
    ],
  },
  {
    group: "Ops · Access & Moderation",
    accent: "text-ozone",
    desc: "The clearance model behind the console. Insider knowledge — never shown publicly.",
    routes: [
      { path: "dashboard › Persona Control", name: "Persona Control", vis: "internal", status: "live", ux: "Admin-only panel in the console: assign platform role + app clearance per account, with a last-admin lockout guard and a live audit readout. Backed by the personaCtl function.", audience: "Admin", auth: "protected", flows: ["/dashboard"] },
      { path: "fn › moderate", name: "Moderation Service", vis: "internal", status: "live", ux: "Server-gated function that is the only elevated path for the queue: operatives read incoming, moderators + admins approve/reject. Entity RLS stays admin-only.", audience: "Moderators / Admin", auth: "protected", flows: ["/dashboard"] },
      { path: "entity › AccessLog", name: "Access Audit Log", vis: "internal", status: "live", ux: "Append-only record of every role/access change: who changed whom, when, and via which path (panel vs key). Admin-read only.", audience: "Admin", auth: "protected", flows: ["/dashboard"] },
    ],
  },
  {
    group: "Reference & Docs",
    accent: "text-ozone",
    desc: "The meta layer — how the product is mapped, documented, and branded.",
    routes: [
      { path: "/journey", name: "Journey Map", vis: "public", status: "live", ux: "Full UX journey map: every user perspective (Passer-by → Scout → Field Operative → City Ambassador → Supporter → Movement Partner), wireframed low-fi, with a build status on every feature and a master roadmap matrix.", audience: "Team / Partners", auth: "none", flows: ["/sitemap", "/map"] },
      { path: "/sitemap", name: "Sitemap", vis: "internal", status: "live", ux: "This page — every route with UX explainers, audience, auth, visibility tier, build status, and onward flows, plus the access ladder, architecture, and the loose-ends checklist.", audience: "Team / Admin", auth: "protected", flows: ["/journey", "/dashboard"] },
      { path: "/kit", name: "Brand Guide / UI Kit", vis: "internal", status: "live", ux: "Orbital Perspective design system — BrandPalette, TypeScale, PinLab, ComponentShowcase. Dev + brand reference.", audience: "Devs / Partners", auth: "none", flows: ["/"] },
      { path: "/brand", name: "Brand Standards", vis: "internal", status: "live", ux: "Ad Free Streets brand standards in the /kit dashboard shell \u2014 Strategy (positioning, vision, mission, audience, values, personality) + Language (tagline, principles, story, headlines, CTAs). Visual system in progress.", audience: "Team / Partners", auth: "none", flows: ["/kit"] },
    ],
  },
];

// Access ladder, system architecture, and the loose-ends checklist were moved
// server-side (the admin-gated sitemapIntel function) so they no longer ship in
// the client bundle. Sitemap.jsx fetches them at runtime, for admins only.

export const JOURNEYS = [
  { label: "Visitor", color: "text-[#39FF14]", steps: ["Home", "Atlas", "Report", "Register", "Console"] },
  { label: "Donor", color: "text-ozone", steps: ["Campaign", "Crypto / Stripe", "Treasury"] },
  { label: "Operative", color: "text-flare", steps: ["Profile", "Field Tools", "Zora Mint", "Ambassador"] },
  { label: "Funder", color: "text-ozone", steps: ["Hub", "Console", "Valuation", "Capital Pathways", "Data Room"] },
  { label: "Partner", color: "text-[#39FF14]", steps: ["Campaign page", "Public repo", "n8n", "Correspondents"] },
];

// (loose-ends checklist moved server-side → sitemapIntel, admin-gated)

export const LOOSE_STATUS = {
  // roadmap semaphore (matches STATUS + the Journey Map)
  live: { text: "Live", cls: "border-[#39FF14]/50 text-[#39FF14]" },
  building: { text: "Building", cls: "border-[#EDFF00]/50 text-[#EDFF00]" },
  planned: { text: "Planned", cls: "border-[#FF5C00]/60 text-[#FF5C00]" },
  exploring: { text: "Exploring", cls: "border-white/25 text-silver/60" },
  // QA / blocker states
  workaround: { text: "Workaround", cls: "border-ozone/50 text-ozone" },
  blocked: { text: "Blocked", cls: "border-flare/50 text-flare" },
  clarify: { text: "Clarify", cls: "border-ozone/50 text-ozone" },
  limit: { text: "Platform limit", cls: "border-slate2/60 text-darkgray" },
  partial: { text: "Partial", cls: "border-ozone/50 text-ozone" },
  verify: { text: "Verify", cls: "border-flare/50 text-flare" },
  pending: { text: "Pending", cls: "border-flare/50 text-flare" },
};