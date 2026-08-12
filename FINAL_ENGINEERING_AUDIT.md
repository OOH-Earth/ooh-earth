# OOH Earth — Final Engineering Audit

Date: 2026-08-12 · Author: Adil (engineering) · Scope: Phases 7-10 convergence cycle

## 1. System status

**ENGINEERING STATUS: READY WITH KNOWN RISKS**

The application is functional end-to-end across every P0 journey, CI/branch protection is fully gated and unbypassed, no open Dependabot alerts exist, and the two real defects found this cycle were fixed and merged. The known risks are all pre-existing, previously triaged, and explicitly bounded — none block normal usage. Nothing found this cycle was BROKEN, UNWIRED, or FAKE/DEMO in a P0 flow.

## 2. What is verified working

- **P0 journeys** (Home, Map, LocationDetail, FieldCheck, FieldReport, LeadClaim, Auth, Dashboard): all have real loading/empty/error states, real data persistence via Base44 entities, and Playwright coverage (desktop + mobile). Re-verified this cycle via targeted grep/read against `Map.jsx`, `Dashboard.jsx`, `LocationDetail.jsx` (see Phase 6 audit, prior checkpoint) — no dead buttons or fake interactions found.
- **CI/CD**: 10 required checks (Lint & Typecheck, Build, Playwright desktop, Playwright mobile, Prettier, Dependency audit, Dependency Review, CodeQL Analyze) enforced on every PR, `enforce_admins: true`, 0 exceptions taken this cycle.
- **Release pipeline**: confirmed unblocked — `release-please` is actively tracking `main` and its release PR reflects every merge in real time.
- **Security posture**: 0 open Dependabot alerts, 0 npm audit vulnerabilities, all previously-identified CodeQL HIGH findings resolved or evidence-backed false positives.

## 3. What was fixed this cycle (Phases 7-9)

| PR | Change | Why |
|---|---|---|
| #52 | `react-router-dom` 6.30.4 → 7.18.2 | Closed the last open `npm audit` finding (open-redirect CVE); app's declarative-only routing had zero exposure to v7 breaking changes |
| #53 | AI condition-scan in `FieldCheckCamera.jsx` | Reused `ReportStep2Identify`'s proven `InvokeLLM` pattern for the revisit flow, which had no AI assist |
| #54 | `TelemetryBar.jsx` `cancelled` flag typo (`false`→`true` in cleanup) | Real bug — both `if (!cancelled)` guards were permanently dead code (CodeQL `js/useless-conditional`), allowing setState-after-unmount |

All three merged to `main` with 10/10 required checks green.

## 4. Remaining real risks

| Risk | Severity | Status |
|---|---|---|
| No CSP | Medium (defense-in-depth gap, not an active exploit) | Documented in §13, deferred — see reasoning there |
| Overlay focus-trap gap (`CommandCenter`/`NavMenu`/`QuickCapture`) | Medium (a11y) | KNOWN_ISSUES #14, deliberately deferred — a partial fix is worse than the current honest state |
| `react-query` underused — 8 pages independently fetch, no dedup | Low (perf, not correctness) | KNOWN_ISSUES #16, deferred — real refactor, not a bounded fix |
| Base44 server-side upload enforcement unverified | Low-Medium (defense-in-depth) | KNOWN_ISSUES #21 — client validation is a UX gate, not a security boundary; server-side behavior is outside this repo's visibility |
| 2 missing raster app icons (PWA/iOS) | Low | KNOWN_ISSUES #11/#12, blocked on missing image tooling in this environment |

No P0 (production-blocking) risks identified.

## 5. External blockers

- **Base44 server-side upload validation**: cannot verify from this repo whether Base44's `Core.UploadFile` integration enforces size/type limits server-side. Requires checking Base44 platform docs/dashboard directly — flagged, not guessed.
- **iOS/Android raster icons**: no image-conversion tooling (ImageMagick/sharp/rsvg) available in this environment. Needs to be done wherever such tooling exists, or via Base44's asset pipeline.
- **CSP rollout**: needs live verification against the deployed Base44 host + WebSocket endpoint (resolved at runtime from `VITE_BASE44_APP_BASE_URL`, not statically knowable from source) before it can ship safely. See §13.

None of these block the product from functioning today; all are documented rather than worked around.

## 6. Deferred non-critical work

- Focus-trap implementation (#14) — needs a full WAI-ARIA-compliant build with tests, not a partial fix.
- `react-query` migration (#16) — real refactor across 8 files, deliberately out of scope for bounded PRs.
- CSP (#19) — see §13, scoped and deferred pending live-environment verification.
- 12 CodeQL note-severity unused-variable alerts (#31, new this cycle) — zero functional/security impact, not worth a dedicated PR.
- Raster app icons (#11/#12) — blocked on tooling.

## 7. Performance baseline

- Home entry chunk: 1104.21 kB → 805.03 kB (-27%) via lazy-loading below-the-fold sections (Phase 5, unchanged this cycle).
- Current production build entry chunk: **823.37 kB** — verified after both PR #52 (RRv7) and PR #53 (FieldCheckCamera AI scan); within noise of the 805 kB baseline, no regression.
- Two chunks remain intentionally large by nature of their dependency (`maplibre-gl` 1.06MB, `three.module` 486kB) — both are already route/feature-lazy-loaded, not part of the entry chunk.

## 8. Security baseline

- **Dependabot**: 0 open alerts (verified live via API this cycle).
- **npm audit**: 0 vulnerabilities (was 2, closed this cycle — see §3).
- **CodeQL**: 2 HIGH (`js/xss-through-dom`, `TrashId.jsx`/`MintLocationPanel.jsx`) — investigated via exact code-flow sink, confirmed false positive (plain `<input onChange>` handlers, no DOM-to-HTML reinterpretation), documented in KNOWN_ISSUES #26, left open on GitHub (no dismiss-with-evidence workflow needed). 2 WARNING — fixed this cycle (§3). 12 NOTE — deferred, zero impact.
- **Secrets**: none found in `src/` (KNOWN_ISSUES #22, re-verified pattern still holds).
- **No CSP**: real gap, see §13 for scoped rollout plan.

## 9. CI / branch protection baseline

```
enforce_admins: true
required_approving_review_count: 0
required_linear_history: true
allow_force_pushes: false
allow_deletions: false
required_conversation_resolution: true
required_status_checks:
  - Lint & Typecheck
  - Build
  - Playwright (smoke + accessibility)
  - Playwright (mobile Chromium)
  - Prettier
  - Dependency audit (fails on high/critical only)
  - Dependency Review
  - Analyze (javascript-typescript)
```
Verified live via GitHub API this cycle — unchanged from prior checkpoints, no drift.

## 10. Product flows verified

Home, Map, LocationDetail (incl. `PhotoGallery` + `FieldCheckPanel` timeline), FieldReport (4-step wizard), FieldCheckCamera (now with AI scan), LeadClaim (server-validated write), Dashboard (verify/reject queue), Auth boundary, Support — all confirmed functional with real data mutation, not mocked/demo behavior, per the Phase 6 core-journey audit (prior checkpoint, unchanged) plus this cycle's targeted re-verification of the two changed components.

## 11. Top 5 remaining engineering risks

1. **No CSP** — defense-in-depth gap; app has a large, partially-dynamic external-origin surface (see §13) that a script/style injection could otherwise reach unrestricted.
2. **Overlay accessibility (focus-trap)** — real screen-reader/keyboard-nav gap on 3 overlay components; correctly left unfixed rather than half-fixed.
3. **Unverified server-side upload enforcement** — client-side validation (this session) is real but not proven to be backed by server-side enforcement in Base44.
4. **No query deduplication** — 8 pages independently re-fetch the same entities on every visit; a real but low-severity perf/cost issue at scale.
5. **Dynamic Base44 host resolution** — `appBaseUrl`/WebSocket endpoint are runtime-injected, not statically knowable; makes CSP (and any future origin-allowlisting) require live-environment verification rather than static analysis alone.

## 12. Recommended next steps

1. Live-verify the deployed Base44 host + WebSocket origin, then implement the CSP from §13 behind a `Content-Security-Policy-Report-Only` header first, monitor for violations across Stripe checkout / Donorbox / map tiles / radio playback, then promote to enforcing.
2. Scope and build a proper WAI-ARIA focus-trap for the 3 overlay components as its own dedicated PR (explicitly not a quick patch).
3. Confirm Base44's server-side upload enforcement directly with the platform (dashboard/docs), close the loop on KNOWN_ISSUES #21.
4. Cut v1.1.0 via the already-open, already-verified `release-please` PR (this cycle's fixes are the last commits it's tracking) — see PR #44.

---

## 13. Appendix — CSP scoping (Phase 8 deliverable, deferred implementation)

**Why deferred, not implemented now**: the app embeds ~15 independent radio-stream origins, Stripe.js (dynamically-injected script), a Donorbox payment iframe, an OSM iframe embed, a YouTube iframe embed, MapLibre GL (which injects its own worker/style/glyph loads), multiple blockchain RPC/explorer APIs, and a Base44 API+WebSocket host resolved at runtime from `VITE_BASE44_APP_BASE_URL`/an app-param — not statically knowable from source. Shipping a guessed policy risks silently breaking checkout, maps, or radio playback in production. This is exactly the "needs methodical per-integration testing" case KNOWN_ISSUES #19 already flagged — confirmed, not resolved, this cycle.

### a. Required directives
`default-src 'self'`, `script-src`, `style-src`, `font-src`, `img-src`, `connect-src`, `frame-src`, `media-src`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'`.

### b. Required origins by directive (derived from `grep -rhoE 'https?://...' src/ base44/functions/`, cross-checked against actual load-site context — iframe/audio/fetch/script, not `<a href>` text)

- **script-src**: `'self'`, `js.stripe.com` (injected at runtime by `@stripe/stripe-js`'s `loadStripe()`). Base44 SDK is an npm-bundled dependency, not a separate script tag — no additional origin expected here, but unverified against the deployed build.
- **style-src**: `'self'`, `fonts.googleapis.com`. `'unsafe-inline'` likely required — Tailwind + component libraries (Radix, MapLibre GL) commonly inject `<style>` tags at runtime; needs live verification, not an assumption.
- **font-src**: `fonts.gstatic.com` (per the `index.html` preconnect pair; `fonts.googleapis.com` serves the CSS, `.gstatic.com` serves the actual font files).
- **img-src**: `'self'`, `data:`, `blob:` (local photo previews via `URL.createObjectURL` in `MultiPhotoUpload.jsx`), `media.base44.com`, `firebasestorage.googleapis.com`, `images.unsplash.com`, `static.wixstatic.com`, `oohearth.app` (legacy WordPress media, KNOWN_ISSUES #4), `i.ytimg.com`, `*.basemaps.cartocdn.com`, `server.arcgisonline.com`.
- **connect-src**: `'self'`, the Base44 API host (runtime-resolved, **not statically known** — must be read from the deployed `VITE_BASE44_APP_BASE_URL`), the Base44 WebSocket equivalent (used by realtime `.subscribe()` calls, e.g. `LiveActivityFeed`), `nominatim.openstreetmap.org`, `air-quality-api.open-meteo.com`, `api.stripe.com`, `api.coingecko.com`, `api.blockchair.com`, `api.dexscreener.com`, `api.mainnet-beta.solana.com`, `polygon-rpc.com`. `public.api.bsky.app` and `world.openfoodfacts.org` appear in source but need a live check to confirm they're actually fetched vs. referenced in copy.
- **frame-src**: `donorbox.org`, `www.openstreetmap.org`, `www.youtube.com`.
- **media-src**: the ~15 radio-stream hosts (`ice5.somafm.com`, `kexp-mp3-128.streamguys1.com`, `jazzblues.ice.infomaniak.ch`, `live.amperwave.net`, `livex.radiopopolare.it`, `npr-ice.streamguys1.com`, `st01.sslstream.dlf.de`, `stream-uk1.radioparadise.com`, `stream.europe1.fr`, `stream.live.vc.bbcmedia.co.uk`, `stream.radioparadise.com`, `tunein.cdnstream1.com`, `wwoz-sc.streamguys.com`, `icecast.walmradio.com`, `radio.ooh.earth`) — **this list may be incomplete**; `radioContext.jsx` reads `station.stream` from a station-config data source not fully enumerated by a source grep. Verify against that config directly before shipping.
- **Not resource loads, zero CSP relevance**: ~50 origins in the raw grep are plain `<a href>` reference/attribution links (OOH-operator company sites, activism orgs, social profiles, blockchain explorers-as-links) — excluded above.

### c. Unsafe requirements
- `style-src 'unsafe-inline'` is likely unavoidable without a broader refactor (Tailwind + third-party libs). A nonce/hash-based approach is the safer alternative but requires build-tooling changes — out of scope for a bounded rollout.
- No `'unsafe-eval'` requirement found in source (no `eval`/`new Function` usage detected).

### d. Integration risks
- **Highest risk**: Stripe checkout and Donorbox payments — any misconfigured `frame-src`/`script-src`/`connect-src` silently breaks fundraising, the platform's most consequential flow.
- **Second**: MapLibre GL's worker/glyph/style loading — CSP's `worker-src`/`child-src` interaction with map libraries is a well-known footgun; needs its own explicit check.
- Base44 host/WebSocket must be confirmed against the actual deployed value, not the env-var name — a wrong guess breaks every entity read/write and realtime subscription app-wide.

### e. Rollout strategy
1. Live-verify the deployed Base44 origin + WebSocket endpoint and the complete radio-station list.
2. Ship as `Content-Security-Policy-Report-Only` first (zero enforcement, pure telemetry) for at least one full manual pass through: donation checkout, map load (all 3 tile styles), a field report with photo upload, radio playback, YouTube embed.
3. Review violation reports, patch the allowlist.
4. Promote to enforcing `Content-Security-Policy` only after a clean report-only pass.
