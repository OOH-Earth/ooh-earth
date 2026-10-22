# Remaining crypto/financial displays — purposes and open decisions (2026-10-22)

Removed in this release candidate (approved by David): the CoinGecko BTC/ETH/SOL price items and their 60-second request from the public Field Pulse HUD (`FieldStatsHud`, rendered only inside `Globe3D`). Nothing else depended on that data. A grep of `src/` and `e2e/` finds no remaining browser call to `api.coingecko.com`. **This does not mean all crypto functionality or requests are removed**: the backend `cryptoWatch` function still calls CoinGecko server-side for MATIC price.

| Item | What it does (source) | Status / open decision |
|---|---|---|
| `cryptoWatch` function | Reads recent Solana/ETH/Polygon activity and wallet balances for configured treasury addresses; 60 s `IntelCache`; calls Solana RPC, Blockchair, Polygon RPC, CoinGecko | Unchanged. Decision: keep as an on-chain *activity/balance* feed, or retire. Output is not verified funding. |
| `DonationWatcher` (Campaign page) | Lists recent on-chain transactions from `cryptoWatch` | Unchanged. Decision: label as "unverified on-chain activity" or remove. |
| `TreasuryBalances` (rendered by `OnChain`, Home) | Shows wallet balances from `cryptoWatch` | Unchanged. Decision: keep with source/date label or remove. `OnChain` copy calls it an "SDG-aligned, community-owned treasury" — unsupported wording, left for David. |
| `CryptoTicker`/`KlimaWidget` | Removed from Home/Map in earlier releases | Confirm stays removed. |
| `fieldStats.raised` | Unverified sum of FundingLead rows; never shown as money raised | Verified-funding contract still to be designed/implemented (backend). |

Do not infer paid/live/refunded status from Stripe session prefixes. Observation (secret names only, 2026-10-22): production lists secrets `OOH_EARTH_ENVIRONMENT, BASE44_RELEASE_ID, INVESTOR_TOKEN_SECRET, INVESTOR_ACCESS_CODE`; no Stripe or Resend secret appears in that list, so how Stripe checkout/webhook authenticate in production is unverified from this evidence.
