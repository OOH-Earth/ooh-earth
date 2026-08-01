// Movement-wide field estimate — the subvertising / adbusting movement since ~2012.
//
// IMPORTANT: these are ROUGH, deliberately conservative order-of-magnitude ESTIMATES
// of the GLOBAL movement's activity — NOT OOH Earth platform metrics. They are always
// rendered tagged "EST." and kept visually separate from our live, audited platform
// counts (which come from the tamper-resistant `fieldStats` function and stay honest —
// OOH Earth is a day-one platform still onboarding founding operatives and backers).
//
// Why 2012: the modern, coordinated wave of billboard subvertising scaled up when
// Brandalism ran its first UK takeover project in 2012. (Adbusters predates it — 1989.)
//
// Basis / provenance (scale, not a census — treat every figure as "~X+, estimated"):
//  • Brandalism (UK, 2012) — COP21 Paris 2015: ~600 subverts by ~80 artists from 19
//    countries; UK 2019: 400+ pieces; repeated campaigns since.
//  • Subvertisers International — umbrella coordinating local crews across many
//    countries via recurring global "Subvertising Days".
//  • Adfree Cities (UK) — network of ~25 local member groups.
//  • Les Déboulonneurs & Résistance à l'Agression Publicitaire (France) — ongoing
//    actions; landmark Déboulonneurs acquittal, 2013.
//  • Adbusters (since 1989) + independents (PublicAdCampaign/NYC, Vermibus, Hogre,
//    Bill Posters, Dr. D, and dozens of city crews).
//
// Method: (organized collectives/nodes) × (typical actions per year) over the period,
// plus major coordinated drops (100–600 pieces each), rounded down hard.

const MOVEMENT_SINCE = 2012;

export const MOVEMENT = {
  since: MOVEMENT_SINCE,
  get years() {
    return Math.max(0, new Date().getFullYear() - MOVEMENT_SINCE);
  },
  subvertisers: 5000,   // ~5,000+ active subverters worldwide (est.)
  interventions: 50000, // ~50,000+ documented / reported interventions since 2012 (est.)
  collectives: 40,      // ~40+ organized groups / nodes (est.)
  countries: 25,        // ~25+ countries with documented actions (est.)
};

// Shown so the platform's early-stage status is never mistaken for movement scale.
export const PLATFORM_STATUS = "EARLY ACCESS · FOUNDING BACKERS SOUGHT";

export const MOVEMENT_NOTE =
  "Rough movement-wide estimate of global subvertising activity since 2012 " +
  "(Brandalism, Subvertisers Intl, Adfree Cities, Les Déboulonneurs, Adbusters, " +
  "independents). Estimate, not a census — and not OOH Earth platform metrics.";

// Compact "5K" / "50K" formatting for tickers.
export const fmtK = (n) => (n >= 1000 ? `${Math.round(n / 1000)}K` : String(n));
