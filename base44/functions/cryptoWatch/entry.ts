// Live on-chain activity watcher for the OOH treasury wallets.
// Public read-only — no auth required (public app). Returns recent signatures/txs.
const SOL_TREASURY = "EusJyb6R7vZEnmCLoJXBXui6inozZguAFjkKJNGEaafx";
const ETH_TREASURY = "0xe286EB19b5a64DC41Ca76f58D8fd6d7F114C1c12".toLowerCase();

async function fetchSol() {
  try {
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
    const j = await r.json();
    return (j.result || []).map((s) => ({
      chain: "SOL",
      hash: s.signature,
      time: s.blockTime ? s.blockTime * 1000 : null,
      memo: s.memo || null,
      url: `https://solscan.io/tx/${s.signature}`,
    }));
  } catch {
    return [];
  }
}

async function fetchEth() {
  try {
    const r = await fetch(
      `https://api.blockchair.com/ethereum/dashboards/address/${ETH_TREASURY}?limit=6`
    );
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
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  try {
    const [sol, eth] = await Promise.all([fetchSol(), fetchEth()]);
    return Response.json({ sol, eth, ts: Date.now() });
  } catch (error) {
    return Response.json(
      { error: error.message, sol: [], eth: [], ts: Date.now() },
      { status: 200 }
    );
  }
});