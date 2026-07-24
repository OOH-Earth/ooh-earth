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

// Live Polygon treasury balances — native POL + USDC (native) + USDC.e,
// with a CoinGecko POL price for USD valuation.
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
  try {
    const r = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
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
      /* price unavailable */
    }
    const totalUsd = usdc + usdce + matic * maticUsd;
    return { matic, usdc, usdce, maticUsd, totalUsd };
  } catch {
    return { matic: 0, usdc: 0, usdce: 0, maticUsd: 0, totalUsd: 0 };
  }
}

Deno.serve(async (req) => {
  try {
    const [sol, eth, polygon] = await Promise.all([fetchSol(), fetchEth(), fetchPolygon()]);
    return Response.json({ sol, eth, polygon, ts: Date.now() });
  } catch (error) {
    return Response.json(
      { error: error.message, sol: [], eth: [], polygon: null, ts: Date.now() },
      { status: 200 }
    );
  }
});