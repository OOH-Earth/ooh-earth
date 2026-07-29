// Content for the four capital lead pages (/capital/:slug).
// Each is a funder-facing landing page tuned to one investor class.
// Shared traction + valuation live in CapitalLead.jsx; per-funder angle here.

export const CAPITAL_ORDER = ["impact-grants", "philanthropic", "retro-pgf", "civic-tech"];

export const CAPITAL_LEADS = {
  "impact-grants": {
    slug: "impact-grants",
    tag: "Impact Grants",
    name: "Fund the evidence base.",
    sub: "OOH Earth turns unregulated public-space advertising into structured, citable evidence — the kind planning panels, councils, and cultural-rights bodies can act on.",
    instrument: "Grant",
    angle: [
      "Directly advances SDG 11.7 (safe, inclusive public space) and 16.7 (responsive, inclusive decision-making).",
      "Grounded in UN report A/69/286 on advertising and cultural rights, plus a live international precedent library.",
      "Outcomes are measurable: sites documented, objections filed, planning decisions influenced.",
    ],
    unlocks: [
      { h: "Evidence at scale", p: "Fund the map import + verification pipeline to move from ~12k beta records to a diligence-grade dataset." },
      { h: "Community toolkits", p: "Objection generator, field guides, and chapter kits so residents can act on the evidence." },
      { h: "Precedent & policy", p: "Turn documented cases into council submissions and policy briefs with citable outcomes." },
    ],
    targets: "Civic & urban-space foundations · SDG 11.7 / 16.7 programmes · cultural-rights and public-realm grantmakers",
  },
  "philanthropic": {
    slug: "philanthropic",
    tag: "Philanthropic Capital",
    name: "Back a movement, not a cap table.",
    sub: "A founder-led civic institution with the platform already built. Your capital compounds reach — it doesn't buy equity.",
    instrument: "Philanthropic gift / mission-related investment",
    angle: [
      "The hard part is done: a working platform worth £70k–150k to replace, built for low thousands.",
      "Zero-VC, copyleft, community-governed — mission integrity is structural, not promised.",
      "Every pound moves reach: waitlist activation, ambassador network, Global South chapters.",
    ],
    unlocks: [
      { h: "Activate the waitlist", p: "Convert ~2,000 waiting supporters into active operatives with onboarding and field kits." },
      { h: "Global South chapters", p: "Stand up city chapters where public-space enclosure hits hardest — per the SDGs." },
      { h: "Founder runway", p: "Modest runway to run live ops full-time through launch and the first campaigns." },
    ],
    targets: "Family offices · values-aligned HNW donors · degrowth & environmental philanthropy",
  },
  "retro-pgf": {
    slug: "retro-pgf",
    tag: "Ecosystem / Retro Public Goods",
    name: "Open civic infrastructure, retroactively fundable.",
    sub: "Copyleft, on-chain-native, and already shipping — OOH Earth is a public good that did the work before asking for the reward.",
    instrument: "Retro-PGF / ecosystem grant",
    angle: [
      "Copyleft and open by design — the outputs are a commons, not a moat.",
      "On-chain-native: evidence minting and a community treasury on Base.",
      "Impact is already demonstrable — the ideal profile for retroactive funding.",
    ],
    unlocks: [
      { h: "Harden the on-chain rails", p: "Finish evidence minting + treasury routing so contributions are transparent and auditable." },
      { h: "Open the dataset", p: "Publish the documented-sites dataset as reusable public infrastructure." },
      { h: "Reward contributors", p: "Route retro funding to the ambassadors and operatives who built the evidence base." },
    ],
    targets: "Retro-PGF rounds · Gitcoin-style ecosystems · Base / on-chain public-goods pools",
  },
  "civic-tech": {
    slug: "civic-tech",
    tag: "Civic-Tech Backers",
    name: "A working platform, not a pitch deck.",
    sub: "~33 routes, live payments, dual mapping, AR, an offline PWA — a flagship civic-tech case study you can point to today.",
    instrument: "Grant / sponsorship / accelerator",
    angle: [
      "It already runs: a real PWA with real routes and a live ops spine, not a prototype.",
      "Extreme capital efficiency — six-figure replacement value built for low thousands.",
      "A credible flagship for any civic-tech portfolio or platform-sponsorship programme.",
    ],
    unlocks: [
      { h: "Ship to production", p: "Fund the hardening sweep + HTTPS deploy that unblocks camera capture and NFC." },
      { h: "Scale live ops", p: "Automation spine (n8n) and chapter tooling to run distributed operations." },
      { h: "Case study & co-marketing", p: "A documented build story platforms can feature — value flows both ways." },
    ],
    targets: "Civic-tech accelerators · gov-tech / open-data funds · platform-sponsorship programmes",
  },
};
