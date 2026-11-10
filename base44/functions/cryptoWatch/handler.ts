// Live on-chain activity watcher for the OOH treasury wallets.
// Public read-only: no auth required, and nothing here is user-specific (the
// same public treasury data is served to every caller).
//
// Request amplification control (see docs/ops/ooh-earth/11-CRYPTOWATCH-COOLDOWN-SPEC.md):
// each 60 s window the three chains are fetched at most once per isolate, and
// the OUTCOME of every chain -- success or failure -- is remembered for that
// window. A failed chain is therefore not re-requested upstream until the next
// window (bounded cooldown), while chains that succeeded keep being served.
// The shared record uses the existing IntelCache entity. In-flight work is
// coalesced within one isolate only; there is no cross-isolate lock, so this is
// NOT a global upstream quota.

export const CACHE_KEY = 'cryptoWatch';
export const WINDOW_MS = 60_000;

const SOL_TREASURY = 'EusJyb6R7vZEnmCLoJXBXui6inozZguAFjkKJNGEaafx';
const ETH_TREASURY = '0xe286EB19b5a64DC41Ca76f58D8fd6d7F114C1c12'.toLowerCase();

type Chain = 'sol' | 'eth' | 'polygon';
const CHAINS: Chain[] = ['sol', 'eth', 'polygon'];

type ChainOutcome = { ok: true; value: unknown; at: number } | { ok: false; at: number };
type WindowRecord = Record<Chain, ChainOutcome>;

export type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  now?: () => number;
  fetchImpl?: typeof fetch;
};

// In-isolate fallback state: used when the shared cache is unavailable, and to
// coalesce concurrent callers.
let memo: { windowKey: string; record: WindowRecord } | null = null;
let inFlight: { windowKey: string; promise: Promise<WindowRecord> } | null = null;

export function resetCryptoWatchState() {
  memo = null;
  inFlight = null;
}

async function readShared(base44: any, windowKey: string): Promise<WindowRecord | null> {
  try {
    const hits = await base44.asServiceRole.entities.IntelCache.filter({
      cache_key: CACHE_KEY,
      period_key: windowKey,
    });
    if (hits && hits.length && hits[0].payload) {
      const parsed = JSON.parse(hits[0].payload);
      if (parsed && parsed.chains && CHAINS.every((c) => parsed.chains[c])) {
        return parsed.chains as WindowRecord;
      }
    }
  } catch {
    /* cache read failure must never block a response */
  }
  return null;
}

async function writeShared(base44: any, windowKey: string, record: WindowRecord) {
  try {
    await base44.asServiceRole.entities.IntelCache.create({
      cache_key: CACHE_KEY,
      period_key: windowKey,
      payload: JSON.stringify({ chains: record }),
    });
  } catch {
    /* cache write failure must never block a response */
  }
}

async function fetchSol(f: typeof fetch) {
  const r = await f('https://api.mainnet-beta.solana.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getSignaturesForAddress',
      params: [SOL_TREASURY, { limit: 6 }],
    }),
  });
  if (!r.ok) throw new Error(`Solana RPC ${r.status}`);
  const j = await r.json();
  return (j.result || []).map((s: any) => ({
    chain: 'SOL',
    hash: s.signature,
    time: s.blockTime ? s.blockTime * 1000 : null,
    memo: s.memo || null,
    url: `https://solscan.io/tx/${s.signature}`,
  }));
}

async function fetchEth(f: typeof fetch) {
  const r = await f(
    `https://api.blockchair.com/ethereum/dashboards/address/${ETH_TREASURY}?limit=6`,
  );
  if (!r.ok) throw new Error(`Blockchair ${r.status}`);
  const j = await r.json();
  const entry = j?.data?.[ETH_TREASURY];
  const txs = entry?.transactions || [];
  return txs.map((h: string) => ({
    chain: 'ETH',
    hash: h,
    time: null,
    memo: null,
    url: `https://etherscan.io/tx/${h}`,
  }));
}

// Polygon: native POL + USDC + USDC.e. A CoinGecko failure leaves the price
// UNKNOWN (null), not zero; token counts still return.
async function fetchPolygon(f: typeof fetch) {
  const addr = ETH_TREASURY;
  const noPrefix = addr.slice(2);
  const RPC = 'https://polygon-rpc.com';
  const USDC = '0x3c499c542cEF5E3811e1192ce70d8cc03d5c3359';
  const USDCE = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  const enc = (s: string) => '0x70a08231' + '0'.repeat(24) + s;
  const body = [
    { jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [addr, 'latest'] },
    {
      jsonrpc: '2.0',
      id: 2,
      method: 'eth_call',
      params: [{ to: USDC, data: enc(noPrefix) }, 'latest'],
    },
    {
      jsonrpc: '2.0',
      id: 3,
      method: 'eth_call',
      params: [{ to: USDCE, data: enc(noPrefix) }, 'latest'],
    },
  ];
  const r = await f(RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Polygon RPC ${r.status}`);
  const j: any[] = await r.json();
  const hex = (id: number) => j.find((x) => x.id === id)?.result || '0x0';
  const matic = Number(BigInt(hex(1))) / 1e18;
  const usdc = Number(BigInt(hex(2))) / 1e6;
  const usdce = Number(BigInt(hex(3))) / 1e6;
  let maticUsd: number | null = null;
  try {
    const pr = await f(
      'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd',
    );
    if (pr.ok) {
      const pj = await pr.json();
      const price = pj?.['matic-network']?.usd;
      if (typeof price === 'number' && price > 0) maticUsd = price;
    }
  } catch {
    /* price unavailable: leave maticUsd null */
  }
  const totalUsd = usdc + usdce + (maticUsd === null ? 0 : matic * maticUsd);
  return {
    matic,
    usdc,
    usdce,
    maticUsd,
    totalUsd,
    valuation: maticUsd === null ? 'stablecoins_only' : 'complete',
  };
}

async function refresh(base44: any, windowKey: string, now: () => number, f: typeof fetch) {
  const shared = await readShared(base44, windowKey);
  if (shared) {
    memo = { windowKey, record: shared };
    return shared;
  }
  const settled = await Promise.allSettled([fetchSol(f), fetchEth(f), fetchPolygon(f)]);
  const at = now();
  const record = {} as WindowRecord;
  settled.forEach((s, i) => {
    const chain = CHAINS[i];
    if (s.status === 'fulfilled') {
      record[chain] = { ok: true, value: s.value, at };
    } else {
      // Allowlist: only the exact status-only shapes thrown above are logged
      // (e.g. "Polygon RPC 401"); anything else is logged generically so an
      // unexpected exception message can never carry a secret into the logs.
      const msg = s.reason instanceof Error ? s.reason.message : '';
      const safe = /^(Solana RPC|Blockchair|Polygon RPC) \d{3}$/.test(msg) ? msg : 'request failed';
      console.error(`cryptoWatch ${chain}:`, safe);
      record[chain] = { ok: false, at };
    }
  });
  memo = { windowKey, record };
  await writeShared(base44, windowKey, record);
  return record;
}

export async function handleCryptoWatch(
  req: Request,
  { createClientFromRequest, now = () => Date.now(), fetchImpl = fetch }: Dependencies,
) {
  try {
    const current = now();
    const windowKey = String(Math.floor(current / WINDOW_MS));
    let record: WindowRecord | null = memo && memo.windowKey === windowKey ? memo.record : null;
    if (!record) {
      if (!inFlight || inFlight.windowKey !== windowKey) {
        const base44 = createClientFromRequest(req);
        const promise = refresh(base44, windowKey, now, fetchImpl).finally(() => {
          if (inFlight && inFlight.windowKey === windowKey) inFlight = null;
        });
        inFlight = { windowKey, promise };
      }
      record = await inFlight.promise;
    }

    const ok = (c: Chain) => record![c].ok === true;
    const val = (c: Chain) => (record![c] as { ok: true; value: any }).value;
    const unavailable = CHAINS.filter((c) => !ok(c));
    const payload = {
      sol: ok('sol') ? val('sol') : [],
      eth: ok('eth') ? val('eth') : [],
      polygon: ok('polygon') ? val('polygon') : null,
      status: {
        sol: ok('sol') ? 'ok' : 'error',
        eth: ok('eth') ? 'ok' : 'error',
        polygon: ok('polygon') ? 'ok' : 'error',
      },
      // Additive fields: which chains are unavailable, and when each chain's
      // value was fetched (null when unavailable).
      unavailable,
      fetched_at: {
        sol: ok('sol') ? record.sol.at : null,
        eth: ok('eth') ? record.eth.at : null,
        polygon: ok('polygon') ? record.polygon.at : null,
      },
      ts: current,
    };
    return Response.json(payload);
  } catch {
    return Response.json(
      {
        error: 'cryptoWatch unavailable',
        sol: [],
        eth: [],
        polygon: null,
        status: { sol: 'error', eth: 'error', polygon: 'error' },
        unavailable: CHAINS,
        ts: now(),
      },
      { status: 200 },
    );
  }
}
