// Genesis Token presets — $OOHEX fungible community/utility token.
// Distinct from the Genesis Chip (physical, non-fungible cultural artifact).
// Token = liquid, fungible, governance + rewards currency for the OOH Earth commons.

export const TOKEN_SPECS = [
  ["Symbol", "$OOHEX"],
  ["Chain", "Base · ERC-20"],
  ["Standard", "Fungible · 18 decimals"],
  ["Total supply", "1,000,000,000 fixed"],
  ["Initial circ.", "350,000,000 (35%)"],
  ["Mint", "No future mint · hard cap"],
  ["Burn", "1% of each transfer → burn"],
  ["Bridge", "Base ↔ Solana (Wormhole)"],
  ["Treasury", "Multi-sig · 3/5 operatives"],
];

export const TOKEN_DISTRIBUTION = [
  { label: "Treasury",       pct: 40, color: "#EDFF00", desc: "Field mapping, legal defense, open-source tooling, grants" },
  { label: "Field rewards",  pct: 20, color: "#FF5C00", desc: "Proof-of-presence mining — operatives earn for verified busts" },
  { label: "Liquidity",      pct: 15, color: "#1F51FF", desc: "DEX pools (Uniswap Base, Raydium Solana) — stable trading" },
  { label: "Team / advisors",pct: 10, color: "#888888", desc: "4-year vest, 1-year cliff — locked contract" },
  { label: "Community drop", pct: 10, color: "#39FF14", desc: "Airdrop to chip holders + early operatives — 1:1 per chip" },
  { label: "Reserve",        pct: 5,  color: "#B2B2B2", desc: "Emergency DAO buffer — released by vote only" },
];

export const TOKEN_UTILITY = [
  { icon: "Reward",   title: "Field rewards",      desc: "Operatives earn $OOHEX for verified busts, location reports, and map corrections. Proof-of-presence = mining." },
  { icon: "Vote",     title: "Governance",         desc: "1 token = 1 vote in treasury proposals. Quadratic voting caps whale influence; chip holders get a separate proof-of-presence vote." },
  { icon: "Stake",    title: "Staking yields",     desc: "Stake $OOHEX to earn a share of the 2.5% secondary royalty stream from chip resales. Stakers govern the treasury allocation." },
  { icon: "Bounty",   title: "Bounties",           desc: "Anyone posts a bounty in $OOHEX for a specific location or brand audit. First operative to verify claims the pool." },
  { icon: "Access",  title: "Lab access",          desc: "Holding a minimum balance unlocks premium Lab tools — AI mint generation, high-res exports, NFC claim priority." },
  { icon: "Tip",     title: "Tipping",            desc: "Tip operatives directly for high-quality field documentation. Zero-friction, on-chain, public record." },
];

export const TOKEN_VS_CHIP = [
  { aspect: "Type",        token: "Fungible (ERC-20)",        chip: "Non-fungible (ERC-721 twin)" },
  { aspect: "Form",        token: "Digital · liquid",        chip: "Physical 64mm metal + on-chain twin" },
  { aspect: "Supply",      token: "1,000,000,000 fixed",     chip: "6,400 hard cap" },
  { aspect: "Divisibility",token: "Fractional · 18 decimals",chip: "Whole · one object, one twin" },
  { aspect: "Acquisition", token: "Buy on DEX · earn rewards", chip: "Mint from OOH Earth · claim via NFC" },
  { aspect: "Governance", token: "1 token = 1 vote (quadratic)", chip: "1 chip = 1 presence vote (fixed)" },
  { aspect: "Value floor", token: "DEX liquidity + burn",    chip: "Production cost ($18–28) + scarcity" },
  { aspect: "Royalty",     token: "—",                       chip: "2.5% creator fee → treasury" },
  { aspect: "Role",        token: "Community currency + rewards", chip: "Cultural artifact + provenance" },
];

export const TOKEN_FLOW = [
  { step: "01", label: "Earn",   desc: "Operative verifies a bust → smart contract mints $OOHEX reward from the field-rewards pool" },
  { step: "02", label: "Trade",  desc: "$OOHEX trades on Base/Solana DEXs — 1% burn per transfer makes it deflationary" },
  { step: "03", label: "Govern", desc: "Token holders vote on treasury spending — which cities get mapped, which legal cases funded" },
  { step: "04", label: "Stake",  desc: "Stake $OOHEX → earn from chip resale royalties → fund more field work → more busts → more rewards" },
];

export const REWARD_TIERS = [
  { action: "Verified location report",  reward: "500 $OOHEX" },
  { action: "Digital bust verified",       reward: "1,000 $OOHEX" },
  { action: "Physical bust verified",      reward: "2,500 $OOHEX" },
  { action: "Map correction accepted",     reward: "200 $OOHEX" },
  { action: "Access-key documentation",    reward: "750 $OOHEX" },
  { action: "Bounty fulfilled",            reward: "Pool amount" },
];

// ── 3D chip spinner presets (casino-chip visual reference) ──
export const CHIP_RING_COLORS = [
  { id: "casino",  name: "Casino Red", hex: "#D32F2F" },
  { id: "ozone",   name: "Ozone",      hex: "#EDFF00" },
  { id: "flare",   name: "Flare",       hex: "#FF5C00" },
  { id: "signal",  name: "Signal Blue", hex: "#1F51FF" },
  { id: "black",   name: "Black",       hex: "#0a0a0a" },
  { id: "white",   name: "White",       hex: "#F1F1F1" },
];

export const CHIP_SPOT_COLORS = [
  { id: "bronze", name: "Bronze", hex: "#7D5A46" },
  { id: "gold",   name: "Gold",   hex: "#D4AF37" },
  { id: "white",  name: "White",  hex: "#F1F1F1" },
  { id: "ozone",  name: "Ozone",  hex: "#EDFF00" },
  { id: "black",  name: "Black",  hex: "#0a0a0a" },
];

export const CHIP_FIELD_COLORS = [
  { id: "black", name: "Black", hex: "#000000" },
  { id: "void",  name: "Void",  hex: "#0a0a0a" },
  { id: "navy",  name: "Navy",  hex: "#002554" },
  { id: "white", name: "White", hex: "#F1F1F1" },
];