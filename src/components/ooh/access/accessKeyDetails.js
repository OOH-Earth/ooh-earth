// Access-key detail data — about copy, material, product photo, and a buy
// link per key type. Sits on top of accessKeys.js (label + blurb) so the
// bus-stop and location pages keep using the slim base object.
import { ACCESS_KEYS } from "@/components/ooh/accessKeys";
import { BUS_STOPS, LONDON_SHELTER_GUESS } from "@/components/ooh/busStops";

// Display order matches the oohearth.app/access-keys index grid.
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
];

const IMG = {
  "4-way-utility":
    "https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/b8cf7c5fe_4WayUtilitiesKey-FireandRescueTools.webp",
  "t-handle":
    "https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/8d3615bb9_e1d41ukp158zy0zc9lpb2k7mza6z.png",
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
};

export const ACCESS_KEY_DETAILS = {
  "4-way-utility": {
    about:
      "A 4 way utility key is only used on the very old bus stops (UK and Europe). You will need the square key for the first lock on old bus stops. Buy a 4 way key that is metal not plastic. This key is used for gas & electric meter doors. Very common.",
    material: "Aluminium",
  },
  cemusapin: {
    about:
      "Keyed pin lock fitted to Cemusa-style bus shelters. Turn the pin to release the poster housing — common on older Cemusa units across mainland Europe and some UK estates.",
    material: "Aluminium",
  },
  circle: {
    about:
      "Round barrel key, common on JCDecaux bus shelters. One of the most frequently encountered shelter keys in London — a short barrel turn opens the poster frame.",
    material: "Aluminium",
  },
  "circle-set": {
    about:
      "Multi-pin circle barrel variant for shelter housings — a paired set rather than a single barrel, used on dual-lock JCDecaux frames.",
    material: "Aluminium",
  },
  "circle-wall": {
    about:
      "Wall-mounted circle barrel variant, fixed to the shelter fascia rather than the poster housing. Same barrel profile as the Circle, mounted flush.",
    material: "Aluminium",
  },
  h60: {
    about:
      "The H60 is a 6mm wide hex-key with a 4mm hole drilled in the bottom to make it more secure. This is to reduce vandalism, apparently. These are very common and easy to buy so they really didn't think it through properly did they?",
    material: "Aluminium",
  },
  "jcd-superlock": {
    about:
      "JCDecaux proprietary superlock cylinder — a higher-security barrel found on newer JCDecaux shelters. Less common than the Circle but spreading across refitted units.",
    material: "Aluminium",
  },
  "large-square": {
    about:
      "Square socket key for larger shelter housings — the bigger of the two common square profiles, often paired with the 4-way on older transit units.",
    material: "Aluminium",
  },
  "small-square": {
    about:
      "Square socket key for smaller shelter housings — the smaller of the two common square profiles, used on compact poster cases and some pole fittings.",
    material: "Aluminium",
  },
  "t-handle": {
    about:
      "13mm T-Handle Socket Wrench. This key is sometimes needed to access 'lollipop' ad spaces in city centres. It is a socket type key with an 11mm width. We recommend a 'T Handle' shape with a long bar. This makes it very easy to open lollipop ad spaces.",
    material: "Aluminium",
  },
};

export function keyDetail(slug) {
  const base = ACCESS_KEYS[slug] || ACCESS_KEYS.unknown;
  const d = ACCESS_KEY_DETAILS[slug] || {};
  return {
    ...base,
    ...d,
    image: IMG[slug] || null,
    buyUrl: BUY[slug] || null,
    slug,
  };
}

// Bus stops whose probable key matches this slug. London shelters are
// typically JCDecaux / Clear Channel Adshel units — the source map records no
// per-stop key, so Circle + JCD Superlock are the educated guess for every
// stop. Other keys have no confirmed matches yet.
export function stopsForKey(slug) {
  if (LONDON_SHELTER_GUESS.slugs.includes(slug)) return BUS_STOPS;
  return [];
}