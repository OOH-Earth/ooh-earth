// Access-key detail data — about copy, material, product photo, buy link,
// provided SVG icon, and the countries where each key is commonly used.
// Sits on top of accessKeys.js (label + blurb) so the bus-stop and location
// pages keep using the slim base object.
import { ACCESS_KEYS } from "@/components/ooh/accessKeys";
import { BUS_STOPS, LONDON_SHELTER_GUESS } from "@/components/ooh/busStops";

const BASE = "https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5";

// Display order matches the oohearth.app/access-keys index grid + the two
// extra illustrated keys (TX30, TRI38) provided as SVGs.
export const ACCESS_KEY_ORDER = [
  "4-way-utility",
  "cemusapin",
  "circle",
  "circle-set",
  "circle-wall",
  "h60",
  "jcd-superlock",
  "large-square",
  "small-square",
  "t-handle",
  "tx30",
  "tri38",
];

// Provided icon SVGs (black-on-transparent) — rendered on a light specimen
// chip so the art reads on the dark theme.
const ICON_SVG = {
  "4-way-utility": `${BASE}/cd4039dea_4-way-utility-key-LargeSquare.svg`,
  cemusapin: `${BASE}/80fc3bbfe_Cemusapin.svg`,
  circle: `${BASE}/9cb86baab_Circle.svg`,
  "circle-set": `${BASE}/d7a32bfa9_Circle-4WayUtilityKey.svg`,
  "circle-wall": `${BASE}/3620cb0b1_Wall.svg`,
  h60: `${BASE}/94a8ad6cf_H60.svg`,
  "jcd-superlock": `${BASE}/b8dda129a_JCD-Superlock.svg`,
  "large-square": `${BASE}/39ef295f6_4-way-utility-key-LargeSquare1.svg`,
  "small-square": `${BASE}/24abf89fe_4-way-utility-key-SmallSquare1.svg`,
  "t-handle": `${BASE}/70868f0f0_T-Handle.svg`,
  tx30: `${BASE}/babd2655c_TX30.svg`,
  tri38: `${BASE}/e161f701b_TRI38.svg`,
};

// "How does it look?" — provided illustration variant where available, else
// the icon SVG, else a product photo.
const LOOK = {
  "4-way-utility": `${BASE}/b8cf7c5fe_4WayUtilitiesKey-FireandRescueTools.webp`,
  cemusapin: `${BASE}/c6d4fab79_Cemusapin1.svg`,
  circle: `${BASE}/9cb86baab_Circle.svg`,
  "circle-set": `${BASE}/d7a32bfa9_Circle-4WayUtilityKey.svg`,
  "circle-wall": `${BASE}/3620cb0b1_Wall.svg`,
  h60: `${BASE}/67469222c_H601.svg`,
  "jcd-superlock": `${BASE}/b8dda129a_JCD-Superlock.svg`,
  "large-square": `${BASE}/39ef295f6_4-way-utility-key-LargeSquare1.svg`,
  "small-square": `${BASE}/24abf89fe_4-way-utility-key-SmallSquare1.svg`,
  "t-handle": `${BASE}/8d3615bb9_e1d41ukp158zy0zc9lpb2k7mza6z.png`,
  tx30: `${BASE}/a6bffd673_TX301.svg`,
  tri38: `${BASE}/e161f701b_TRI38.svg`,
};

const BUY = {
  "4-way-utility": "https://www.amazon.co.uk/s?k=4+way+utility+key",
  cemusapin: "https://www.amazon.co.uk/s?k=cemusapin+bus+shelter+key",
  circle: "https://www.amazon.co.uk/s?k=circle+barrel+key+bus+stop",
  "circle-set": "https://www.amazon.co.uk/s?k=circle+set+bus+shelter+key",
  "circle-wall": "https://www.amazon.co.uk/s?k=circle+wall+bus+key",
  h60: "https://www.amazon.co.uk/s?k=H60+hex+key+with+hole",
  "jcd-superlock": "https://www.amazon.co.uk/s?k=jcdecaux+superlock+key",
  "large-square": "https://www.amazon.co.uk/s?k=large+square+socket+key+bus",
  "small-square": "https://www.amazon.co.uk/s?k=small+square+socket+key+bus",
  "t-handle": "https://www.amazon.co.uk/s?k=T+handle+socket+wrench+13mm",
  tx30: "https://www.amazon.co.uk/s?k=torx+T30+security+key+with+hole",
  tri38: "https://www.amazon.co.uk/s?k=triangular+10mm+bus+key",
};

export const ACCESS_KEY_DETAILS = {
  "4-way-utility": {
    about:
      "A 4 way utility key is only used on the very old bus stops (UK and Europe). You will need the square key for the first lock on old bus stops. Buy a 4 way key that is metal not plastic. This key is used for gas & electric meter doors. Very common.",
    material: "Aluminium",
    countries: ["United Kingdom", "Germany", "Australia"],
  },
  cemusapin: {
    about:
      "Keyed pin lock fitted to Cemusa-style bus shelters. Turn the pin to release the poster housing — common on older Cemusa units across mainland Europe and some UK estates.",
    material: "Aluminium",
    countries: ["Spain", "France", "Italy"],
  },
  circle: {
    about:
      "Round barrel key, common on JCDecaux bus shelters. One of the most frequently encountered shelter keys in London — a short barrel turn opens the poster frame.",
    material: "Aluminium",
    countries: ["United Kingdom", "Ireland", "France"],
  },
  "circle-set": {
    about:
      "Multi-pin circle barrel variant for shelter housings — a paired set rather than a single barrel, used on dual-lock JCDecaux frames.",
    material: "Aluminium",
    countries: ["United Kingdom", "France"],
  },
  "circle-wall": {
    about:
      "Wall-mounted circle barrel variant, fixed to the shelter fascia rather than the poster housing. Same barrel profile as the Circle, mounted flush.",
    material: "Aluminium",
    countries: ["United Kingdom", "Germany"],
  },
  h60: {
    about:
      "The H60 is a 6mm wide hex-key with a 4mm hole drilled in the bottom to make it more secure. This is to reduce vandalism, apparently. These are very common and easy to buy so they really didn't think it through properly did they?",
    material: "Aluminium",
    countries: ["United Kingdom", "France", "Germany"],
  },
  "jcd-superlock": {
    about:
      "JCDecaux proprietary superlock cylinder — a higher-security barrel found on newer JCDecaux shelters. Less common than the Circle but spreading across refitted units.",
    material: "Aluminium",
    countries: ["United Kingdom", "France", "Spain"],
  },
  "large-square": {
    about:
      "Square socket key for larger shelter housings — the bigger of the two common square profiles, often paired with the 4-way on older transit units.",
    material: "Aluminium",
    countries: ["United Kingdom", "Germany"],
  },
  "small-square": {
    about:
      "Square socket key for smaller shelter housings — the smaller of the two common square profiles, used on compact poster cases and some pole fittings.",
    material: "Aluminium",
    countries: ["United Kingdom", "Germany"],
  },
  "t-handle": {
    about:
      "13mm T-Handle Socket Wrench. This key is sometimes needed to access 'lollipop' ad spaces in city centres. It is a socket type key with an 11mm width. We recommend a 'T Handle' shape with a long bar. This makes it very easy to open lollipop ad spaces.",
    material: "Aluminium",
    countries: ["United Kingdom", "United States", "Australia"],
  },
  tx30: {
    about:
      "The T30 (TX30) is a Torx key. They come in a variety of sizes, however you only need the T30. Make sure it has the hole in the end and is of good quality, as the key will wear easily. A long handle is better.",
    material: "Aluminium",
    countries: ["United Kingdom", "France", "Spain", "Germany", "Australia"],
  },
  tri38: {
    about:
      "A 10mm triangular key (TRI38) used on many continental European transit shelters and some Adshel units. Simple, cheap and widely available — one of the most common open-access triangle profiles.",
    material: "Aluminium",
    countries: ["Germany", "Netherlands", "Belgium", "France", "Australia"],
  },
};

export const ALL_COUNTRIES = Array.from(
  new Set(Object.values(ACCESS_KEY_DETAILS).flatMap((d) => d.countries || []))
).sort();

export function keyDetail(slug) {
  const base = ACCESS_KEYS[slug] || ACCESS_KEYS.unknown;
  const d = ACCESS_KEY_DETAILS[slug] || {};
  return {
    ...base,
    ...d,
    iconSvg: ICON_SVG[slug] || null,
    lookImage: LOOK[slug] || null,
    buyUrl: BUY[slug] || null,
    slug,
  };
}

// Bus stops whose probable key matches this slug. London shelters are
// typically JCDecaux / Clear Channel Adshel units — the source map records no
// per-stop key, so Circle + JCD Superlock are the educated guess for every
// stop. Other keys have no confirmed mapped locations yet.
export function stopsForKey(slug) {
  if (LONDON_SHELTER_GUESS.slugs.includes(slug)) return BUS_STOPS;
  return [];
}