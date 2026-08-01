// Per-route Open Graph + document metadata.
// Applied client-side per route in App.jsx (see the useEffect on location.pathname).
// JS-executing crawlers + direct page loads get per-route meta; non-JS bots
// still see the static index.html defaults (server prerender is platform-level).

const DEFAULT_IMAGE = "https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/6cfe92653_generated_image.png";

export const OG_IMAGES = {
  default:   DEFAULT_IMAGE,
  nft:       "https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/fcb604d21_generated_image.png",
  lab:       "https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/fdc1442c0_generated_image.png",
  map:       "https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/ba44da8c8_generated_image.png",
  store:     "https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/3f2b5f965_generated_image.png",
  campaign:  "https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/2da8d172a_generated_image.png",
  adbusting: "https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/d25281b75_generated_image.png",
};

const D = "An open-source, community-funded app reclaiming the visual commons. Mapping every corporate advertising offense on the public record and coordinating creative resistance worldwide.";

const META = {
  "/":              { title: "OOH Earth — Street Art & Adbusting Maps", desc: D, image: OG_IMAGES.default },
  "/map":           { title: "Field Atlas — OOH Earth", desc: "Interactive global map of every billboard, digital screen, and advertising surface — logged, verified, and ready for adbusting.", image: OG_IMAGES.map },
  "/adbusting":     { title: "Adbusting Portal — OOH Earth", desc: "Creative resistance against outdoor advertising. Subverting, reclaiming, and replacing corporate messaging in public space.", image: OG_IMAGES.adbusting },
  "/ecology":       { title: "Ecology Portal — OOH Earth", desc: "Environmental impact of outdoor advertising — carbon, waste, and the ecological cost of the visual commons.", image: OG_IMAGES.adbusting },
  "/rivers":        { title: "Rivers Portal — OOH Earth", desc: "Mapping advertising along waterways and the fight to keep riverbanks ad-free.", image: OG_IMAGES.adbusting },
  "/warzones":      { title: "War Zones Portal — OOH Earth", desc: "Advertising in conflict zones — propaganda, militarization, and the media of war.", image: OG_IMAGES.adbusting },
  "/report":        { title: "Field Report — OOH Earth", desc: "Log a billboard, digital screen, or advertising offense. Photo, location, access key, and notes — on the public record.", image: OG_IMAGES.map },
  "/about":         { title: "About — OOH Earth", desc: "OOH Earth is an open-source, community-funded platform reclaiming the visual commons through mapping, adbusting, and creative resistance.", image: OG_IMAGES.default },
  "/support":       { title: "Support — OOH Earth", desc: "Get help, report issues, and join the operative network. Field support for the OOH Earth community.", image: OG_IMAGES.default },
  "/plans":         { title: "Plans & Roadmap — OOH Earth", desc: "The OOH Earth build roadmap — what's live, what's building, and what's planned.", image: OG_IMAGES.default },
  "/campaign":      { title: "Fund the Offensive — OOH Earth", desc: "Community-funded treasury for adbusting, mapping, and creative resistance. Support the offensive.", image: OG_IMAGES.campaign },
  "/store":         { title: "Store — OOH Earth", desc: "Digital products, research documents, NFT drops, and physical prototypes from the OOH Earth lab.", image: OG_IMAGES.store },
  "/ar":            { title: "AR Lens — OOH Earth", desc: "Augmented reality overlay for billboards and ad surfaces — see what's there and what could be.", image: OG_IMAGES.map },
  "/scan":          { title: "TrueCost — OOH Earth", desc: "Scan a product barcode and reveal its true cost — environmental, social, and supply-chain impact.", image: OG_IMAGES.default },
  "/trash":         { title: "Trash ID — OOH Earth", desc: "Identify waste, trace its origin, and hold producers accountable. The field-trash identification tool.", image: OG_IMAGES.default },
  "/inhome":        { title: "In-Home — OOH Earth", desc: "Digital adbusting dashboard — track and visualize interventions across metaverse, AR, and digital surfaces.", image: OG_IMAGES.adbusting },
  "/zora":          { title: "Zora Mint — OOH Earth", desc: "On-chain NFT minting for adbusting interventions and subvertising artwork. Mint your reclamation.", image: OG_IMAGES.store },
  "/kit":           { title: "Brand Guide — OOH Earth", desc: "The OOH Earth design system — orbital perspective, high-vis palette, typography, and component library.", image: OG_IMAGES.default },
  "/operative":     { title: "Operative Profile — OOH Earth", desc: "Your field operative identity — handle, tier, badges, and field credits.", image: OG_IMAGES.default },
  "/guides":        { title: "Guides — OOH Earth", desc: "Field guides for operatives — how to report, bust, mint, and organize.", image: OG_IMAGES.default },
  "/field-id":      { title: "Field ID — OOH Earth", desc: "Your field credential — printable ID card for operatives on the ground.", image: OG_IMAGES.default },
  "/card":          { title: "Union Card — OOH Earth", desc: "Your OOH Earth union membership card — digital and physical.", image: OG_IMAGES.default },
  "/channel":       { title: "OOH·TV — OOH Earth", desc: "The OOH Earth broadcast channel — live field reports, adbusting footage, and tactical media.", image: OG_IMAGES.default },
  "/bus-stops":     { title: "Bus Stops — OOH Earth", desc: "Transit advertising mapped — every bus stop shelter and transit surface on the public record.", image: OG_IMAGES.map },
  "/journey":       { title: "Journey Map — OOH Earth", desc: "The operative journey — from first report to veteran field operative.", image: OG_IMAGES.default },
  "/categories":    { title: "Categories — OOH Earth", desc: "Browse advertising surfaces by type — billboards, digital, transit, painted, and more.", image: OG_IMAGES.map },
  "/regions":       { title: "Regions — OOH Earth", desc: "Browse advertising locations by region and city across the globe.", image: OG_IMAGES.map },
  "/careers":       { title: "Careers — OOH Earth", desc: "Join the OOH Earth collective — open roles for operatives, researchers, and developers.", image: OG_IMAGES.default },
  "/blog":          { title: "Blog — OOH Earth", desc: "Dispatches, strategy, and futures from the OOH Earth collective.", image: OG_IMAGES.default },
  "/investor-access": { title: "Investor Access — OOH Earth", desc: "Access the investor hub and capital portal for OOH Earth.", image: OG_IMAGES.campaign },
  "/account":       { title: "Account — OOH Earth", desc: "Manage your OOH Earth account and operative profile.", image: OG_IMAGES.default },
  "/dashboard":     { title: "Console — OOH Earth", desc: "Operative console — field stats, locations, mints, and activity.", image: OG_IMAGES.default },
  "/fde":           { title: "FDE Portal — OOH Earth", desc: "Field Design Engineering portal — architecture and ops for the OOH Earth platform.", image: OG_IMAGES.lab },
  "/portal/ops":    { title: "Architecture Ops — OOH Earth", desc: "Platform architecture operations and build management.", image: OG_IMAGES.lab },
  "/portfolio":     { title: "Treasury Console — OOH Earth", desc: "On-chain treasury, assets, and portfolio management.", image: OG_IMAGES.campaign },
  "/radio-ops":     { title: "Radio Ops — OOH Earth", desc: "Field radio operations — live streams, stations, and broadcast management.", image: OG_IMAGES.default },
  "/sitemap":       { title: "Sitemap — OOH Earth", desc: "The full OOH Earth site map — every page, portal, and tool.", image: OG_IMAGES.default },
  "/agency":        { title: "Agency HQ — OOH Earth", desc: "Agency headquarters — newsroom, operations, and internal tools.", image: OG_IMAGES.default },
  "/agency/blog":   { title: "Agency Newsroom — OOH Earth", desc: "Internal agency blog — strategy, dispatches, and launch notes.", image: OG_IMAGES.default },
  "/lab":           { title: "Hex Engine Lab — OOH Earth", desc: "The tangible I Ching controller and Genesis Coin prototype area. Pieces graduate into the main app once proven.", image: OG_IMAGES.lab },
  "/lab/coin":      { title: "Genesis Coin — OOH Earth Lab", desc: "The meme coin you can hold — obverse, reverse, edge, and tokenomics.", image: OG_IMAGES.lab },
  "/lab/simulator":  { title: "Hex Engine Simulator — OOH Earth Lab", desc: "Working 64-state device — rings, Ba Gua dial, and BLE frame log.", image: OG_IMAGES.lab },
  "/lab/device":    { title: "3D Device — OOH Earth Lab", desc: "Interactive brass coin-cube — six rotating faces, spin, explode, and HUD.", image: OG_IMAGES.lab },
  "/lab/livingcoin": { title: "Living Coin — OOH Earth Lab", desc: "Coin-cube production spec — technical drawings, six rotating brass faces.", image: OG_IMAGES.lab },
  "/lab/spec":      { title: "Engineering Spec — OOH Earth Lab", desc: "State machine, BLE GATT, frame format, and screen inventory.", image: OG_IMAGES.lab },
  "/lab/sequencer": { title: "I Ching Sequencer — OOH Earth Lab", desc: "64-step sequencer across King Wen, Fuxi, and OOH protocol orderings.", image: OG_IMAGES.lab },
  "/lab/companion": { title: "Companion App — OOH Earth Lab", desc: "Five mobile screens — pair, map, hex, wallet, and DAO.", image: OG_IMAGES.lab },
  "/lab/poster":    { title: "Concept Poster — OOH Earth Lab", desc: "2400px infographic — concept art for the Hex Engine.", image: OG_IMAGES.lab },
  "/lab/status":    { title: "Status Report — OOH Earth Lab", desc: "Lab engineering log — build register, revisions, pipeline, and roadmap.", image: OG_IMAGES.lab },
  "/lab/nft":       { title: "NFT Creator — OOH Earth Lab", desc: "3D subvertising card studio — slab casing, grading labels, artwork upload, AI generation, and Zora mint.", image: OG_IMAGES.nft },
  "/investor":      { title: "Investor Hub — OOH Earth", desc: "Investor hub — treasury, metrics, and capital allocation.", image: OG_IMAGES.campaign },
  "/console":       { title: "Investor Console — OOH Earth", desc: "Investor console — live metrics, portfolio, and capital tools.", image: OG_IMAGES.campaign },
  "/portal/investor": { title: "Investor Dashboard — OOH Earth", desc: "Detailed investor dashboard — positions, performance, and projections.", image: OG_IMAGES.campaign },
  "/portal/client": { title: "Client Portal — OOH Earth", desc: "Client portal — campaign management and reporting.", image: OG_IMAGES.campaign },
  "/login":         { title: "Sign In — OOH Earth", desc: "Sign in to your OOH Earth operative account.", image: OG_IMAGES.default },
  "/register":      { title: "Register — OOH Earth", desc: "Join the OOH Earth operative network.", image: OG_IMAGES.default },
  "/forgot-password": { title: "Reset Password — OOH Earth", desc: "Reset your OOH Earth account password.", image: OG_IMAGES.default },
  "/reset-password":  { title: "Reset Password — OOH Earth", desc: "Set a new password for your OOH Earth account.", image: OG_IMAGES.default },
};

// Dynamic-route fallbacks (prefix → meta)
const PREFIXES = [
  ["/store/",       META["/store"]],
  ["/blog/",        META["/blog"]],
  ["/location/",    META["/map"]],
  ["/bus-stop/",    META["/bus-stops"]],
  ["/category/",    META["/categories"]],
  ["/capital/",     META["/campaign"]],
  ["/agency/blog/", META["/agency/blog"]],
];

export function getRouteMeta(pathname) {
  if (META[pathname]) return META[pathname];
  for (const [prefix, meta] of PREFIXES) {
    if (pathname.startsWith(prefix)) return meta;
  }
  return { title: "OOH Earth", desc: D, image: OG_IMAGES.default };
}