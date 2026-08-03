// Access-key reference — sourced from oohearth.app/access-keys.
// Keyed housings apply principally to transit / bus-shelter units; billboard
// structures use direct physical access (no standardized key).

export const ACCESS_KEYS = {
  "4-way-utility": { label: "4-Way Utility Key", blurb: "4-way utility wrench — opens many transit-shelter and poster-housing cam locks." },
  cemusapin: { label: "Cemusapin", blurb: "Keyed pin lock fitted to Cemusa-style bus shelters." },
  circle: { label: "Circle", blurb: "Round barrel key, common on JCDecaux bus shelters." },
  "circle-set": { label: "Circle Set", blurb: "Multi-pin circle barrel variant for shelter housings." },
  "circle-wall": { label: "Circle Wall", blurb: "Wall-mounted circle barrel variant." },
  h60: { label: "H60", blurb: "6mm hex-key with a 4mm hole drilled in the bottom." },
  "jcd-superlock": { label: "JCD Superlock", blurb: "JCDecaux proprietary superlock cylinder." },
  "large-square": { label: "Large Square", blurb: "Square socket key for larger shelter housings." },
  "small-square": { label: "Small Square", blurb: "Square socket key for smaller shelter housings." },
  "t-handle": { label: "T-Handle", blurb: "T-handle wrench for rotary cam locks." },
  tx30: { label: "TX30", blurb: "Torx T30 key with a hole in the end — used on some JCDecaux/Cemusa shelters." },
  tri38: { label: "TRI38", blurb: "10mm triangular key common on continental European transit shelters and Adshel units." },
  none: { label: "No standardized key", blurb: "Direct access — no keyed housing on this unit." },
  unknown: { label: "Unidentified", blurb: "Access method not yet confirmed in the field." },
};

// Unit classes where a keyed housing is the norm (bus stops / transit shelters).
export const KEYED_TYPES = ["transit"];

export function keyInfo(slug) {
  return ACCESS_KEYS[slug] || ACCESS_KEYS.unknown;
}
export function isKeyedType(type) {
  return KEYED_TYPES.includes(type);
}