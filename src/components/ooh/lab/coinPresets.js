// Genesis Coin presets — materials, editions, SDG alignment, specs, tokenomics.
// Aligned to UN cultural-artifact standards for the OOH Earth Genesis Coin.

export const TRIGRAM_TICKS = ["☲", "☷", "☱", "☰", "☵", "☴", "☶", "☳"];
export const EDGE_VERBS = ["MOVE", "MAP", "DISCOVER", "CREATE", "BUILD", "VERIFY", "SIGN", "CONNECT"];

export const COIN_MATERIALS = [
  { id: "brass",    name: "CNC Brass",         desc: "PVD antique finish",       color: 0xc9a860, metalness: 0.92, roughness: 0.22, hex: "#c9a860" },
  { id: "bronze",   name: "Lost-wax Bronze",   desc: "Sand-cast, hand-finished", color: 0x9c7a42, metalness: 0.88, roughness: 0.34, hex: "#9c7a42" },
  { id: "titanium", name: "Grade-5 Titanium", desc: "Anodized aerospace alloy", color: 0x9a9a9a, metalness: 0.72, roughness: 0.45, hex: "#9a9a9a" },
  { id: "gold",     name: "24k Gold Plated",   desc: "Electroplated over brass", color: 0xd4af37, metalness: 0.98, roughness: 0.12, hex: "#d4af37" },
  { id: "patina",   name: "Patina Bronze",     desc: "Naturally aged verdigris", color: 0x5a8c6e, metalness: 0.55, roughness: 0.58, hex: "#5a8c6e" },
  { id: "steel",    name: "Blackened Steel",   desc: "Oxide-blued, matte",        color: 0x525252, metalness: 0.85, roughness: 0.30, hex: "#525252" },
];

export const COIN_EDITIONS = [
  { id: "FOUNDING EDITION", name: "Founding Edition", desc: "First 1,000 · numbered 0001–1000", rarity: "1,000 minted", tier: "primary" },
  { id: "CITY EDITION",     name: "City Edition",     desc: "One per UNESCO Creative City",       rarity: "640 minted",  tier: "secondary" },
  { id: "ARTIST PROOF",     name: "Artist Proof",     desc: "Pre-production strikings, marked AP", rarity: "64 minted",   tier: "rare" },
];

export const SDG_ALIGNMENTS = [
  { num: 11, name: "Sustainable Cities",        desc: "Reverse face engraves the city as network — infrastructure over borders." },
  { num: 16, name: "Peace & Justice",           desc: "Proof-of-presence for field operatives documenting public-space offenses." },
  { num: 17, name: "Partnerships",             desc: "1:1 on-chain twin binds physical artifact to a wallet-native DAO." },
];

export const COIN_SPECS = [
  ["Diameter", "64mm Ø"],
  ["Thickness", "3.2mm"],
  ["Weight", "68g (brass)"],
  ["Edge", "Reeded · 64 ridges"],
  ["Strike", "2-sided · relief engraved"],
  ["NFC", "Embedded NTAG216"],
  ["Finish", "PVD antique"],
  ["Tolerance", "±0.05mm CNC"],
];

export const COIN_TOKENOMICS = [
  ["Supply", "6,400 physical · 1:1 on-chain twin"],
  ["Editions", "64 series × 100 (one per hexagram)"],
  ["Chain", "Base · ERC-721 + NFC claim"],
  ["Claim", "Tap coin → sign → twin binds to wallet"],
  ["Utility", "DAO weight ×1 · proof-of-presence"],
  ["Royalty", "2.5% creator fee on secondary"],
];

// Deterministic city network (LCG) — used by both the 3D reverse texture
// and any 2D fallback. Same algorithm as the original Genesis Coin page.
export function seededNetwork(num) {
  const rand = (seed) => { let x = seed; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
  const r = rand(num + 7);
  const nodes = Array.from({ length: 22 }, () => {
    const a = r() * Math.PI * 2, d = 0.15 + r() * 0.32;
    return { x: 0.5 + d * Math.cos(a), y: 0.5 + d * Math.sin(a), s: r() > 0.75 ? 0.014 : 0.009 };
  });
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    const j = (i + 1 + Math.floor(r() * 4)) % nodes.length;
    edges.push({ a: nodes[i], b: nodes[j] });
  }
  return { nodes, edges };
}