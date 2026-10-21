# 12 — Credibility and participation follow-up (2026-10-19)

**Status: PROPOSED CHANGES NOT DEPLOYED.** Branch `fix/credibility-funding-truth-r1m` (base `f6d053b`, the production baseline). Nothing here has been deployed to production or BACKUP, and no production data, schema, RLS or provider setting was changed.

## 1. Baselines

| Item | Value | Evidence type |
| --- | --- | --- |
| Production commit | `f6d053b` (R1M), entry `index-C6yXr6Hc.js`, 373/373 assets byte-identical to the build | live HTTP, 2026-10-19 |
| This branch | `f6d053b` + 4 code commits + this doc (below) | git |
| Metadata | **NOT PASSED / PLATFORM-OVERRIDDEN** (unchanged by this branch) | live HTTP + browser |

## 2. Classification

| Area | Class | Evidence |
| --- | --- | --- |
| R1M asset/route/functional checks | ALREADY WORKING (skipped) | post-deploy record 2026-10-19 |
| "$11 CONFIRMED" on /campaign | **BROKEN** (unsupported claim) -> fixed on branch | §3 |
| Home funding strip "$X raised / N% funded / on-chain live" | **BROKEN** (summed every FundingLead incl. pledges; wallet balance beside funding) -> fixed | `DonationMomentum.jsx` at f6d053b |
| Home "Funded 71%" ring | **BROKEN** (`|| 71` fallback shown when total rounds to 0) -> fixed | `MetroKit.jsx` at f6d053b |
| Home Klima "on-chain carbon ledger" figure | **BROKEN** (figure is an LLM answer via `InvokeLLM` + web context, labelled "querying on-chain ledger") -> section removed | `KlimaWidget.jsx` |
| "audited" platform counts; footer "Union-made / aligned to the UN SDGs / every offense on the public record" | **BROKEN** (no audit or affiliation evidence) -> footer + 2 "audited" lines fixed | files below |
| "Every report enters the public archive… renders on the live map immediately" | **BROKEN** (RLS: Location is readable only if `status == verified`, creator, or admin; new reports are `pending`) -> copy fixed | `base44/entities/Location.jsonc` read rule |
| Metadata descriptions on normal routes/crawlers | **BROKEN / NEEDS DAVID** (platform-side, see §5) | live HTTP |
| Remaining "union-made" (~18 places incl. `Mandate`, `HeroConsole`, `LabSignupModal`, `Contact`, `Support`, UiKit "Operations Tactical Inc.") and "SDG-aligned, community-owned treasury", $OOHEX token section | UNVERIFIED / **NEEDS DAVID** | grep |
| /privacy and /terms routes | **MISSING** (no route or page) | `src/App.jsx` |
| Operator identity (legal entity, address, funding authority) | **UNVERIFIED / NEEDS DAVID** | none on About/Contact |
| Contact mailbox `hello@ooh.earth` | in use on /contact; delivery of form mail UNVERIFIED (code comment: must be an invited app user) | `captureLead` |
| Analytics | EXISTS (Base44 SDK `analytics.track` via `trackEvent`); contract gaps in §7 | `src/lib/trackEvent.js` |
| Participation write path (queue/idempotency/location/EXIF) | UNVERIFIED on this baseline; fixes live on held R2 work (#356/#362). Not imported. | §6 |
| Investor portal fallbacks (`~2,000 waitlist`, `~47 ambassadors`, `~12,000 documented (beta)`, `~$55k of $100k`) | UNVERIFIED / **NEEDS DAVID** (flagged as sample in the UI, access-gated) | `InvestorDashboard.jsx` |

## 3. Funding truth: "$11 confirmed"

Chain: `Campaign.jsx` -> `fieldStats` -> `compute()` in `base44/functions/fieldStats/handler.ts`: `raised = sum(FundingLead.amount where channel in {stripe, crypto})`.
That sum has no paid-status check, no test/live distinction, no currency check, no refunds, no de-duplication, includes store purchases (webhook writes "Purchase: …" rows to the same entity), and `crypto` rows have no creation path other than admin entry. It is not verified funding.

Permitted read-only evidence (CLI `exec`, logged-in user, no privilege bypass, aggregates only, PII not read):
- Re-run with explicit `--data-env prod`: 5 FundingLead rows (4 `lead`, 1 `stripe`). The same query with `--data-env dev` returns 0 rows, so the earlier finding was production data (app id `6a62213cff3ccbca88c04ff5`).
- The one `stripe` row: $11, created 2026-07-29, message "Donation — Field Offensive", **empty `ext_ref`**. `stripeWebhook` always writes `ext_ref = <checkout session id>`, so this row was not created by the current webhook path.
- `StripeEvent` ledger: 0 rows. `Purchase`: 0 rows.
Interpretation: no evidence of a processed provider payment; ledger absence is supporting evidence, not proof that no payment occurred. The Stripe merchant account and live/test mode could **not** be verified (needs the Stripe dashboard).

Withdrawn: the earlier `cs_` ext_ref filter proposal. A session-id prefix is not payment verification; the patch and tests are kept only as `WITHDRAWN-*` files in the release records.

Frontend correction (this branch): `src/lib/fundingTotal.js` shows a total only if the backend returns `verified_funding: { status: 'verified', amount, currency: 'USD', as_of }`; otherwise "Verified funding total unavailable" (not $0), the target is shown separately as "Target $50,000", and the thank-you banner no longer claims receipt from the URL alone.

### Proposed backend funding contract (design only; separate release, needs David/Adil + provider access)
1. Source of truth = Stripe records for the **correct merchant account and live mode**, reconciled through the existing `stripeWebhook` ledger (`StripeEvent`), not `FundingLead`.
2. Count a payment only when: event is `checkout.session.completed` (or PaymentIntent succeeded) **and** `payment_status == 'paid'`, `livemode == true`, unique payment identity (PaymentIntent id) not already counted.
3. Subtract refunds/disputes (`charge.refunded`, `charge.dispute.*`) against the same PaymentIntent.
4. Keep currency per record; sum only same-currency amounts and expose per-currency totals (no unsupported USD conversion).
5. Classify donations vs store purchases vs subscriptions via session metadata; funding total = donations only.
6. Pledges/leads (`channel: lead`) and manual rows are never included. `crypto` is excluded unless a separate on-chain verification contract is approved.
7. Return `verified_funding` with `status: 'unavailable'` when the ledger or provider cannot be read; never fall back to a sum of FundingLead.
8. Tests required: unpaid session with a `cs_` id; test-mode payment; duplicate webhook delivery; refund; mixed currencies; provider/ledger unavailable; legacy row with empty `ext_ref`.
9. Preserve other `fieldStats` consumers (`HeroConsole`, `MetroKit`, `FieldStatsHud`, `PortalOps`, `InvestorDashboard`); `raised`/`donors` stay in the response but are labelled unverified.

## 4. Crypto / carbon / token / market inventory

| Display | Source and call | Units / calculation | Timestamp | Failure behaviour | Status |
| --- | --- | --- | --- | --- | --- |
| Map/Home HUD BTC/ETH/SOL (`FieldStatsHud.jsx`) | browser `fetch` to CoinGecko simple/price, every 60 s, no cache | USD spot + 24h change | none shown | catch -> coin silently omitted; free-tier rate limits likely | market data; purpose = ambient ticker; left in place (NEEDS DAVID) |
| Treasury balances (`TreasuryBalances.jsx`, Home `OnChain`) | `cryptoWatch` every 60 s | Polygon only: USDC + USDC.e (÷1e6) + POL x CoinGecko matic price = `totalUsd` | `updated <time>` from response | if CoinGecko fails `maticUsd = 0`, so `totalUsd` is silently understated | wallet balance, not funding; left in place |
| Treasury watcher (`DonationWatcher.jsx`, /campaign) | `cryptoWatch` every 60 s | recent txs from Solana RPC, Blockchair (ETH), Polygon RPC | "last sync" | per-chain status; empty list reads "no activity yet" | activity feed; left in place |
| `cryptoWatch` itself | 3-4 third-party APIs; 60 s shared `IntelCache` | — | cache window | `Promise.allSettled`, per-chain status | backend; untouched |
| Home funding strip on-chain line (`DonationMomentum.jsx`) | `cryptoWatch` every 60 s (a duplicate poll next to `TreasuryBalances` on the same page) | wallet balance shown beside "raised" | — | — | **removed** (duplicate poll + misleading adjacency) |
| Klima "tCO₂e retired" (`KlimaWidget.jsx`) | `InvokeLLM` with internet context, once per view | LLM-reported number | none | null -> spinner forever | **removed from Home** (not a chain/source read) |
| $OOHEX token section, "community-owned treasury" copy (`OnChain.jsx`) | static copy | — | — | — | NEEDS DAVID |

Duplicate polling evidenced: Home polled `cryptoWatch` from both `TreasuryBalances` and `DonationMomentum` (now one).

## 5. Positioning and metadata (read-only)

Observed: normal routes and crawlers receive a platform-generated head carrying the **old** descriptions and older asset hashes (`index-DQuN7kEb.js`, `index-7XujAGVa.js`); the explicit deployed HTML (`/about/index.html`) carries the new descriptions. `oohearth.base44.app` and BACKUP serve different (generic or older) per-route heads.

Documented platform behaviour (Base44 docs, "SEO and search visibility" and "Update SEO settings"): Dashboard -> SEO & GEO -> Meta tags has "Automatic titles and descriptions" and per-page overrides (title, description, og image, noindex); Base44 serves crawlers a rendered snapshot that it "refreshes when you publish or your content changes"; there is a Code tab for `index.html`; `seo_disabled` / `platform_meta_injection_enabled` toggles exist. Whether our old descriptions are stored per-page overrides, an old snapshot, or something else is **an open hypothesis**: nothing read so far confirms it. `cf-cache-status: DYNAMIC` alone does not prove regeneration or storage behaviour.

**Owner-assisted dashboard inspection (read-only first)**
1. Owner opens Dashboard -> SEO & GEO. Record (screenshot + text) before changing anything: top-level "Enable SEO for this app"; Meta tags tab: "Automatic titles and descriptions" state and the saved title/description/og image for Home, About, Campaign, Map and Report; Advanced tab: structured-data and sitemap toggles; whether a stored snapshot/"last rendered" indicator exists.
2. Compare each saved description with the R1M text (`src/lib/routeMeta.js` at f6d053b).
3. Proposed change, only if step 1 shows stored per-page overrides with the old text: set those five descriptions to the R1M values. Rollback: re-enter the recorded old values.
4. Do **not** change domain, auth, billing or publishing, toggle SEO off/on, or redeploy repeatedly to "force" regeneration; do not copy old HTML/JS into new paths.
5. After any owner change: re-run `verify-r1m.mjs https://oohearth.app new` and the crawler-UA curl comparison. The metadata check stays NOT PASSED until normal-route and crawler responses meet the requirement.

Unsupported claims fixed on the branch: footer affiliation/coverage claims, "audited", funding total, "public archive/instantly", Klima figure. David's portfolio is not described as OOH Earth client work anywhere changed here; `PortalOps`/`AtariPortfolio` were not audited for that and remain UNVERIFIED.

## 6. Contribution reliability and participant trust (baseline f6d053b)

Inspected read-only (`FieldReport.jsx`, `ReportStep1Document.jsx`, `offlineQueue.js`, `imageCompress.js`, Location RLS). No mutation or live test was run; no live test data was created. Existing qualification evidence (BACKUP R1/R1M, and the held R2 candidate) is Playwright/mocked and live-BACKUP read-and-render work; it does not certify a production mutation journey, camera capture from a gallery test, or fresh signup from an existing member.

- WORKING (code evidence): offline-queue vs server-synced states exist and the success card distinguishes "Queued offline" from "Transmission received"; `report_submitted` fires only for a synced save; uploaded images are re-encoded (`imageCompress.js` documents EXIF/GPS stripping); records are created `status: 'pending'`.
- BROKEN (fixed): copy implied immediate public visibility.
- UNVERIFIED / R2-dependent: findability of an anonymous submitter's own pending report (RLS gives the creator access only when `created_by_id` matches), observation vs upload time, coordinate-source/precision/correction, photo-rights confirmation, guidance against identifiable people/private information, a correction/removal route. Not changed here to avoid importing R2 or touching backend behaviour; tracked as R2 dependencies (#356/#362). Duplicate-submission risk remains: backend idempotency is non-atomic, so exactly-once is not claimed.
- NEEDS DAVID: attribution of his phone/gallery observation (record title/time, build entry hash `CEBjR8AH` = R1M, `BxO_Rmwk` = R1).

## 7. Operator accountability

- Routes that exist: `/about`, `/contact` (hello@ooh.earth and social handles), `/support`, `/careers`, `/investor-access`. Missing: `/privacy`, `/terms`.
- David Sidhom's name is confirmed (listed in `src/pages/PortalOps.jsx`; role not established there); legal entity, operator status, address, funding authority and contractual title are not evidenced anywhere in the repo and are not asserted.
- Proposed copy (NEEDS DAVID; do not publish until each fact is supplied): "OOH Earth is an open-source project operated by [legal entity / individual — to be confirmed]. Contact: [mailbox]. Funding enquiries are handled only through [authorized receiving route]. Open-source licensing does not replace this accountability: [named contact] is responsible for moderation, corrections and removal requests."
- Proposed privacy/terms scope (draft for David and counsel, not legal advice): what is collected (photos, approximate/precise coordinates, email), who can see it, moderation and removal route, analytics used.
- Existing routes to point people to: explore (`/map`), contribute (`/report`), collaborate (`/contact`). No service offer, investment offer, donation change, tax claim or fiscal host is added.

## 8. Honest measurement

Existing: Base44 SDK analytics through `trackEvent`: `camera_opened`, `report_submitted` (server-synced only), `report_verified`, `recheck_*`, `brand_identified`, `badge_unlocked`, `checkout_started`, `payment_confirmed`.
Smallest contract (event -> source -> exists?):
- Contribution started -> `camera_opened` / form first interaction -> partial (camera only).
- Server-confirmed submission saved -> `report_submitted` at the synced response -> exists, but a report queued offline and synced later has no event.
- First successful contribution / repeat contribution -> derive at reporting time per user id (first vs later `report_submitted`); no separate event needed.
- Each event: timestamp from the SDK, record id of the saved Location only (never photo, coordinates or email), dedupe on record id, reporting window stated with the figure.
- Separate synthetic/seeded/staff from genuine: not currently tagged. Gap: needs an `is_staff` or test-account flag or an allow-list at report time.
- Public moderation outcome stays a separate event (`report_verified`); signup is separate from contribution.
Gaps: queued-then-synced event; staff/synthetic tag; no consent/vendor assumptions made; no vendor installed; no public counters added.

## 9. Changes on this branch

| Commit | Files | Evidence |
| --- | --- | --- |
| fix(funding): never present unverified fieldStats totals as raised or confirmed | `src/lib/fundingTotal.js`, `src/lib/fundingTotal.test.js`, `src/pages/Campaign.jsx`, `src/components/ooh/DonationMomentum.jsx`, `src/components/ooh/MetroKit.jsx`, `src/pages/portals/InvestorDashboard.jsx`, `src/pages/PortalOps.jsx`, `e2e/positioning-alignment.spec.ts` | node unit tests 4/4; Playwright (mocked) loading/legacy-number/zero/string/unverified/EUR/503/verified/thank-you cases |
| fix(home): remove LLM-estimated Klima figure | `src/pages/Home.jsx` | build + lint |
| fix(copy): drop unsupported "audited" and footer affiliation claims | `SiteFooter.jsx`, `MovementContext.jsx`, `InvestorHub.jsx` | lint, prettier |
| fix(report): stop promising instant public visibility | `Report.jsx`, `Map.jsx`, `FieldReport.jsx`, `e2e/report-review-state.spec.ts` | Playwright (mocked) |

Checks run: `eslint`, `tsc` (jsconfig), `prettier --check`, `vite build`, node tests, Playwright chromium on the affected specs plus `critical-paths`, footer, `traction-events`, `offline-queue-retry` (24/24). The positioning spec passes 21/21 serially; under default parallel workers on this loaded machine it timed out intermittently waiting for the lazy Campaign render (not diagnosed further). Mobile projects and the full a11y suite were not run. Evidence type: mocked-backend browser tests plus unit tests; no live-write evidence.

## 10. Remaining decisions for David (NEEDS DAVID)
1. Operator/legal entity, mailbox, funding authority, privacy/terms owner (§7).
2. "Union-made", "UN SDG aligned", "community-owned treasury", $OOHEX token section: keep, reword or remove (list in §2). Suggested bounded default: keep the open-source/community-funded claims, remove union and SDG claims until evidenced.
3. Investor-portal fallback figures: replace with "Unavailable" or supply sources.
4. Owner-run SEO & GEO inspection (§5).
5. Backend funding verification (needs Stripe dashboard confirmation of account and live/test mode, then a separate reviewed backend release).
6. Whether the Klima section returns with a cited on-chain source.
7. David's phone/gallery test attribution.

## 11. Dependencies and rollback
- Frontend only; no schema, RLS, function or provider change. Rollback = revert the four commits or redeploy the pre-release mirror (`~/ooh-release-records/2026-10-18/live-PRODUCTION-mirror-pre-release`).
- Release path: PR into `maintenance/production-2026-10-02`; required evidence there comes from a workflow_dispatch run (CI only auto-runs for PRs to main). Port the same commits to main separately. Qualify on BACKUP before any production deploy, with explicit human approval.
- R2 (#356/#362) and its duplicate-risk decision remain held and separate.
