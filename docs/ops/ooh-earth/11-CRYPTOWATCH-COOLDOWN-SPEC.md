# cryptoWatch request amplification: spec (written before implementation)
Base: maintenance/production-2026-10-02 @ 0ed08e7. Date 2026-11-10.

## Verified current behaviour
- Repo source (identical at 1dbddda and 0ed08e7): `Promise.allSettled` over Solana RPC, Blockchair, Polygon RPC (+CoinGecko). One IntelCache row per 60 s window, written ONLY when all three chains are ok. While any chain fails nothing is cached, so every call re-calls all providers.
- Callers: three browser components poll every 60 s each (DonationMomentum, TreasuryBalances, DonationWatcher). No scheduler exists in the repo.
- Production stored source (pulled read-only with CLI 0.1.14, 113 lines, entry main.ts): has the per-chain `allSettled` but NO cache at all (predates #127). So on production today every call fans out regardless of health; the repo cache has not been deployed to the production function. This is release drift, separate from this PR.
- Response today: `{sol, eth, polygon, status:{sol,eth,polygon}, ts}`; failed chain = `[]`/`null` plus `status:'error'`; CoinGecko failure gives `maticUsd: 0`, which looks like a real price of zero.

## Requirements
1. Preserve successful chain results when another chain fails.
2. Failed/unavailable values explicit: `status` stays; add additive `unavailable` (chain names) and `maticUsd: null` plus `valuation: 'complete'|'stablecoins_only'` instead of a fake 0 price.
3. Bounded cooldown: a failed chain is not re-requested upstream again within the same 60 s window (initial proposed policy, not a standard). Expiry at the window boundary permits recovery. Failures are never stored beyond one window.
4. Use existing mechanism: one IntelCache row per window (`cache_key: cryptoWatch`, `period_key: window`), payload now records per-chain outcome incl. failures, plus an in-isolate memo as fail-open fallback if the entity read/write fails.
5. Concurrency: concurrent requests in the SAME isolate share one in-flight computation. Across isolates there is no global lock and no claim of deduplication: at most one extra upstream burst per isolate per window is possible. Not a global quota.
6. API compatible: all existing fields and types unchanged; new fields additive only. Public/no-auth boundary unchanged. Data is public treasury data, identical for all callers, so nothing user-specific is cached.
7. Errors in logs are status-only strings (`Polygon RPC 401`); responses never include exception text (top-level catch now returns a fixed message).
8. No new provider, credential, dependency, scheduler or infrastructure.

## Measurement honesty
Reduces upstream provider requests during an outage (expected: 1 burst per window per isolate instead of 1 per poll). Backend invocations are NOT reduced (every poll still invokes the function). No credit or dollar saving is claimed without comparable provider measurements.

## Tests (fake clock, stub fetch)
success; one/several chain failures; no extra upstream during cooldown; recovery after expiry; concurrent sharing; errors not cached past the window; freshness timestamps; no secrets in logs/responses. Plus a discriminating run of the same scenarios against the old source.
