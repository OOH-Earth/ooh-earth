// On-chain resistance coin configuration.
// Swap addresses for real oohearth campaign/creator coin addresses when minted.

export const PRIMARY_COIN = {
  addr: "BwVYGpW3wqe6UZWoLDj4UbxXc94n813MSJcDNePApump", // $OUTOFHELL · pump.fun · Solana
  symbol: "$OUTOFHELL",
  name: "Out Of Hell",
  chartUrl: "https://pump.fun/BwVYGpW3wqe6UZWoLDj4UbxXc94n813MSJcDNePApump",
  note: "pump.fun · Solana",
};

// Live Zora network feed — real Base-chain content coins (sample feed).
// Replace with oohearth creator/content coin addresses when live.
export const ZORA_COINS = [
  { addr: "0x5b48166eeb1321f6c09ee148b59a1eaede13fc81", symbol: "FLOWER", name: "smell the flower", zora: "https://zora.co/coin/base:0x5b48166eeb1321f6c09ee148b59a1eaede13fc81" },
  { addr: "0xcac466f9520f87c429fa43676d6f6c8fc94c0f71", symbol: "PIRULITO", name: "pirulito", zora: "https://zora.co/coin/base:0xcac466f9520f87c429fa43676d6f6c8fc94c0f71" },
  { addr: "0x9f0649369fb58f521722c1b78dc867283a603acf", symbol: "FLORES", name: "flores", zora: "https://zora.co/coin/base:0x9f0649369fb58f521722c1b78dc867283a603acf" },
  { addr: "0xcdcb1c89b8bee6255b69fe7a3500bf26470b5413", symbol: "CAMERA", name: "câmera", zora: "https://zora.co/coin/base:0xcdcb1c89b8bee6255b69fe7a3500bf26470b5413" },
];

export const fmtPrice = (v) =>
  v == null ? "--"
  : v < 0.001 ? "$" + v.toFixed(8)
  : v < 0.01 ? "$" + v.toFixed(6)
  : v < 1 ? "$" + v.toFixed(4)
  : "$" + v.toFixed(2);

export const fmtCompact = (v) => {
  if (v == null) return "--";
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return "$" + (v / 1e3).toFixed(1) + "K";
  return "$" + v.toFixed(0);
};