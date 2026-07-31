// Live on-chain activity watcher for the OOH treasury wallets.
// Public read-only — no auth required (public app). Returns recent signatures/txs.
//
// F14 hardening: the three chains are fetched independently and aggregated with
// Promise.allSettled, so one dependency hiccup (Solana RPC, Blockchair, or the
// Polygon RPC / CoinGecko) degrades only that chain's data and is reported via a
// per-chain `status` field — instead of failing the whole response.
const SOL_TREASURY = "EusJyb6R7vZEnmCLoJXBXui6inozZguAFjkKJNGEaafx";
const ETH_TREASURY = "0xe286EB19b5a64DC41Ca76f58D8fd6d7F114C1c12".toLowerCase();

async function fetchSol() {
  const r = await fetch("https://api.mainnet-beta.solana.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getSignaturesForAddress",
      params: [SOL_TREASURY, { limit: 6 }],
    }),
  });
  if (!r.ok) throw new Error(`Solana RPC ${r.status}`);
  const j = await r.json();
  return (j.result || []).map((s) => ({
    chain: "SOL",
    hash: s.signature,
    time: s.blockTime ? s.blockTime * 1000 : null,
    memo: s.memo || null,
    url: `https://solscan.io/tx/${s.signature}`,
  }));
}

async function fetchEth() {
  const r = await fetch(
    `https://api.blockchair.com/ethereum/dashboards/address/${ETH_TREASURY}?limit=6`
  );
  if (!r.ok) throw new Error(`Blockchair ${r.status}`);
  const j = await r.json();
  const entry = j?.data?.[ETH_TREASURY];
  const txs = entry?.transactions || [];
  return txs.map((h) => ({
    chain: "ETH",
    hash: h,
    time: null,
    memo: null,
    url: `https://etherscan.io/tx/${h}`,
  }));
}

// Live Polygon treasury balances — native POL + USDC (native) + USDC.e, with a
// CoinGecko POL price for USD valuation. A CoinGecko failure only zeroes the USD
// valuation (token counts still return); an RPC failure throws and is caught
// per-chain by the aggregator.
async function fetchPolygon() {
  const addr = ETH_TREASURY;
  const noPrefix = addr.slice(2);
  const RPC = "https://polygon-rpc.com";
  const USDC = "0x3c499c542cEF5E3811e1192ce70d8cc03d5c3359";
  const USDCE = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
  const enc = (s: string) => "0x70a08231" + "0".repeat(24) + s;
  const body = [
    { jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [addr, "latest"] },
    { jsonrpc: "2.0", id: 2, method: "eth_call", params: [{ to: USDC, data: enc(noPrefix) }, "latest"] },
    { jsonrpc: "2.0", id: 3, method: "eth_call", params: [{ to: USDCE, data: enc(noPrefix) }, "latest"] },
  ];
  const r = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Polygon RPC ${r.status}`);
  const j: any[] = await r.json();
  const hex = (id: number) => (j.find((x) => x.id === id)?.result || "0x0");
  const matic = Number(BigInt(hex(1))) / 1e18;
  const usdc = Number(BigInt(hex(2))) / 1e6;
  const usdce = Number(BigInt(hex(3))) / 1e6;
  let maticUsd = 0;
  try {
    const pr = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd");
    const pj = await pr.json();
    maticUsd = pj?.["matic-network"]?.usd || 0;
  } catch {
    /* price unavailable — valuation falls back to token counts only */
  }
  const totalUsd = usdc + usdce + matic * maticUsd;
  return { matic, usdc, usdce, maticUsd, totalUsd };
}

Deno.serve(async (_req) => {
  try {
    const [solR, ethR, polR] = await Promise.allSettled([fetchSol(), fetchEth(), fetchPolygon()]);

    const sol = solR.status === "fulfilled" ? solR.value : [];
    const eth = ethR.status === "fulfilled" ? ethR.value : [];
    const polygon = polR.status === "fulfilled" ? polR.value : null;
    const status = {
      sol: solR.status === "fulfilled" ? "ok" : "error",
      eth: ethR.status === "fulfilled" ? "ok" : "error",
      polygon: polR.status === "fulfilled" ? "ok" : "error",
    };

    if (solR.status === "rejected") console.error("cryptoWatch sol:", solR.reason?.message || solR.reason);
    if (ethR.status === "rejected") console.error("cryptoWatch eth:", ethR.reason?.message || ethR.reason);
    if (polR.status === "rejected") console.error("cryptoWatch polygon:", polR.reason?.message || polR.reason);

    return Response.json({ sol, eth, polygon, status, ts: Date.now() });
  } catch (error) {
    return Response.json(
      { error: error.message, sol: [], eth: [], polygon: null, status: { sol: "error", eth: "error", polygon: "error" }, ts: Date.now() },
      { status: 200 }
    );
  }
});
