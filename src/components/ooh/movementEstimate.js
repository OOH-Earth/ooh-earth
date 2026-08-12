// Movement-wide field estimate — the subvertising / adbusting movement since ~2012.
//
// IMPORTANT: these are ROUGH, deliberately conservative order-of-magnitude ESTIMATES
// of the GLOBAL movement's activity — NOT OOH Earth platform metrics. They are always
// rendered tagged "EST." and kept visually separate from our live, audited platform
// counts (from the tamper-resistant `fieldStats` function). OOH Earth is a day-one
// platform still onboarding founding operatives and backers — that stays explicit.
//
// Why 2012: the modern, coordinated wave of billboard subvertising scaled up when
// Brandalism formed in the UK in 2012. (Adbusters predates it — 1989.)
//
// VERIFIED ANCHORS (see MOVEMENT_ANCHORS below — all sourced):
//  • Brandalism (UK, 2012): first project subverted 30+ billboards across 5 UK cities
//    (25 artists, 8 countries). COP21 Paris 2015: 82 artists from 19 countries,
//    ~600 subverts in a single action. [BBC, Brandalism, Colossal]
//  • Adfree Cities (UK, founded 2017): national network of local ad-block groups —
//    Bristol, Leeds, Norwich, Cardiff, Exeter, and two in London. [Adfree Cities]
//  • Subvertisers International: global umbrella coordinating local crews across many
//    countries via recurring "Subvertising Days".
//  • UK digital ad frames have ~trebled since 2015 (Route Research) — the surface we
//    map keeps growing.
//
// HOW THE ESTIMATES ARE DERIVED (order of magnitude, not a census — under-claimed):
//  • collectives ~30+  : Adfree Cities' ~8–10 UK groups + Brandalism + Subvertisers
//    International member crews across ~20 countries + French groups (Déboulonneurs,
//    RAP) + independents. Conservative floor.
//  • countries  ~20+   : 19 countries in the COP21 action alone; more across the SI
//    network. Rounded down.
//  • subverters ~3K+   : cumulative people who've taken part since 2012 — 82 artists +
//    100+ helpers in ONE action, times many actions/groups over the period. Floor.
//  • interventions ~25K+: documented major campaigns run to the low thousands; the
//    figure extrapolates undocumented individual actions across the global network
//    over the period. Explicitly an estimate.

const MOVEMENT_SINCE = 2012;

export const MOVEMENT = {
  since: MOVEMENT_SINCE,
  get years() {
    return Math.max(0, new Date().getFullYear() - MOVEMENT_SINCE);
  },
  subvertisers: 3000, // ~3,000+ people who've taken part worldwide (est.)
  interventions: 25000, // ~25,000+ documented / reported interventions since 2012 (est.)
  collectives: 30, // ~30+ organized groups / nodes (est.)
  countries: 20, // ~20+ countries with documented actions (est.)
};

// Shown so the platform's early-stage status is never mistaken for movement scale.
export const PLATFORM_STATUS = 'EARLY ACCESS · FOUNDING BACKERS SOUGHT';

export const MOVEMENT_NOTE =
  'Rough movement-wide estimate of global subvertising activity since 2012 ' +
  '(Brandalism, Subvertisers Intl, Adfree Cities, Les Déboulonneurs, Adbusters, ' +
  'independents). Estimate, not a census — and not OOH Earth platform metrics.';

// Sourced milestones used to ground the estimate on investor / campaign pages.
export const MOVEMENT_ANCHORS = [
  {
    year: '2012',
    text: 'Brandalism forms in the UK — first project subverts 30+ billboards across 5 cities.',
    source: 'Brandalism / BBC',
  },
  {
    year: '2015',
    text: 'COP21 Paris: 82 artists from 19 countries install ~600 subverts in a single action.',
    source: 'BBC / Brandalism',
  },
  {
    year: '2017',
    text: 'Adfree Cities founded — a UK network of local ad-block groups from Bristol to London.',
    source: 'Adfree Cities',
  },
  {
    year: 'now',
    text: 'UK digital ad frames have roughly trebled since 2015 — the surface to map keeps growing.',
    source: 'Route Research',
  },
];

// Compact "3K" / "25K" formatting for tickers.
export const fmtK = (n) => (n >= 1000 ? `${Math.round(n / 1000)}K` : String(n));
