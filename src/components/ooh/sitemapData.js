// Whole-site map data: routes, UX explainers, audiences, auth, onward flows.
// Drives /sitemap — the review + documentation artifact.

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
      { path: "/", name: "Home", ux: "Cinematic hero, live MetroKit telemetry grid, 3D globe, and the full narrative stack — mandate, atlas, offenders, operatives, manifesto, on-chain. The front door; dispatches visitors to map, report, or fund.", audience: "All visitors", auth: "none", flows: ["/map", "/report", "/campaign", "/portfolio"] },
      { path: "/map", name: "Field Atlas", ux: "Interactive 3D globe + 2D map of logged advertising offenses and adbusts. Filter by type/status, click pins for detail, claim leads. Defaults to globe view; touch-rotation on mobile.", audience: "All visitors", auth: "optional", flows: ["/location/:id", "/report"] },
      { path: "/about", name: "About", ux: "Mission, origin story, the 'Orbital Perspective' design system, and the open-source / community-funded model.", audience: "All visitors", auth: "none", flows: ["/campaign", "/careers"] },
      { path: "/campaign", name: "Fund the Offensive", ux: "Treasury funding hub: crypto receive addresses, Stripe checkout, live donation-momentum meter, and impact ledger. The primary revenue funnel.", audience: "Donors", auth: "none", flows: ["/portfolio", "/support"] },
      { path: "/store", name: "Store", ux: "Two-wing commerce surface: the Library sells field research and docs; the Store fronts digital products built on the app (plugins, UI kits, the Base44 theme), then NFT drops and one-off physical prototypes. Stripe checkout for paid digital goods.", audience: "All visitors", auth: "none", flows: ["/campaign", "/portfolio"] },
      { path: "/channel", name: "OOH·TV", ux: "Curated video channel of subvertising reels and field dispatches.", audience: "All visitors", auth: "none", flows: ["/"] },
      { path: "/careers", name: "Careers", ux: "Open roles for the 0101001 operative unit and street-art collaborators.", audience: "Recruits", auth: "none", flows: ["/register", "/about"] },
      { path: "/plans", name: "Plans / Roadmap", ux: "Public plan tiers and roadmap — what each funding level unlocks.", audience: "Donors", auth: "none", flows: ["/campaign"] },
      { path: "/support", name: "Support", ux: "Help, contact, and FAQ.", audience: "All visitors", auth: "none", flows: ["/about"] },
      { path: "/bus-stops", name: "Bus Stop Directory", ux: "Area directory of adopted bus-stop ad panels, grouped by region.", audience: "All visitors", auth: "none", flows: ["/bus-stop/:id"] },
      { path: "/location/:id", name: "Location Detail", ux: "Full record for a single logged location: photo, type, coords, access key, source, status, and claim/mint actions.", audience: "All visitors", auth: "optional", flows: ["/map", "/zora"] },
      { path: "/bus-stop/:id", name: "Bus Stop Detail", ux: "Single bus-stop panel: status, location, and field activity.", audience: "All visitors", auth: "none", flows: ["/bus-stops"] },
    ],
  },
  {
    group: "Field Tools",
    accent: "text-ozone",
    desc: "Browse openly; contributing data requires an operative session.",
    routes: [
      { path: "/report", name: "Field Report", ux: "File a new advertising-offense report: location, type, photo, access key, notes. Saves to Location entity as pending.", audience: "Operatives", auth: "required", flows: ["/dashboard", "/map"] },
      { path: "/ar", name: "AR Lens", ux: "AR overlay tool — visualize adbusts in situ via camera. Field-readiness gated.", audience: "Operatives", auth: "optional", flows: ["/report"] },
      { path: "/scan", name: "TrueCost", ux: "UPC barcode scan → product impact / true-cost analysis. Camera requires HTTPS publish; blocked in preview iframe.", audience: "Operatives", auth: "optional", flows: ["/report"] },
      { path: "/trash", name: "Trash ID", ux: "Waste traceability — scan/ID waste to map corporate polluters. Camera requires HTTPS publish.", audience: "Operatives", auth: "optional", flows: ["/report"] },
      { path: "/inhome", name: "In-Home", ux: "In-home / digital-surface busting tools — screen grids and digital scenes.", audience: "Operatives", auth: "optional", flows: ["/report"] },
      { path: "/zora", name: "Zora Mint", ux: "Location-to-NFT minting pipeline (non-custodial, client-side metadata builder). Mints route creator fees to the operative wallet.", audience: "Operatives", auth: "required", flows: ["/portfolio", "/location/:id"] },
      { path: "/field-id", name: "Field ID", ux: "Operative field ID card generator (printable).", audience: "Operatives", auth: "optional", flows: ["/dashboard"] },
      { path: "/card", name: "Union Card", ux: "Digital union membership / credential card.", audience: "Operatives", auth: "optional", flows: ["/dashboard"] },
      { path: "/guides", name: "Guides", ux: "Status matrix + journey steps — onboarding guides for new operatives.", audience: "Operatives", auth: "none", flows: ["/report", "/dashboard"] },
      { path: "/kit", name: "UI Kit", ux: "Internal design-system showcase (BrandPalette, TypeScale, PinLab, ComponentShowcase).", audience: "Devs", auth: "none", flows: ["/"] },
    ],
  },
  {
    group: "Authentication",
    accent: "text-flare",
    desc: "Platform-owned auth backend. Hard redirects on success.",
    routes: [
      { path: "/login", name: "Login", ux: "Email + password and Google OAuth. Hard-redirects home on success.", audience: "Operatives", auth: "none", flows: ["/"] },
      { path: "/register", name: "Register", ux: "Email + password + confirm, Google, then OTP verification → token → hard redirect home.", audience: "Operatives", auth: "none", flows: ["/"] },
      { path: "/forgot-password", name: "Forgot Password", ux: "Email → reset link. Always shows generic success (API hides whether email exists).", audience: "Operatives", auth: "none", flows: ["/reset-password"] },
      { path: "/reset-password", name: "Reset Password", ux: "Reads ?token= + new password + confirm → reset → redirect to login.", audience: "Operatives", auth: "none", flows: ["/login"] },
    ],
  },
  {
    group: "Internal · Protected",
    accent: "text-ozone",
    desc: "Behind ProtectedRoute — login required. Operative + admin consoles.",
    routes: [
      { path: "/dashboard", name: "Operative Console", ux: "My field captures + admin verification queue + account danger zone. Realtime-synced via Location subscription.", audience: "Operatives / Admin", auth: "protected", flows: ["/report", "/map", "/fde"] },
      { path: "/fde", name: "FDE Portal", ux: "0101001 forward-deployed engineer portal: active deployments, triage preview, reporting tools, operative roster.", audience: "Engineers / Admin", auth: "protected", flows: ["/dashboard", "/report", "/portfolio"] },
      { path: "/portfolio", name: "Atari Portfolio", ux: "Treasury console: live on-chain holdings, copy-to-clipboard receive addresses, inbound tx feed, minted coins, fiat pledges. Guided tour + tooltips.", audience: "Admin", auth: "protected", flows: ["/campaign", "/zora"] },
    ],
  },
];

export const JOURNEYS = [
  { label: "Visitor", color: "text-[#39FF14]", steps: ["Home", "Atlas", "Report", "Register", "Dashboard"] },
  { label: "Donor", color: "text-ozone", steps: ["Campaign", "Crypto / Stripe", "Portfolio"] },
  { label: "Operative", color: "text-flare", steps: ["FDE Portal", "Field Tools", "Zora Mint", "Portfolio"] },
];

export const LOOSE_ENDS = [
  { item: "Image assets 404 on oohearth.app host", status: "workaround", note: "Components point to legacy ooh.earth media — migrate to a stable host before publish." },
  { item: "TrueCost / TrashID camera scan", status: "blocked", note: "Requires HTTPS; blocked inside the preview iframe. Works only on a published domain." },
  { item: "Stripe checkout", status: "blocked", note: "Blocked in preview iframe; works on publish. No Stripe products configured yet." },
  { item: "USDC.e vs native USDC", status: "clarify", note: "Funding panel needs explicit labeling of which stablecoin donors should send." },
  { item: "SendEmail external recipients", status: "limit", note: "Internal tool reaches registered app users only — external addresses rejected." },
  { item: "Leaderboard / Operative Network", status: "partial", note: "Relies on Location.created_by_id; not yet surfacing 0101001 Operative entities." },
  { item: "Crypto receive addresses", status: "verify", note: "Addresses configured — ownership confirmation needed before public launch." },
  { item: "Zora creator-fee rail", status: "pending", note: "Mint pipeline + Mint entity exist; on-chain fee routing to treasury not yet wired." },
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