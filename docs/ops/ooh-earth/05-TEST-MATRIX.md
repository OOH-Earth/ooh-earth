# Test Matrix

Record PASS / FAIL / NOT RUN with evidence (a command, a screenshot description, a console log excerpt, a file:line). Never mark PASS without a cited reason.

Surfaces: HOME · MAP · GLOBE · LOCATION DETAIL · REPORT · AD SCAN · MULTI-AD LOCATION · DASHBOARD · ACCOUNT · PUBLIC SPACE · FOUNDING PROFILE

Conditions per surface (where applicable): DESKTOP · 390×844 MOBILE · INITIAL LOAD · REFRESH · NAVIGATION INTO VIEW · NAVIGATION BACK · EMPTY STATE · LOADING STATE · ERROR STATE · SLOW NETWORK (where safely simulatable locally) · MULTIPLE LOCATIONS · SINGLE LOCATION · ZERO RESULTS

## BACKUP (qualified, 2026-09-21 — see prior memory `project_backup_qualification_checkpoint.md`)

| Surface | Condition | Result | Evidence |
|---|---|---|---|
| User self-privilege-escalation (Test A) | authenticated ordinary member | PASS | PUT role/access/agency/founding_member → 403, reread confirmed none persisted |
| LocationRelationship self-verify (Test B) | authenticated ordinary member | PASS | create-time and update-time self-verify both blocked, 0 side effects |
| Moderation trust separation (Test C) | real admin session | PASS | Location approval didn't cascade to relationship verification |
| Founding Profile privacy cycle (Test D) | ordinary member | PASS | private→publish→edit→unpublish, safe allowlist confirmed, no PII leak |
| Public Space golden journey (Test E) | all 3 facility types | PASS | report→moderate→approve→LocationDetail render, advisory-only relationship display confirmed |
| Regression (Home/Map/Report/Dashboard/Account/LocationDetail) | desktop + 390×844 mobile | PASS | no console errors, no horizontal overflow |

## Production — P0 incident surfaces (pre-fix reproduction, 2026-09-22)

| Surface | Condition | Result | Evidence |
|---|---|---|---|
| Home | desktop, initial load | PASS (data loaded) | real count shown; console showed 429/realtime errors (unrelated), no Location 401 this run |
| Home | 390×844 mobile, Slow 3G | FAIL then PASS (race caught) | `Location?...limit=500` → 401, identical request moments later → 200 (reqid 585/588) |
| Map | 390×844 mobile, Slow 3G | PASS (data loaded, after delay) | "// 783 ADS"; same realtime/429 errors |

## BACKUP — P0 fix verification (post-deploy, 2026-09-22)

| Surface | Condition | Result | Evidence |
|---|---|---|---|
| Home | desktop, initial load | PASS | "3 SPOTS" (real, matches known synthetic count); `Location?...limit=500` fired **1x** (was 8+) |
| Home | 390×844 mobile, Slow 3G | PASS | "3 SPOTS"; `Location?...limit=500` fired **1x** even under throttling |
| Map | 390×844 mobile, Slow 3G | PASS | "// 3 ADS"; no new console errors |
| Deployment integrity | — | PASS | live bundle contains `retry-after` string marker (new code confirmed present) |

## Production — P0 fix verification (post-deploy, 2026-09-22)

| Surface | Condition | Result | Evidence |
|---|---|---|---|
| Home | desktop, initial load | PASS | "783 SPOTS" (real); `Location?...limit=500` fired **2x** (was 8+) |
| Home | 390×844 mobile | PASS | "783 SPOTS"; all Location requests 200 |
| Location detail | navigation to a real record | PASS | `6a994a13ce43f0d2423db127` → Dior/LVMH campaign data rendered correctly |
| Route/entry drift check | pre vs. post deploy | PASS | entry script changed from `index-D5XxBOtv.js` to `index-hGlHXfJl.js`, confirming the new deploy is live |
| Console (new errors) | — | PASS (none new) | only pre-existing, unrelated 401 (User/me, FundingLead)/429 (session-recordings)/realtime `connect_error`/a11y items |

## Multi-brand location `6ab1fc4a69f030c03ab1c6b9`

| Check | Result | Evidence |
|---|---|---|
| Anonymous API read (Location, FieldCheck) | 404 (expected — pending/non-verified, RLS-hidden) | Not investigated further — schema-level answer was definitive without it |
| Schema/code answer to Dave's questions | CONCLUDED | See `02-INCIDENT-MOBILE-LOCATIONS.md` — no multi-brand data model exists; manual workaround, not a bug |

Not run: full desktop/mobile/refresh/route-transition/zero-results matrix for every listed surface (Globe, Dashboard, Account, Public Space, Founding Profile) — the P0 fix is a shared low-level data-fetching change with no surface-specific logic, so Home/Map/Location-Detail were judged sufficient representative coverage given the mechanism (not surface-specific rendering) was what changed.

## P0.1 realtime WebSocket investigation, 2026-09-22 (evidence-gathering only, no code changes)

| Check | Result | Evidence |
|---|---|---|
| Production, anonymous, WS frame capture | CONFIRMED FAIL (platform-level) | `token=null` → Engine.IO open OK → Socket.IO `40` sent → `44{"message":"Connection rejected by server"}` |
| BACKUP, anonymous, fresh isolated context, WS frame capture | CONFIRMED FAIL, identical signature | `token=null` → open → `40` → `44{"Connection rejected..."}` at t=2192ms → close code 1005 at t=2806ms |
| BACKUP, authenticated (real JWT), WS frame capture | CONFIRMED SUCCESS | `40{"sid":...}` CONNECT SUCCESS, `"join"` events proceed normally |
| Reconnect behavior | CONFIRMED: none | 19s observation window post-close, zero further `WebSocket` construction events |
| P0 regression check | PASS — no regression | REST Location loading (P0 fix) unaffected; separate code path, separate root cause |
| Code fix | NOT ATTEMPTED (by design) | root defect is platform-owned (C); optional app-side mitigation scoped but deliberately deferred as its own follow-up — see `01-PRIORITY-QUEUE.md` |

## P0.2 analytics/session-recording 429 investigation, 2026-09-22 (evidence-gathering only, no code changes)

| Check | Result | Evidence |
|---|---|---|
| Production, inline bootstrap script present | CONFIRMED | `evaluate_script` found `window.Base44.recordings`, `window.rrweb`, `<script src="https://unpkg.com/rrweb@2.0.0-alpha.20/...">` — not present in this repo's source |
| Production, `session-recordings/ingest` request (load 1, `/`) | 429, "Recording limit reached" | reqid 970 — 245KB request body (DOM snapshot), `x-base44-recording-limit: reached`, no `Retry-After` |
| Production, `session-recordings/ingest` request (load 2, `/map`, fresh hard nav) | 429, identical signature | reqid 1202 |
| BACKUP, same check | NO SCRIPT, NO REQUEST AT ALL | `evaluate_script` found zero `Base44`/`rrweb` globals, zero script tag; full network capture shows no `session-recordings/ingest` request |
| Repeat/retry within a loaded session | NONE | 0 further ingest attempts across ~30s+ of subsequent map/API activity per page load |
| Repo search reconfirmed | CONFIRMED CLEAN | `git grep` on `origin/main` for rrweb/session-recording/telemetry-init: only unrelated UI copy + the app's own small `trackEvent.js`/`analytics/track/batch` wrapper (a different, unaffected endpoint that returns 200) |
| Product surfaces during/after a 429 | NO IMPACT | Home/Map/Globe/Location Detail/Account/REST/realtime/Public Space all functioned identically |
| Code fix | NOT JUSTIFIED — none attempted | fully platform-injected, zero footprint in this repo, no app-level opt-out exists |

## P0.1 realtime anon-subscribe mitigation, 2026-09-22 (frontend code, BACKUP-deployed and verified, NO PRODUCTION DEPLOY)

| Check | Result | Evidence |
|---|---|---|
| Focused unit tests (`authGatedSubscribeCore.test.mjs`) | PASS 9/9 | `shouldOpenSubscription`: anonymous→false, authenticated→true, auth-loading→false, missing entityName→false; `subscribeToEntity`: calls through exactly once + returns real unsub, safe no-op for missing entity/missing subscribe method/null container/non-function unsub |
| Full pure-module suite regression | PASS 132/132 | includes pre-existing `withRetry`/`dedupeInFlight`/`productIdentifier`/etc. tests, run together — 0 new failures |
| Lint | PASS | `npm run lint` clean |
| Typecheck | PASS | `npm run typecheck` clean |
| Prettier | PASS (after 1 `--write` pass) | 2 files needed formatting (`FieldCheckPanel.jsx`, the new test file) — same CI-driven pattern as the P0 fix |
| Build | PASS | `npm run build` clean, 69 static routes prerendered |
| Playwright, targeted suite (16 spec files covering every touched surface) | PASS (with documented contention caveat) | first parallel run: 33 passed / 25 failed; every failing test re-run serially (`--workers=1`) passed (36/36 across 2 batches); the 1 test that still failed serially (a11y "/" — 30s timeout) passed cleanly in full isolation (28.2s) — reconfirms this sandbox's known worker-contention artifact from the P0 fix's own resolution, not a regression |
| BACKUP deploy | PASS, 2nd attempt | `base44 site deploy --app-id 6a6748e009b947cb29591871`; 1st attempt shipped a `dist/` built without `VITE_BASE44_APP_ID`, so the bundle called production's app id from BACKUP's domain — caught before further verification, rebuilt with the env var set, redeployed, confirmed the bundle now embeds BACKUP's own app id |
| BACKUP, anonymous, desktop | PASS | 0 WebSocket `construct` events (was 1 rejected attempt), 0 `connect_error` in console, `Location?...limit=500` still 200, only pre-existing unrelated console items (401 `User/me`, coingecko CORS, form-field a11y) |
| BACKUP, anonymous, 390×844 mobile, `/map` | PASS | 0 WebSocket `construct` events, "LIVE" indicator + real data render correctly, screenshot clean |
| BACKUP, authenticated (real JWT) | PASS | WebSocket connects, Engine.IO handshake + Socket.IO CONNECT SUCCESS (`40{"sid":...}`) both succeed, matching pre-mitigation behavior exactly |
| BACKUP, authenticated, `/dashboard` (4 subscribe sites in one file) | PASS | admin console renders correctly (`ADILSMY@GMAIL.COM`, `ADMIN`, "IN QUEUE: 1"), zero console errors |
| P0 request-dedup regression check | PASS — no regression | REST `Location` loading untouched by this change; separate code path, confirmed still healthy throughout |

## P0.1 realtime anon-subscribe mitigation — PRODUCTION deployment and verification, 2026-09-22 (executive authorization, git-reconciled)

| Check | Result | Evidence |
|---|---|---|
| Re-run focused tests/lint/typecheck/format from exact qualified source (HEAD `8ecd822`) | PASS (all) | 9/9 focused tests, lint clean, typecheck clean, Prettier clean |
| Source freeze — diff vs. `origin/main` | PASS, clean | 17 files (3 new + 14 modified), 21 subscribe calls across 14 files confirmed by direct grep count, zero unrelated changes, zero screenshot-baseline PNGs present |
| Production env hard gate | PASS, PROVEN | Built with `VITE_BASE44_APP_ID=6a62213cff3ccbca88c04ff5` explicitly set (never the fallback); true entry file (per `dist/index.html`, not a naive glob match) contains production's app id **8×**, BACKUP's app id **0×** |
| Production deploy | PASS | `base44 site deploy --no-build --yes --app-id 6a62213cff3ccbca88c04ff5`; not blocked by the sandbox this time |
| Deployed artifact verify | PASS, PROVEN via content-hash | Live `oohearth.app`'s `index.html` references `/assets/index-ftqpUzUP.js` — the exact same content-hashed filename as the artifact built and inspected pre-deploy (Vite hashes are content-derived, so an identical name is a strong proof of byte-identical content) |
| Production, anonymous, desktop 1440×900, Home | PASS | 0 WebSocket `construct` events, "939 LIVE SPOTS / 783 VERIFIED / 156 LEADS / 83% VERIFY RATE" real data, `Location?...limit=500` + `skip=500` continuation (P0 dedup intact), only pre-existing console items (401 anon `User/me`, P0.2's 429 session-recording quota, geolocation-blocked warning, form-field a11y) |
| Production, anonymous, desktop, Map | PASS | 0 WebSocket attempts, "783 RESULTS" real listings render (Dior, etc.), globe/split/list views all functional |
| Production, anonymous, desktop, `/founders/:handle` (nonexistent) | PASS | "PROFILE NOT FOUND" renders correctly, `getPublicProfile` unaffected |
| Production, anonymous, desktop, `/account` | PASS | Redirects cleanly to `/login`, auth boundary intact |
| Production, anonymous, 390×844 mobile, Location Detail (real Dior/LVMH record) | PASS | 0 WebSocket attempts, real image/map/directions render correctly, no visual regression |
| Production, authenticated realtime | NOT INDEPENDENTLY VERIFIED on production | No pre-existing authenticated production browser session available; none manufactured (per authorization's explicit instruction not to). Identical mechanism (same hook, same code) proven live on BACKUP with a real authenticated session minutes earlier — CONNECT SUCCESS achieved, zero console errors |
| Post-merge drift check | PASS, empty diff | `git diff origin/main HEAD` (deployed branch vs. freshly-fetched merged main) is empty — no redeploy needed after merge |
| PR #269 CI | PASS, 10/10 | Lint & Typecheck, Build, Playwright (smoke+accessibility), Playwright (mobile Chromium), Prettier, Dependency audit, Dependency Review, CodeQL, Analyze, PR summary comment — all green |

## Product queue refresh — production baseline re-check, 2026-09-22 (lightweight, read-only)

| Check | Result | Evidence |
|---|---|---|
| Production, anonymous, Home | PASS | 0 websocket-type requests (out of 100), Location REST 200, only pre-existing 401/429 console items |
| No regression since P0.1 production release | CONFIRMED | Identical clean signature to the P0.1 release's own post-deploy verification, re-checked independently |

## `full_name` account-save-sync fix — BACKUP qualification, 2026-09-22 (NO PRODUCTION WRITE)

| Check | Result | Evidence |
|---|---|---|
| Reproduction (pre-fix), BACKUP, authenticated | CONFIRMED DEFECT | `PUT .../entities/User/me` with a changed `full_name` → `200`, response body AND immediate follow-up `GET` both echo the *old* value; client UI showed the fake typed value + "Saved" regardless |
| Lint (`Account.jsx`) | PASS | `npx eslint src/pages/Account.jsx --quiet` clean |
| Typecheck | PASS | `npm run typecheck` clean |
| Format | PASS | `npx prettier --check src/pages/Account.jsx` clean |
| Build | PASS | `npm run build` clean |
| Existing Playwright coverage (closest available) | PASS 2/2 | `account-menu-focus-restore.spec.ts` (unrelated to save flow, but nearest existing Account-page coverage) |
| BACKUP deploy | PASS | `base44 site deploy --app-id 6a6748e009b947cb29591871`; app-id embedding re-verified (1 occurrence of BACKUP's id in the true entry file; 7 stray occurrences of production's id all traced to static `media.base44.com` OG-image URLs, confirmed benign) |
| BACKUP, live, post-fix: broken field (`full_name`) | PASS — bug fixed | Same repro steps as before: heading/textbox now correctly revert to "Adil Younus" (true server value) after save, instead of showing the fake typed "TEST-FIX-VERIFY" text |
| BACKUP, live, post-fix: healthy field (`region`) | PASS — no regression | Changed to "Bangkok Test Region" → save → correctly persists and displays; reverted to empty afterward as cleanup |
| Production write | SHIPPED, 2026-09-22 | Executive loop authorized autonomous release; deployed, verified, PR #270 merged `78286b2`, post-merge drift empty |

## KNOWN_ISSUES.md #16 react-query migrations — MediaCorps + AtariPortfolio, 2026-09-22 (production-shipped, git-reconciled)

| Check | Result | Evidence |
|---|---|---|
| MediaCorps — lint/typecheck/format/build | PASS | all clean |
| MediaCorps — new `e2e/media-corps.spec.ts` | PASS | page renders, resolves loading state with no live records |
| MediaCorps — BACKUP live | PASS | renders correctly, no console errors, loading state resolves (no stuck spinner) |
| MediaCorps — production live | PASS | artifact content-hash match; real "0 corps" empty-dataset state renders correctly (genuine, not a bug); no new console errors |
| MediaCorps — PR #271 CI | PASS, 10/10 | merged `262ab37`; post-merge drift empty |
| AtariPortfolio — lint/typecheck/format/build | PASS | all clean |
| AtariPortfolio — new `e2e/atari-portfolio.spec.ts` | PASS (after 1 correction) | first attempt failed — page redirected anonymous to `/login` (`ProtectedRoute`, unrelated to the migration); fixed by adding the established `?access_token=mock-admin-token` + mocked-user convention; passes after |
| AtariPortfolio — BACKUP live, authenticated session | PASS | heading/email/totals/holdings/addresses/transactions/mints/pledges sections all render correctly; refresh button (`refetch()`) works; zero console errors |
| AtariPortfolio — production live | PASS | artifact content-hash match; `/portfolio` still correctly redirects anonymous to `/login`; Home still shows 0 WebSocket attempts (P0.1 intact), no new console errors |
| AtariPortfolio — PR #272 CI | PASS, 10/10 | merged `0850422`; post-merge drift empty |
| BACKUP deploy transient failure, caught | N/A — infra hiccup, not a code issue | AtariPortfolio's first BACKUP deploy attempt exited 0 but produced no "Site deployed successfully" text (only an unrelated internal CLI PostHog-telemetry network error) — verified live that the artifact had NOT actually updated, did not trust the exit code, retried, second attempt showed the expected success text and verified live it took effect |

## Phase 2 permission fix (structural, not runtime)

| Check | Result | Evidence |
|---|---|---|
| `validate_permission_fix.py` structural assertions | PASS | all locks/defaults/creator-edit-preservation checks pass |
| Full 23-entity expected-diff | PASS | 0 deleted, 0 new, exactly 3 changed, 20 unchanged (programmatic diff) |
| Deployed to production, authoritative-API verified | PASS (2026-09-22) | `GET entity-schemas` confirms all 3 locks live; see `06-EVIDENCE-LOG.md` |
| Runtime behavior on production | NOT RUN (explicitly out of bounds — no synthetic tests on production) | |

## LeadClaim permission fix (structural, not runtime)

| Check | Result | Evidence |
|---|---|---|
| Structural mirror diff | PASS | exactly `LeadClaim` changed, 22 unchanged, 0 new/deleted |
| Deployed to production, authoritative-API verified | PASS (2026-09-22) | `create` admin-only, `note.maxLength` 1000 confirmed live |
| DevTools smoke (desktop+mobile) | PASS | no regression on Home/Map/Globe/Location-Detail/Account |
| Runtime behavior on production | NOT RUN (no synthetic LeadClaim creation attempted — out of bounds without separate authorization) | |

## Public Space + Founding Profile release-candidate qualification, 2026-09-22 (re-used BACKUP evidence, no re-test needed)

| Check | Result | Evidence |
|---|---|---|
| No source drift since 2026-09-21 BACKUP qualification | CONFIRMED | `git log --since=2026-09-20` on every relevant file: 0 commits |
| BACKUP `moderate` matches origin/main current | PASS | fresh pull, diff exit 0 |
| BACKUP `getPublicProfile` matches origin/main current | PASS | fresh pull, diff exit 0 |
| BACKUP `Location`/`FieldCheck`/`LocationRelationship` schema matches origin/main | PASS | structural diff, 0 mismatches |
| `PROD_PATCH_moderate_main_v2.ts` local test suite | PASS | 11/11 (`deno test --no-check --allow-env --allow-read`), up from 7/7 — added `status_updated_at` + `LocationPhoto`-cascade coverage |
| Release mirror vs. fresh production baseline | PASS | exactly `Location`+`FieldCheck` changed, `LocationRelationship` new, 21 unchanged, 0 deleted |
| Frontend requirement | A — NO DEPLOY NEEDED | `PublicSpacePanel.jsx`/`Dashboard.jsx`/`Account.jsx`/`/founders/:handle` route all confirmed present in commit `c253b6a`, the currently-deployed bundle's base |
| n8nPing preservation | PASS | fresh pull byte-identical to Phase 1 post-deploy artifact |

## Public Space + Founding Profile release EXECUTION, 2026-09-22 (production, all 3 writes)

| Check | Result | Evidence |
|---|---|---|
| Final preflight (fresh drift check) | PASS | 0 drift vs. qualified baseline immediately before WRITE_1 |
| WRITE_1 (entities push) authoritative diff | PASS | exact expected delta, 24/24 match vs. RELEASE_MIRROR |
| WRITE_1: Phase 2 + LeadClaim locks post-write | PASS | all reconfirmed intact |
| WRITE_2 (getPublicProfile deploy) | PASS, RUNTIME-VERIFIED (partial) | OPTIONS 204, live nonexistent-handle check `{"found":false}`, end-to-end `/founders/:handle` page render confirmed |
| WRITE_2: full allowlist against a real public profile | NOT RUN | no known real `profile_public:true` handle; out of authorized scope to search for one — remains SOURCE-VERIFIED only |
| WRITE_3 (moderate deploy) | PASS | deployed `entry.ts` (not the hand-built patch, after discovering the CLI's actual entry-file convention) — post-deploy pull confirms byte-identical to origin/main |
| WRITE_3: auth boundary | PASS | unauthenticated `queue` → 403 |
| n8nPing post-release | PASS | unaffected; CORS `*` investigated and confirmed platform-level (identical on n8nPing itself), not a regression |
| DevTools desktop+mobile smoke | PASS | Home/Map/Globe/Location-Detail/Account/`/founders/:handle`, no new errors, no regression |

## Store.jsx react-query migration, 2026-09-22 (KNOWN_ISSUES.md #16)

| Check | Result | Evidence |
|---|---|---|
| eslint | PASS | clean, exit 0 |
| tsc -p ./jsconfig.json --noEmit | PASS | clean, exit 0 |
| prettier --check | PASS | clean |
| vite build (BACKUP + production targets) | PASS | both clean, both hard-gated |
| `e2e/store-catalog.spec.ts` (new) | PASS | 2/2 — anonymous + authenticated, resolves out of loading with empty catalog, no crash-signal console errors |
| `e2e/store-admin.spec.ts` (existing regression) | PASS | 2/2 — unaffected, `/store/admin` is a separate page |
| BACKUP hard gate | PASS | entry `index-DhA3OmDq.js` contains BACKUP app id (1 hit), 0 stray occurrences beyond the known-benign `media.base44.com` hardcoded image URLs |
| BACKUP deploy | PASS | "Site deployed successfully" text present (not just exit code) |
| BACKUP live verification | PASS | live entry-file hash matches inspected build; single `storeCatalog` fetch + single `auth.me()` call (no duplicates); the `auth.me()` 403 for an anonymous/expired session is expected (matches original code's own silent-catch path, not a regression); empty-catalog render matches BACKUP's actual unseeded StoreItem data; no crash-signal console errors |
| Production hard gate (autonomous pass) | PASS | entry `index-AxJZ2ltk.js` contains only the production app id (1 hit), 0 BACKUP-id hits |
| Production deploy (autonomous pass) | **BLOCKED** | sandbox auto-mode classifier denied the deploy command outright; no workaround attempted |

## Store.jsx production release, 2026-09-22 (under explicit human authorization "COMPLETE STORE REACT-QUERY PRODUCTION RELEASE")

| Check | Result | Evidence |
|---|---|---|
| Source preflight | PASS | fresh isolated worktree pinned to exact merged HEAD `9964d118ed1854c0aee4bf65b28c4f124888cd46`; clean git status; `useQuery` present in `Store.jsx` (3 occurrences); `e2e/store-catalog.spec.ts` present; no screenshot churn |
| Production build hard gate | PASS | true entry `index-AxJZ2ltk.js` (from `dist/index.html`); runtime SDK init object `{appId:"6a62213cff3ccbca88c04ff5",token:...}` proves active target is production; 0 BACKUP-id hits; `Store-C_me9OAG.js` chunk contains `store-catalog`/`store-owned-purchases` query keys, proving the qualified implementation is in this exact artifact |
| Production deploy | PASS | `base44@0.1.14 site deploy --no-build --yes --app-id 6a62213cff3ccbca88c04ff5` — "Site deployed successfully" text present (this retry was permitted by the sandbox; the identical command had been blocked during the earlier autonomous pass) |
| Live artifact match | PASS | served `/` HTML references `index-AxJZ2ltk.js`, byte-identical to the just-built and inspected entry |
| Store anonymous verification | PASS | real catalog renders (unlike BACKUP's empty state); single `storeCatalog` fetch (200); single `auth.me()` call for the owned-purchases query (401, anonymous-safe, matches pre-migration behavior); zero checkout/delivery calls from page load alone; no new crash-signal console errors (only pre-existing 401/429 items) |
| Store authenticated verification | NOT RUN | no naturally-available authenticated production session existed; not manufactured, per explicit instruction — recorded as a limitation |
| Regression smoke — Home | PASS | 0 WebSocket construction attempts (P0.1/P3 anonymous-realtime gating intact); `Location` fetched via 2 paginated calls (limit=500 ×2), matching the documented P0 dedup baseline; no new console errors |
| Regression smoke — Location Detail (mobile) | PASS | real Field Report data renders correctly (photo, map, verified badge); no new console errors |
| Post-deploy git check | PASS | fresh-fetched `origin/main` still at `9964d118ed1854c0aee4bf65b28c4f124888cd46`; no reconciliation needed; no second PR created |
| Synthetic production data created | NONE | no LeadClaim, Location, or LocationRelationship record created at any point |

## Globe markers incident (reopened), 2026-09-23 — root cause, fix, BACKUP + production release

| Check | Result | Evidence |
|---|---|---|
| Reproduction — Home globe, mobile (360×740) | FAIL (pre-fix) → PASS (post-fix) | pre-fix: "783 SPOTS" HUD text correct, zero visible markers on globe at any rotation; post-fix: real markers/clusters render at correct positions |
| Reproduction — Map default globe view, mobile | FAIL (pre-fix) → PASS (post-fix) | identical symptom/fix as Home globe (shared `Globe3D.jsx`) |
| Reproduction — Map flat mode, mobile | PASS (both) | never affected — confirmed via live reproduction before touching any code |
| Reproduction — desktop (1280px) | FAIL (pre-fix) → PASS (post-fix) | confirms the bug is general, not mobile-specific |
| Root cause instrumentation | CONFIRMED | live React-fiber walk to the `maplibregl.Map` instance; `getSource('ooh-markers').loaded()` = `false`, `._isUpdatingWorker` = `true`, permanently; `._pendingWorkerUpdate.data` held the fully correct FeatureCollection |
| Network capture | CONFIRMED | `GET .../assets/maplibre-gl-worker.mjs` → 404, both BACKUP and production, both mobile and desktop |
| First fix attempt (`?url` raw copy) | INSUFFICIENT | outer 404 resolved, but worker's own internal `import ... from "./maplibre-gl-shared.mjs"` left unrewritten — `loaded()` still never became `true`; caught via the same instrumentation before declaring victory |
| Final fix (`?worker&url`) | PASS | worker chunk self-contained (0 external relative imports), `loaded()` becomes `true`, `queryRenderedFeatures()` returns real features |
| `e2e/globe-markers.spec.ts` (new, 3 tests) | PASS | 3/3 — Home globe, Map globe view, flat-mode-unaffected; inspects actual `GeoJSONSource` state, not just canvas presence |
| Broader map/location regression (9 spec files, 49 tests) | PASS (48/49) | 1 pre-existing unrelated flake (`location-detail.spec.ts` cache-staleness test) confirmed to fail identically on unmodified `origin/main` via a separate clean baseline worktree — not a regression |
| eslint / prettier | PASS | clean on all 5 changed/new files |
| tsc (local, cached install) | FALSE PASS | masked by a shell pipe swallowing the real exit code — not caught locally |
| tsc (CI, fresh `npm ci`) | FAIL → PASS | caught `TS2307` (unresolved `?worker&url` specifier — no `vite/client` types reference in this project); fixed with a narrowly-scoped `src/types/vite-worker-url.d.ts` ambient declaration |
| Build byte-identity after typecheck fix | CONFIRMED | rebuilding after adding the `.d.ts` file produced an identical entry-file hash (`index-B-AnR6ZB.js`) to the already-deployed-and-verified artifact — zero runtime effect, no redeploy needed |
| BACKUP hard gate | PASS | entry `index-DXxhGwtV.js` contains BACKUP app id, worker chunk `maplibre-gl-worker-CJfwIrte.js` self-contained and correctly referenced |
| BACKUP deploy + live verification | PASS | live entry-file hash match; Home globe, Map globe view, flat mode, cluster-click-to-expand interaction all render real markers on mobile + desktop; no new console errors; P0 dedupe + P0.1 realtime gating both unaffected |
| Production hard gate | PASS | entry `index-B-AnR6ZB.js` contains only production app id, 0 BACKUP-id hits |
| Production deploy + live verification | PASS | live entry-file hash match; identical full matrix against the real 783-location dataset (individual pins + "3"/"36" clusters at correct positions), mobile + desktop; P0 dedupe confirmed unchanged (2 fetch pairs/fresh load, matching documented baseline); anonymous realtime WebSocket attempts confirmed still zero |
| Synthetic production data created | NONE | frontend-only change, no entity/function/schema writes of any kind |

## Globe markers incident — PR #274 git reconciliation + post-merge browser verification, 2026-09-25

| Check | Result | Evidence |
|---|---|---|
| PR #274 CI (all 10 checks incl. CodeQL/Analyze) | PASS | `mergeStateStatus: CLEAN`, `mergeable: MERGEABLE` before merge |
| Merge | PASS | squash-merged into `origin/main` at `0ed56883257f2ba684891b6380d21d70000e0adb` |
| Post-merge drift check | PASS, no redeploy needed | PR's base (`9964d11`) was already `origin/main`'s tip pre-merge |
| Chrome availability | RESOLVED without system install | Playwright's bundled Chromium (`~/.cache/ms-playwright/chromium-1243`) launched headless with `--remote-debugging-port=9223`; chrome-devtools MCP connected via its existing `--browserUrl` mode |
| Home globe, 390×844, cold nav | PASS | `sourceLoaded: true`, 6 real rendered features on first paint; globe confirmed below-the-fold via scroll+screenshot (`783 SPOTS · LIVE SYNC`, real Earth texture, visible clusters) |
| Home globe rotation | PASS | synthetic touch-drag moved center lng 100.55→168.77; markers still rendered post-rotation (geographic attachment confirmed, no disappearance) |
| Map default view (globe), 390×844, cold nav to `/map` | PASS | `sourceLoaded: true`, 5 real rendered features, visible above the fold immediately |
| Map flat mode | PASS | Leaflet mounted, MapLibre canvas unmounted, 27 real marker DOM elements, matches Dave's known-good baseline |
| Map flat → globe (reinit) | PASS | re-mount succeeded, source reloaded, 2 marker features rendered, no `_isUpdatingWorker` hang |
| Map globe, 360×800, cold nav | PASS | `sourceLoaded: true`, 5 real rendered features, screenshot clean, no clipping/overflow |
| Map globe, 412×915, cold nav | PASS | `sourceLoaded: true`, 5 real rendered features, screenshot clean |
| Landscape smoke, 915×412 | PASS (functional), UX finding | no horizontal overflow; globe container squashed to ~150px tall — separate minor finding, not blocking |
| Location Detail | PASS | real "> PAGE →" card click navigated to `/location/6a994a13ce43f0d2423db127`, rendered cleanly, 0 console errors |
| Marker tap/click interaction | INCONCLUSIVE (tooling limitation) | synthetic `TouchEvent` dispatch at exact projected coordinates did not trigger MapLibre's internal click-synthesis (0 popups, no cluster `flyTo`); source confirmed correctly wired (`Globe3D.jsx:308-351`); not re-confirmed via real touch input this pass — was live-verified during the original 2026-09-23 deployment gate |
| Slow 3G (same condition as original P0 repro) | PASS | cold nav resolved in ~2ms to found+loaded, 4 real markers, no error state |
| Fast 3G | PASS | same result |
| Slow 4G + 4× CPU throttle (combined) | CRASHED — traced to test-harness artifact, not a regression | `net::ERR_QUIC_PROTOCOL_ERROR`/`ERR_NETWORK_CHANGED` broke a lazy-chunk CSS preload, tripping the app's error boundary; a known CDP-throttling/QUIC interaction; non-reproducing under realistic throttle profiles (Slow 3G, Fast 3G) |
| Worker resolution (all viewports) | PASS | `/assets/maplibre-gl-worker-CJfwIrte.js` → 200 (~487KB); legacy unhashed `/assets/maplibre-gl-worker.mjs` still 404s (correctly unused) |
| P0 dedupe regression check | PASS | `Location?...limit=500` fetch pairs bounded (2 per fresh `/map` load), matching documented production baseline |
| P0.1 realtime gating regression check | PASS | zero anonymous WebSocket construction attempts across all runs |
| New, separate, minor finding #1 | Image 404 | 5 full-resolution `media.base44.com/images/public/.../<hash>.jpg` URLs (no resize suffix) 404; their `-768x...` resized siblings 200 |
| New, separate, minor finding #2 | Lazy-chunk resilience gap | no retry on a failed lazy-route CSS/JS preload — any transient network drop during code-splitting (real or synthetic) hard-fails to a full-page error boundary |
| Synthetic production data created | NONE | read-only browser verification, no entity/function/schema writes |

## TEST-001 — route-metadata.spec.ts intermittent failure — CLOSED, 2026-09-26

**Occurrences (all pre-fix):**

| PR | Workflow/job | Test | Failure signature | Retry result |
|---|---|---|---|---|
| #105 (footer CSS, unrelated) | CI / Playwright (smoke + accessibility) | `route-metadata.spec.ts:17` | `toHaveTitle` timeout, got "Sign In — OOH Earth" | flaky — passed on retry |
| #188 (framer-motion bump, unrelated) | CI / Playwright (smoke + accessibility) | same | same | failed all 3 attempts (2 retries) |
| #278 (docs-only, `brain/*.md`) | CI / Playwright (smoke + accessibility) | same | same | failed all 3 attempts — proves it's unrelated to any of these 3 PRs' own content |
| Local repro, `--repeat-each=15`, `retries=0` | n/a | same | same | 14 passed / 1 failed |
| Local repro, `--repeat-each=8`, `retries=0` (higher system load) | n/a | same | same | 4 passed / 4 failed |
| Local repro, `--repeat-each=20`, `retries=0`, **after fix** | n/a | same | n/a | **20/20 (60/60 incl. the file's other 2 tests) passed** |

**Root cause** (confirmed by temporarily instrumenting `AuthContext.jsx`
`checkAppState()`/`checkUserAuth()` and `LabAccessRoute.jsx`'s render
decision with `console.log`, then running the real test with a
`page.on('console')` listener — not guessed from reading code alone):
the test's `/lab/nft` navigation never passes `?access_token=`.
`AuthContext.jsx`'s `checkAppState()` only calls `checkUserAuth()` when
`appParams.token` (sourced from that URL param, or a persisted
`localStorage` value from an earlier `?access_token=` navigation in the
same browser context) is truthy; otherwise it immediately sets
`authChecked=true, isAuthenticated=false` and never attempts the call.
`LabAccessRoute`'s own fallback effect
(`if (tok === 'no' && !authChecked && !isLoadingAuth) checkUserAuth()`)
can occasionally still win a narrow render-timing race and authenticate
anyway — real, but not the mechanism a real user relies on, and not
guaranteed. Confirmed via a direct diagnostic run: with a minimal
network mock (no `?access_token=`), 6/6 isolated `/lab/nft` loads
deterministically redirected to `/login` at the ~700ms mark and never
recovered in 6+ seconds of polling — proving the "locked" state is
real and permanent once `checkAppState` takes that branch first.

**Classification**: TEST BUG (this test never authenticates the
protected navigation, unlike every other authenticated-route test in
this suite, e.g. `nft-creator-ux.spec.ts`'s own comment documents the
`?access_token=` requirement for this exact page). Not a Playwright bug,
not worker/CPU/memory contention (this repo already runs Playwright with
`workers: 1` in CI, and `e2e`/`e2e-mobile` are separate GitHub Actions
jobs on separate runner VMs — no cross-job resource sharing exists to
blame), not a server-startup race, not a port collision. It is a genuine
ORDER/TIMING race in `AuthContext`/`LabAccessRoute`'s own effect
scheduling, but the test should never have been relying on winning that
race in the first place.

**Fix**: `e2e/route-metadata.spec.ts` — added `?access_token=mock-admin-token`
to the `/lab/nft` `page.goto()`, matching the suite's established
convention. No application code changed. PR #279, merged.

**CI architecture note** (ruled out as a factor, documented for future
reference): `playwright.config.ts` already sets `workers:
process.env.CI ? 1 : undefined` and `retries: process.env.CI ? 2 : 0`.
`ci.yml`'s `e2e` and `e2e-mobile` jobs each `runs-on: ubuntu-latest` as
separate jobs — GitHub-hosted runners never share a VM across jobs, even
within the same workflow run, so the "many PRs' CI running concurrently"
theory from a prior pass does not apply to this specific failure
mechanism (though GitHub's account-level concurrent-job limit could
still delay job starts under heavy load — a separate, lower-severity
consideration, not investigated further as it wasn't the cause here).
