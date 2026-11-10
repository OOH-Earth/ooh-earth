import {
  CACHE_KEY,
  handleCryptoWatch,
  resetCryptoWatchState,
  WINDOW_MS,
} from '../cryptoWatch/handler.ts';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};
const assertEquals = (actual: unknown, expected: unknown, message: string) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
};

// Window-aligned fake clock (1_700_000_040_000 = 28_333_334 * 60_000).
const T0 = 1_700_000_040_000;
const req = () => new Request('https://example.test/cryptoWatch', { method: 'POST' });

type Mode = 'ok' | number | 'throw-secret' | 'hang';
function makeEnv(
  modes: Partial<Record<'sol' | 'eth' | 'polygon' | 'price', Mode>> = {},
  timeoutMs = 8_000,
) {
  const state = {
    modes: { sol: 'ok', eth: 'ok', polygon: 'ok', price: 'ok', ...modes } as Record<string, Mode>,
    calls: { sol: 0, eth: 0, polygon: 0, price: 0 } as Record<string, number>,
    rows: [] as any[],
    cacheBroken: false,
    cacheHang: false,
    cacheWriteBroken: false,
    now: T0,
  };
  const respond = (key: string, okBody: unknown) => {
    state.calls[key]++;
    const m = state.modes[key];
    if (m === 'hang') return new Promise<Response>(() => {});
    if (m === 'throw-secret') throw new Error('boom sk_live_SECRET key=abc123');
    if (m !== 'ok') return Promise.resolve(new Response('{}', { status: m as number }));
    return Promise.resolve(Response.json(okBody));
  };
  const fetchImpl = ((url: string | URL | Request) => {
    const host = new URL(String(url)).hostname;
    if (host === 'api.mainnet-beta.solana.com')
      return respond('sol', { result: [{ signature: 'sig1', blockTime: 1_700_000_000 }] });
    if (host === 'api.blockchair.com')
      return respond('eth', {
        data: { ['0xe286eb19b5a64dc41ca76f58d8fd6d7f114c1c12']: { transactions: ['0xabc'] } },
      });
    if (host === 'polygon-rpc.com')
      return respond('polygon', [
        { id: 1, result: '0xde0b6b3a7640000' }, // 1 POL
        { id: 2, result: '0x1e8480' }, // 2 USDC
        { id: 3, result: '0x0' },
      ]);
    if (host === 'api.coingecko.com') return respond('price', { 'matic-network': { usd: 0.5 } });
    throw new Error('unexpected host ' + host);
  }) as typeof fetch;
  const entity = {
    filter: async (q: any, _sort?: string, limit?: number) => {
      if (state.cacheHang) return new Promise<any[]>(() => {});
      if (state.cacheBroken) throw new Error('cache down');
      const hits = state.rows
        .filter((r) => r.cache_key === q.cache_key && r.period_key === q.period_key)
        .sort((a, b) => (b.created_date ?? 0) - (a.created_date ?? 0));
      return limit ? hits.slice(0, limit) : hits;
    },
    create: async (row: any) => {
      if (state.cacheBroken || state.cacheWriteBroken) throw new Error('cache down');
      state.rows.push({ created_date: state.rows.length + 1, ...row });
    },
  };
  const client = { asServiceRole: { entities: { IntelCache: entity } } };
  const deps = {
    createClientFromRequest: () => client,
    now: () => state.now,
    fetchImpl,
    timeoutMs,
  };
  const call = async () => (await handleCryptoWatch(req(), deps)).json();
  const upstream = () => ({ ...state.calls });
  return { state, call, upstream, deps };
}

Deno.test(
  'cryptoWatch: all chains succeed, then the window serves without upstream calls',
  async () => {
    resetCryptoWatchState();
    const env = makeEnv();
    const first = await env.call();
    assertEquals(first.status, { sol: 'ok', eth: 'ok', polygon: 'ok' }, 'all ok');
    assertEquals(first.unavailable, [], 'nothing unavailable');
    assertEquals(first.polygon.totalUsd, 2.5, 'POL at 0.5 plus 2 USDC');
    assertEquals(first.polygon.valuation, 'complete', 'valuation complete');
    assertEquals(env.upstream(), { sol: 1, eth: 1, polygon: 1, price: 1 }, 'one fan-out');
    await env.call();
    await env.call();
    assertEquals(env.upstream(), { sol: 1, eth: 1, polygon: 1, price: 1 }, 'cached for the window');
  },
);

Deno.test('cryptoWatch: failed chains are explicit and healthy chains are preserved', async () => {
  resetCryptoWatchState();
  const env = makeEnv({ polygon: 401, sol: 403 });
  const r = await env.call();
  assertEquals(r.status, { sol: 'error', eth: 'ok', polygon: 'error' }, 'per-chain status');
  assertEquals(r.unavailable, ['sol', 'polygon'], 'unavailable list');
  assertEquals(r.polygon, null, 'failed polygon is null, never zero balances');
  assertEquals(r.eth.length, 1, 'successful eth result preserved');
  assertEquals(r.fetched_at.polygon, null, 'no freshness claimed for a failed chain');
  assert(typeof r.fetched_at.eth === 'number', 'freshness kept for successful chain');
});

Deno.test('cryptoWatch: missing price is unknown, not a zero price', async () => {
  resetCryptoWatchState();
  const env = makeEnv({ price: 429 });
  const r = await env.call();
  assertEquals(r.status.polygon, 'ok', 'polygon balances still ok');
  assertEquals(r.polygon.maticUsd, null, 'price unknown is null');
  assertEquals(r.polygon.valuation, 'stablecoins_only', 'valuation flagged partial');
  assertEquals(r.polygon.usdc, 2, 'balances intact');
});

Deno.test(
  'cryptoWatch: repeated calls during an outage make no additional upstream requests',
  async () => {
    resetCryptoWatchState();
    const env = makeEnv({ polygon: 401, sol: 403 });
    for (let i = 0; i < 6; i++) await env.call();
    assertEquals(
      env.upstream(),
      { sol: 1, eth: 1, polygon: 1, price: 0 },
      'cooldown holds for the window',
    );
  },
);

Deno.test(
  'cryptoWatch: expiry permits recovery; failures are not cached beyond one window',
  async () => {
    resetCryptoWatchState();
    const env = makeEnv({ polygon: 401 });
    await env.call();
    env.state.now += WINDOW_MS - 1_000; // still inside the same window
    await env.call();
    assertEquals(env.upstream().polygon, 1, 'still cooling down');
    env.state.now = T0 + WINDOW_MS; // next window
    env.state.modes.polygon = 'ok';
    const recovered = await env.call();
    assertEquals(recovered.status.polygon, 'ok', 'recovers in the next window');
    assertEquals(env.upstream().polygon, 2, 'exactly one retry after expiry');
    // still failing in a later window: retried once, not stuck on a stale failure
    env.state.now = T0 + 2 * WINDOW_MS;
    env.state.modes.polygon = 500;
    await env.call();
    await env.call();
    assertEquals(env.upstream().polygon, 3, 'one retry per window while failing');
  },
);

Deno.test('cryptoWatch: concurrent requests in one isolate share a single fan-out', async () => {
  resetCryptoWatchState();
  const env = makeEnv({ polygon: 401 });
  const results = await Promise.all(Array.from({ length: 8 }, () => env.call()));
  assertEquals(
    results.every((r) => r.status.polygon === 'error'),
    true,
    'all see the same outcome',
  );
  assertEquals(env.upstream(), { sol: 1, eth: 1, polygon: 1, price: 0 }, 'coalesced');
});

Deno.test('cryptoWatch: a second isolate reuses the shared window record', async () => {
  resetCryptoWatchState();
  const env = makeEnv({ polygon: 401 });
  await env.call();
  resetCryptoWatchState(); // simulate a fresh isolate: empty memory, shared rows present
  await env.call();
  assertEquals(env.upstream().polygon, 1, 'shared IntelCache row honoured');
  assertEquals(env.state.rows.length, 1, 'one record per window');
});

Deno.test(
  'cryptoWatch: cache outage fails open yet still bounds upstream per isolate',
  async () => {
    resetCryptoWatchState();
    const env = makeEnv({ polygon: 401 });
    env.state.cacheBroken = true;
    const r = await env.call();
    assertEquals(r.status.polygon, 'error', 'still answers');
    await env.call();
    await env.call();
    assertEquals(env.upstream().polygon, 1, 'in-isolate memo bounds calls');
  },
);

Deno.test('cryptoWatch: freshness timestamps stay correct within a window', async () => {
  resetCryptoWatchState();
  const env = makeEnv();
  const first = await env.call();
  env.state.now += 30_000;
  const second = await env.call();
  assertEquals(
    second.fetched_at,
    first.fetched_at,
    'value age is the fetch time, not the request time',
  );
  assertEquals(second.ts, T0 + 30_000, 'ts reflects the request');
});

Deno.test('cryptoWatch: no secrets in logs or responses', async () => {
  resetCryptoWatchState();
  const env = makeEnv({ polygon: 'throw-secret', sol: 'throw-secret' });
  const logged: string[] = [];
  const original = console.error;
  console.error = (...a: unknown[]) => logged.push(a.map(String).join(' '));
  try {
    const r = await env.call();
    assertEquals(JSON.stringify(r).includes('SECRET'), false, 'response has no exception text');
    assertEquals(logged.join('\n').includes('SECRET'), false, 'logs have no secret');
    assertEquals(logged.join('\n').includes('abc123'), false, 'logs have no key material');
    resetCryptoWatchState();
    const broken = await handleCryptoWatch(req(), {
      createClientFromRequest: () => {
        throw new Error('token=sk_live_SECRET');
      },
      now: () => T0,
    });
    const body = await broken.json();
    assertEquals(
      JSON.stringify(body).includes('SECRET'),
      false,
      'top-level failure response is generic',
    );
    assertEquals(broken.status, 200, 'contract unchanged');
  } finally {
    console.error = original;
  }
});

Deno.test('cryptoWatch: policy constants are pinned', () => {
  assertEquals(WINDOW_MS, 60_000, 'initial 60 s policy');
  assertEquals(CACHE_KEY, 'cryptoWatch.v2', 'distinct key from the older whole-response rows');
});

Deno.test(
  'cryptoWatch: a hung provider becomes a recorded failure and never blocks callers',
  async () => {
    resetCryptoWatchState();
    const env = makeEnv({ polygon: 'hang' }, 25);
    const results = await Promise.all([env.call(), env.call(), env.call()]);
    for (const r of results) {
      assertEquals(
        r.status,
        { sol: 'ok', eth: 'ok', polygon: 'error' },
        'healthy chains still served',
      );
    }
    assertEquals(env.upstream().polygon, 1, 'one hung request shared');
    await env.call();
    assertEquals(env.upstream().polygon, 1, 'cooldown applies to the timed-out chain');
  },
);

Deno.test('cryptoWatch: a hung cache read or write cannot block the response', async () => {
  resetCryptoWatchState();
  const hungRead = makeEnv({}, 25);
  hungRead.state.cacheHang = true;
  const r = await hungRead.call();
  assertEquals(r.status, { sol: 'ok', eth: 'ok', polygon: 'ok' }, 'answers from upstream');
  resetCryptoWatchState();
  const writeFails = makeEnv({ polygon: 401 }, 25);
  writeFails.state.cacheWriteBroken = true;
  await writeFails.call();
  await writeFails.call();
  assertEquals(writeFails.upstream().polygon, 1, 'memo bounds calls when only the write fails');
});

Deno.test('cryptoWatch: a failure late in a window gets only the remaining cooldown', async () => {
  resetCryptoWatchState();
  const env = makeEnv({ polygon: 401 });
  env.state.now = T0 + WINDOW_MS - 1_000; // second 59
  await env.call();
  env.state.now = T0 + WINDOW_MS; // next window: retried
  await env.call();
  assertEquals(
    env.upstream().polygon,
    2,
    'cooldown is window-aligned (1 to 60 s), documented in the spec',
  );
});

Deno.test(
  'cryptoWatch: a slow refresh for an older window cannot overwrite a newer memo',
  async () => {
    resetCryptoWatchState();
    const slow = makeEnv({ polygon: 'ok' });
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    const realFetch = slow.deps.fetchImpl;
    let held = false;
    const deps = {
      ...slow.deps,
      fetchImpl: ((u: any, init?: any) => {
        if (!held && String(u).includes('polygon-rpc.com')) {
          held = true;
          return gate.then(() => realFetch(u, init));
        }
        return realFetch(u, init);
      }) as typeof fetch,
    };
    const call = async () => (await handleCryptoWatch(req(), deps)).json();
    const first = call(); // window N, blocked on polygon
    await new Promise((r) => setTimeout(r, 5));
    slow.state.now = T0 + WINDOW_MS; // window N+1
    await call();
    release();
    await first; // the old refresh finishes last
    const settledCalls = slow.upstream();
    slow.state.cacheBroken = true; // only the in-isolate memo can serve now
    await call();
    assertEquals(
      slow.upstream(),
      settledCalls,
      'memo still holds window N+1 after the late finish',
    );
  },
);

Deno.test('cryptoWatch: malformed shared records are treated as a miss', async () => {
  resetCryptoWatchState();
  const env = makeEnv();
  const window = String(Math.floor(T0 / WINDOW_MS));
  env.state.rows.push({
    cache_key: CACHE_KEY,
    period_key: window,
    created_date: 1,
    payload: JSON.stringify({
      chains: { sol: { ok: true, at: 1 }, eth: { ok: true, at: 1 }, polygon: { ok: true, at: 1 } },
    }),
  });
  const r = await env.call();
  assertEquals(
    Array.isArray(r.sol) && r.polygon !== undefined,
    true,
    'never serves a record with missing values',
  );
  assertEquals(env.upstream().polygon, 1, 'fell through to upstream');
});

Deno.test(
  'cryptoWatch: the newest shared record wins when two isolates both wrote one',
  async () => {
    resetCryptoWatchState();
    const env = makeEnv();
    const window = String(Math.floor(T0 / WINDOW_MS));
    const mk = (ok: boolean, created: number) => ({
      cache_key: CACHE_KEY,
      period_key: window,
      created_date: created,
      payload: JSON.stringify({
        chains: {
          sol: { ok: true, value: [], at: created },
          eth: { ok: true, value: [], at: created },
          polygon: ok
            ? { ok: true, value: { totalUsd: created }, at: created }
            : { ok: false, at: created },
        },
      }),
    });
    env.state.rows.push(mk(false, 1), mk(true, 2));
    const r = await env.call();
    assertEquals(r.status.polygon, 'ok', 'newest record chosen');
    assertEquals(r.polygon.totalUsd, 2, 'newest value');
    assertEquals(env.upstream().polygon, 0, 'no upstream call');
  },
);

Deno.test('cryptoWatch: older whole-response rows under the previous key are ignored', async () => {
  resetCryptoWatchState();
  const env = makeEnv();
  const window = String(Math.floor(T0 / WINDOW_MS));
  env.state.rows.push({
    cache_key: 'cryptoWatch',
    period_key: window,
    created_date: 1,
    payload: JSON.stringify({ sol: [], eth: [], polygon: { totalUsd: 999 }, status: {}, ts: 1 }),
  });
  const r = await env.call();
  assertEquals(r.polygon.totalUsd, 2.5, 'live value, not the legacy warm row');
});
