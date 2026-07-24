import { Link } from "react-router-dom";

const STEPS = [
  {
    n: "01",
    title: "Onboard & orient",
    to: "/",
    route: "Home",
    body: "Land on the orbital dashboard. Read the mandate, scan the live data feed, and open the Menu (top-right) for the full sitemap. Toggle theme (dark / light / matrix) and haptics to your preference.",
    actions: ["Read mandate", "Open sitemap", "Theme toggle", "Command center"],
  },
  {
    n: "02",
    title: "Explore the Atlas",
    to: "/map",
    route: "Maps",
    body: "Switch between 2D map and 3D globe. Filter markers by type and status, tap any pin for the offense card, and claim a lead to adopt a landmark for intervention.",
    actions: ["2D / 3D globe", "Filter markers", "Claim a lead", "GeoJSON export"],
  },
  {
    n: "03",
    title: "Spot, identify & report",
    to: "/report",
    route: "Report",
    body: "Capture a photo of an advertising offense, geo-tag it, categorize the offense and submit. Captures queue offline-first and auto-sync when connectivity returns — watch the Sync badge.",
    actions: ["Capture photo", "Geo-tag", "Offline queue", "Sync badge"],
  },
  {
    n: "04",
    title: "Run field tools",
    to: "/ar",
    route: "AR Lens",
    body: "Overlay counter-narrative AR layers in situ. Then run the TrueCost scanner on a product barcode to expose full social/environmental cost, and Trash ID on dumped waste to name the offending brands.",
    actions: ["AR overlay", "TrueCost scan", "Trash ID", "Accountability score"],
  },
  {
    n: "05",
    title: "In-Home digital adbusting",
    to: "/inhome",
    route: "In-Home",
    body: "Track digital-surface busts across metaverse, browser, social and streaming. Switch between 3D scene, signal constellation and grid views, log a new bust, and watch the operative roster.",
    actions: ["Log a bust", "Signal constellation", "3D scene", "Operative roster"],
  },
  {
    n: "06",
    title: "Go on-chain",
    to: "/zora",
    route: "Zora",
    body: "Survey the Zora coin grid and market panel. Connect a wallet (Phantom / Solana or EVM) from the Campaign or Support page to participate in the crypto treasury flow.",
    actions: ["Zora coin grid", "Market panel", "Connect wallet", "Treasury watch"],
  },
  {
    n: "07",
    title: "Fund the campaign",
    to: "/campaign",
    route: "Fund",
    body: "Back the offensive via Stripe checkout, copy a crypto treasury address, or leave a funding lead. Every contribution is logged on the public record and tracked by the live DonationWatcher.",
    actions: ["Stripe checkout", "Crypto treasury", "Funding lead", "DonationWatcher"],
  },
  {
    n: "08",
    title: "Operate the dashboard",
    to: "/dashboard",
    route: "Dashboard",
    body: "Admins log in to triage pending reports by photo/source evidence, manage operatives and lead claims, and read live field stats. The dashboard auto-sorts pending items for fastest verification.",
    actions: ["Triage queue", "Operative mgmt", "Lead claims", "Field stats"],
  },
  {
    n: "09",
    title: "Build with the kit",
    to: "/kit",
    route: "UI Kit",
    body: "Contributors open the open-source brand & UI kit to copy color tokens, type styles, components and theme modes into Framer, Tailwind or plain CSS — extend the resistance.",
    actions: ["Copy tokens", "Type scale", "Components", "Theme modes"],
  },
];

export default function JourneySteps() {
  return (
    <ol className="space-y-2">
      {STEPS.map((s) => (
        <li key={s.n} className="border border-slate2/60 bg-card p-4 transition-colors hover:border-ozone/40">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[9px] tabular text-dim/80">STEP {s.n}</span>
            <Link to={s.to} className="font-mono text-[10px] uppercase tracking-[0.25em] text-ozone transition-colors hover:text-flare">
              {s.route} →
            </Link>
          </div>
          <h3 className="mt-1.5 font-display text-lg font-bold tracking-[-0.02em] text-silver">{s.title}</h3>
          <p className="mt-1.5 font-body text-sm leading-[1.55] text-darkgray">{s.body}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {s.actions.map((a) => (
              <li key={a} className="border border-slate2 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-silver/85">{a}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}