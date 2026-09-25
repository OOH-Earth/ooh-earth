# Incident: Production Location Visibility / Mobile Map

## REPORTER
Dave

## AFFECTED
`oohearth.app` (production)

## SYMPTOMS
- Home/front-page map missing locations.
- Map page / globe view: locations missing or intermittently loading.
- Mobile appears particularly buggy.

## REFERENCE SCREENSHOTS
Four screenshots were supplied directly in conversation by the user, not copied into this repository (external conversation evidence, not a repo-relative path). Described:
1. A field-report edit form (mobile) showing `parent_corp: "Samsung Electronics / Toyota Motor Corpo[ration]"`, `ooh_operator: Plan B`, `sector: Automotive`, `surface: Billboard`, notes describing a wrap-around billboard with two ads (Samsung Galaxy Z Fold8 Ultra/Fold8, and Toyota Land Cruiser FJ), and separate AI-read visible text for both ads.
2. Mobile home screen, Orbital Atlas globe loaded, "930 spots" showing successfully.
3. Mobile map page (satellite view), search bar, "FIELD ATTENTION" banner, "// 15 ADS", "reading evidence for this view..." — no visible markers in this frame.
4. Same map page a beat later — markers/clusters now visible (numbered `3`, `6`), one ad card at the bottom.

## REPRODUCTION

Reproduced via chrome-devtools-mcp against real `https://oohearth.app`, fresh isolated browser context (no BACKUP/admin session involved — genuine anonymous visitor), both desktop and true 390×844 mobile emulation, including Slow-3G network throttling.

- **Desktop, unthrottled:** Home loads successfully, globe shows real location count. Console shows: two `401`s on `entities/User/me` (expected — anonymous, no user), **two `429`s on `/api/runtime/session-recordings/ingest`** ("quota_reached"), and a **reproducible realtime connection failure**: `connect_error Error: Connection rejected by server`.
- **Mobile 390×844, Slow 3G, attempt 1:** Home loads, globe shows "783 SPOTS" (real data). Same 429s on session-recordings. Same realtime `connect_error`.
- **Mobile 390×844, Slow 3G, attempt 2 (Map page):** Map loads, "// 783 ADS" (real data, matches Home's count). Same 429s. Same realtime `connect_error`. **Realtime failure now reproduced 3/3 attempts — deterministic, not intermittent.**
- **Direct evidence of the actual bug mechanism**, captured in the mobile Slow-3G Home run: `GET .../entities/Location?sort=-created_date&limit=500` **returned 401** (reqid 585 in that run's network log), while an **identical** request moments later (reqid 588) returned 200 with real data. This is the smoking gun for the "missing/intermittent" symptom — see ROOT_CAUSE below.

## NETWORK
On every single page load (Home or Map, any viewport, any network speed), the exact same `Location?sort=-created_date&limit=500` (and its `&skip=500` follow-up page) is fetched **8–16+ times independently and near-simultaneously** — no caching or request de-duplication across components. On the throttled mobile run, one of these many concurrent requests received a spurious `401`.

## CONSOLE
- `Failed to load resource: 401` — `entities/User/me` (expected, anonymous) and, once observed, `entities/Location` (not expected — see root cause).
- `Failed to load resource: 429` + `session-recordings ingest http 429` + `[base44 recordings] stopped: quota_reached` — a **separate, consistently reproducible** (100% of runs) rate-limiting issue on the session-recording/analytics ingest endpoint. Not investigated further this pass (does not affect location data), but proves Base44 *does* actively rate-limit this session/traffic pattern in some form.
- `connect_error` / `error: Connection rejected by server` — a **separate, consistently reproducible** (3/3 runs, all viewports/networks) realtime WebSocket subscription failure. This is `base44.entities.Location.subscribe()` (used by `useLocations()`, which powers the front-page globe's live-update behavior) failing to establish its connection. Root cause of *this specific* failure was **not** determined this pass (would require inspecting the realtime service configuration on the Base44 platform side, which wasn't investigated) — flagged as a confirmed, separate, real bug, follow-up item.
- `A form field element should have an id or name attribute` — pre-existing, minor, unrelated a11y issue (already tracked in `00-CURRENT-STATE.md`).

## DATA
Production's `Location` table has ~974 records (confirmed earlier via the Base44 editor's Data tab). Observed live counts during reproduction (783, 930) are plausibly the *non-rejected* subset at different moments — consistent, not alarming on their own.

## CODE PATH
- `src/api/base44Client.js` — `base44.listAllLocations()`: paginates `Location.list()` in a loop (500/page) to fetch the true total instead of a silently-capped single page. Correctly designed for correctness, **not** for concurrency: it has no request de-duplication or shared cache.
- **16 independent call sites** for `base44.listAllLocations()`: `CarbonCounter.jsx`, `CityPulse.jsx`, `DashboardDropdown.jsx`, `HeroConsole.jsx`, `Leaderboard.jsx` (×2), `OffenderRegistry.jsx`, `OperativeNetwork.jsx`, `SmartDashboard.jsx`, `useGamification.js`, `useLocations.js`, `useRecentFieldChanges.js`, `CategoryDirectory.jsx`, `Map.jsx`, `AdbustingPortal.jsx`, `GraffitiPortal.jsx`.
- `src/pages/Home.jsx` mounts ~25 widgets, of which at least 7 (`CarbonCounter`, `CityPulse`, `Leaderboard`, `OperativeNetwork`, `OffenderRegistry`, `GamificationWidget` via `useGamification`, plus the globe's own `useLocations`) independently call `listAllLocations()` — this is the direct, observed cause of the 8–16+ duplicate concurrent requests seen on every Home page load.
- `src/pages/Map.jsx` — its own `reloadLocations()` deliberately avoids `useGamification()` specifically to prevent duplicating its own `listAllLocations()` fetch (an existing code comment confirms this was already a known concern for this one page — Map.jsx itself is *not* part of the duplication problem, though it still competes for bandwidth with whatever Home widgets are still in flight if navigated to quickly).
- `src/hooks/useLocations.js` — powers the **front-page globe directly**. On any failure (or a genuinely-empty successful response) it silently falls back to `src/components/ooh/mapSeed.js`, a **hardcoded ~24-location snapshot from 2026-07** (Bangkok + London), with `live: false` and no visible indication to the user that they're looking at stale demo data instead of the real ~974 locations.
- Nearly every other `listAllLocations()` caller (`CarbonCounter`, `CityPulse`, `OperativeNetwork`, `OffenderRegistry`, etc.) wraps the call in a bare `catch { setData(zeroValue) }` — any failure, including a transient one, is indistinguishable from "genuinely zero locations," with no retry and no error state shown.

## HYPOTHESES
1. ~~Mobile-specific viewport/container-sizing bug~~ — no evidence found; globe/map render correctly once data loads.
2. ~~Pagination/query limit cutting off results~~ — ruled out; 974 records fit in two 500-record pages, and both pages were observed succeeding on their own.
3. **Race between session/auth bootstrap and the burst of concurrent `Location` fetches — CONFIRMED as the mechanism** (see ROOT CAUSE).
4. Deployment drift (preview vs. prod execution environment) — not implicated; the code paths traced match what's actually live (401/200 behavior observed matches the traced code exactly).
5. Realtime/WebSocket failure — **confirmed as real and reproducible, but separate**; does not explain the *initial* data-missing symptom (the plain HTTP fetch is independent of the WebSocket subscription), only the lack of live in-page updates afterward.

## ELIMINATED HYPOTHESES
- Viewport/container-sizing timing bug on mobile (globe and map both rendered correctly once their data loaded, on both desktop and mobile).
- Pagination cutting off real data (two pages fully cover the ~974-record dataset; both pages independently confirmed to succeed).
- Query/status-filter misconfiguration (no filter changes found between origin/main and what's live; RLS/query shape traced and matches expectations).

## ROOT_CAUSE_CONFIDENCE
**HIGH** for the fetch-race/duplication mechanism (directly observed: a live 401 on the exact endpoint in question, under exactly the conditions — mobile, slow network — that make the race window wider; fully explained by traced code, not just correlated).
**Confirmed-but-unexplained** for the separate realtime connection failure (100% reproducible, but its underlying cause on the Base44 platform side was not investigated this pass).

## EVIDENCE
See NETWORK/CONSOLE sections above — this is live reproduction evidence, not inference alone. The specific failing request: `GET https://oohearth.app/api/apps/6a62213cff3ccbca88c04ff5/entities/Location?sort=-created_date&limit=500` → `401`, immediately followed by an identical request → `200`, both during the same mobile Slow-3G Home page load.

## AFFECTED_CODE
`src/api/base44Client.js` (`listAllLocations`), and by extension every one of its 16 callers listed above — most directly `src/hooks/useLocations.js` (front-page globe) and the Home-page widget set.

## WHY_MOBILE_IS_AFFECTED
Slower network + slower JS execution widens the timing window between the app's auth/session-bootstrap gate clearing and the burst of ~7+ concurrent `Location` fetches actually reaching the server — making it more likely that one or more of them lands before the session is fully ready server-side, producing a spurious 401 on that specific request. Desktop/fast-network runs did not reproduce the 401 in this session's testing (though the underlying race is not viewport-specific — it's timing-specific, so it can in principle happen on desktop too, just less often).

## WHY_HOME_IS_AFFECTED
Home mounts far more independent `listAllLocations()` consumers (7+) than any other page, maximizing both the number of concurrent requests in the race window and the number of user-visible widgets that will silently degrade (to a zero-stat or the 24-location seed map) if their particular request loses the race.

## WHY_GLOBE_IS_AFFECTED
The front-page globe's data comes from `useLocations()`, one of the callers subject to this exact race; on a lost race it silently swaps to the ~24-location hardcoded 2026-07 seed set with no visible indication, which would look exactly like "locations went missing" to anyone comparing against what they saw before (the real dataset is ~974 records, not ~24).

## DATA_LOSS
**NO.** This is a client-side, transient, per-request display issue — no backend data is deleted, corrupted, or lost. A page refresh (a fresh set of requests, past the race window) reliably shows the real data again, consistent with everything observed this session.

## PROPOSED FIX
Add a single retry (short delay) to the one shared `listAllLocations()` pagination helper in `src/api/base44Client.js`, extracted into a small, independently unit-tested `withRetry()` utility (`src/lib/withRetry.js`). This fixes the race for **all 16 call sites at once** without touching their individual code, and without changing any of their existing (separately-worth-revisiting) error-handling/fallback behavior. This does **not** address the separate realtime-connection failure, which needs its own follow-up investigation (platform-side, not something a frontend retry can fix).

**Prepared in isolated worktree** `/tmp/.../scratchpad/fix-location-visibility-mobile` (branch `fix/location-visibility-mobile`, off `c253b6a`). **Not deployed.**

## TESTS
- `src/lib/withRetry.test.mjs` (plain Node, no framework configured for frontend `src/` in this repo) — 5/5 pass: no-retry-on-success, retry-once-then-succeed, exhausts-retries-then-rethrows, `retries: 0` disables retrying, actually waits `delayMs` before retrying.
- `npx eslint src/api/base44Client.js src/lib/withRetry.js --quiet` — clean, no errors.
- `npx tsc -p ./jsconfig.json --noEmit` — no errors attributable to either changed file.
- Full `npm run build` was **not** run this pass (would require `npm install` in the isolated worktree; the change is small enough that lint + typecheck + unit tests were judged proportionate — flagged here for transparency, not silently skipped).

## DEPLOYMENT STATUS
**RESOLVED — DEPLOYED TO BACKUP THEN PRODUCTION, 2026-09-22, VERIFIED.**

Fix was strengthened before deployment (see UPDATE below) to also de-duplicate concurrent requests, not just retry them, per explicit review. Full gate sequence completed:

1. **Gate 1 (build):** Real `npm ci` in the isolated worktree (661 packages, clean, no lockfile drift — symlinked node_modules from the earlier ad-hoc check was removed first and confirmed not to touch the main checkout). `npm run build` succeeded (`✓ built in 47.52s`). Lint and typecheck clean on all 4 changed/new files.
2. **Gate 2 (retry review):** Found and fixed a real bug the review surfaced: `withRetry` was retrying *any* thrown error, including deterministic 4xx (400/403/404/422) that can never succeed on retry. Rewrote it to only retry statuses that are plausibly transient (401 — the diagnosed race — plus 408/429/502/503/504, and true network errors with no status), and to respect a `Retry-After` header when present. **Also implemented Gate 2's preferred option B**: added `src/lib/dedupeInFlight.js` so concurrent `listAllLocations()` calls share one request instead of each firing independently — this fixes the underlying fan-out itself, not just its symptom. A second real bug (an unhandled-rejection footgun from `.finally()`) was caught by the new unit tests and fixed before deployment.
3. **Gate 3 (realtime + 429 triage):** See UPDATE below — both classified, neither blocks this fix.
4. **Gate 4 (regression):** Verified via live reproduction (see EVIDENCE below) rather than synthetic fault injection (no request-mocking primitive was available in this session's toolset) — the unit tests are the deterministic proof of the retry/dedup logic itself; live browser checks proved deployment integrity and real-world behavior.
5. **Gate 5 (BACKUP deploy):** `base44 site deploy --build -y` scoped to BACKUP (`6a6748e009b947cb29591871`) via `base44/.app.jsonc`. Frontend only — no entities/functions touched. Verified: deployed bundle contains the new code (confirmed via fetching the live JS and finding the `retry-after` string marker); `Location?...limit=500` now fires **exactly once** per page load (down from 8+), on both desktop and mobile+Slow-3G; real data loads ("3 SPOTS", matching BACKUP's known synthetic record count); no new console errors.
6. **Gate 6 (pre-flight):** Confirmed production's live entry script (`index-D5XxBOtv.js`) was unchanged since reproduction began (no drift); identity reconfirmed (`adil16smy@gmail.com`); rollback record saved (`PRE_DEPLOY_ROLLBACK_RECORD.md` in the worktree) documenting the exact git-based revert procedure.
7. **Gate 7 (production deploy):** Same worktree, relinked to production (`6a62213cff3ccbca88c04ff5`), same `site deploy --build -y` command. Deployed successfully.
8. **Gate 8 (post-deploy verification):** Fresh isolated CDP context against real `oohearth.app`. Confirmed: new entry script live (`index-hGlHXfJl.js`, changed from `index-D5XxBOtv.js`); Home shows real data ("783 SPOTS") on both desktop and mobile; `Location?...limit=500` dropped from ~8-16 to **2** on production (not the theoretical minimum of 1 seen on BACKUP — being precise rather than overclaiming; still a ~75-87% reduction); Location Detail opens correctly for a real record (`6a994a13ce43f0d2423db127` — confirmed Dior/LVMH brand/campaign data rendering); no new console error types introduced (only the same pre-existing, unrelated 401/429/realtime/a11y items). One 401 was observed on a *different, unfixed* entity (`FundingLead`) — direct confirmation that the underlying session-timing race is a general platform phenomenon, not Location-specific, and that our fix correctly targeted the highest-impact call site without needing to touch every fetch in the app.

## UPDATE — Gate 3 realtime + 429 triage results

**Realtime WebSocket failure:** Investigated further. The SDK defaults `serverUrl` to `https://base44.app`, but this app explicitly overrides it to `''` (relative), meaning both REST (`/api/...`) and the realtime socket.io path (`/ws-user-apps/socket.io/`) resolve relative to whichever domain serves the page. A direct raw-WebSocket handshake test to both `wss://oohearth.app/ws-user-apps/socket.io/` and `wss://base44.app/ws-user-apps/socket.io/` **succeeded (OPEN)** on both — ruling out a CDN/custom-domain proxy gap for the transport layer. The failure happens at the socket.io *application* protocol layer (after the transport connects), which needs platform-side visibility this session doesn't have. **Also confirmed present on BACKUP** (a native `*.base44.app` subdomain, no custom domain at all) — same identical failure, which further rules out anything production-domain-specific.
**Classification: CONFIRMED (real, 100% reproducible) + UNRELATED to Location loading (proven — it's a separate code path; initial data load doesn't depend on the realtime subscription) + root mechanism UNKNOWN at the protocol level (one major hypothesis ruled out with direct evidence).** Queued separately (`01-PRIORITY-QUEUE.md`, P0.1) — not fixed this pass, per explicit instruction not to guess-patch it.

**Analytics 429 (`/api/runtime/session-recordings/ingest`):** `git grep` found zero references to `rrweb` or "session-recording" anywhere in this repository's `src/` — this is injected entirely by the Base44 platform itself, not by any code in this repo.
**Classification: CONFIRMED (real, reproducible) + UNRELATED to Location loading (confirmed separate endpoint, separate code path, not present in this repo at all) + PLATFORM ISSUE (outside this repository's control).** Nothing to fix from here; not blocking.

---

## Multi-brand / multi-ad investigation — CONCLUDED

**Reference location ID `6ab1fc4a69f030c03ab1c6b9`:** returns `404 Entity Location ... not found` on an anonymous production API read, and the same on `FieldCheck`. Consistent with the record being in `pending` status (RLS hides non-verified records from anonymous reads and returns "not found" rather than "forbidden," by design — same behavior confirmed earlier this engagement for other entities) rather than a route/entity-type error. **Did not attempt to read it as a production admin** — that would require establishing new production admin credentials, out of scope without separate authorization. This does not block the findings below, which are definitive from schema + code + the screenshot alone.

**Findings (from schema + traced code, DEFINITIVE — no live record access needed):**

- **Is `Location` the physical asset?** Only loosely. There is **no deduplication by physical position** anywhere in the submission pipeline — confirmed by reading `base44/functions/submitOffline/handler.ts`: it dedups *only* by `client_operation_id` (protects against the same submission being retried, e.g., after an offline-queue retry) and otherwise **always calls `entity.create()`**. Every report submission creates a brand-new `Location` record, even if one already exists at the same physical spot.
- **Are ads/brands separate child/evidence records?** No. `brand_name`, `parent_corp`, `ad_agency`, `campaign_name`, `industry_sector`, `harm_tags` are all **singular fields directly on `Location`**. There is no "Ad" or "Advertisement" child entity. (`FieldCheck` and `LocationPhoto` are separate per-visit records, but they don't carry a distinct brand-per-check structure either — a `FieldCheck` has its own single `brand_name` field, same singular-field pattern.)
- **Can two brands coexist without one overwriting the other?** Only via a **manual human workaround** — exactly what the screenshot shows: an operative typed `"Samsung Electronics / Toyota Motor Corpo[ration]"` into the single `parent_corp` string field. This is not a system feature; the schema has no concept of multiple structured brand values per location.
- **Which brand should a marker/card/LocationDetail show?** Whatever's in that Location record's own singular `brand_name`/`parent_corp` fields — for this record, that's the manually-combined string (or possibly a single brand, if `brand_name` and `parent_corp` weren't edited the same way — not verified without record access).
- **Is "current ad" conceptually singular in the schema?** **Yes, confirmed.** One `brand_name` per `Location` record.
- **Accidental last-write-wins from automated code?** **No automated overwrite path exists** — `moderate/entry.ts` never touches `brand_name`/`parent_corp` on verify, and the submission pipeline always creates new records rather than updating existing ones. The only overwrite risk is a **human** manually editing an existing Location's brand fields via `LocationEditPanel.jsx` (standard single-value-field editing, not a bug).
- **Are historical ads preserved?** Not in any structured way. Since every report creates a *new* `Location` (no dedup-by-position), if a re-check is filed as a **new** report, the old record's brand data simply persists as its own separate record — but there's no link connecting "these two/three Location records are actually the same physical billboard over time" other than proximity a human would have to notice manually. If instead a human **edits** the *same* existing Location record to add a second brand (as in the reference screenshot), the previous single-brand value is simply overwritten in-place with the combined string, with no version history.
- **Notable scope observation (not a bug):** the newer `LocationRelationship` entity (built for the Public Space feature — skateparks/courts sponsor claims, with a proper evidence/moderation trust model) is **not used** for the general advertising-brand-tracking case at all. The two features have structurally different data models for a conceptually similar problem (multiple entities/claims associated with one physical spot) — worth a product decision at some point, not an engineering defect.

**Conclusion:** the multi-brand representation on this billboard is a **manual data-entry workaround for a real, pre-existing schema limitation** (Location supports exactly one brand per record), not a bug introduced by recent work, and **not connected to the P0 missing-locations incident** — no evidence links them; they were investigated independently as instructed.

---

# Incident (reopened): Globe markers — Home "Orbital Atlas" and Map default globe view render zero markers

## REPORTER
Dave, direct report, own phone (Chrome/Android): "Still no show on that one. Working on flat mode not globe mode. Also front page version not pulling em up." Two supplied mobile screenshots: Home globe rendered with correct real spot count in its HUD text but zero visible markers on the sphere; Map page flat/satellite view showing a real "34 ADS" count with markers correctly loading a beat later.

## AFFECTED
`oohearth.app` production (both mobile and desktop, confirmed general — not device-specific) and `ooh-earth-backup.base44.app`.

## RELATIONSHIP TO THE EARLIER P0 FIX
**None — confirmed independent.** The P0 REST-fetch dedupe/retry fix (`src/api/base44Client.js`, `withRetry.js`, `dedupeInFlight.js`) remains deployed and effective; it addresses a session-timing race on the plain `Location` REST fetch. This incident is entirely downstream of that fetch succeeding — the data arrives correctly (confirmed: `markers.length` / the HUD's own spot count was always accurate), the failure is specifically in whether MapLibre GL ever paints that already-correct data onto the globe.

## REPRODUCTION
Reproduced via chrome-devtools-mcp against real `oohearth.app` and `ooh-earth-backup.base44.app`, fresh isolated browser contexts, mobile (360×740, Android Chrome UA) and desktop viewports:
- Home's "Orbital Atlas" globe: HUD correctly reads "783 SPOTS · LIVE SYNC" (production) / "3 SPOTS" (BACKUP) — globe renders, camera/framing correct, **zero markers visible anywhere on the sphere**, confirmed not a camera-framing artifact (rotating/zooming produced no markers at any orientation).
- Map page's default view (`usePersistentState('ooh-map-view', 'globe')` — a fresh visitor always lands here): identical symptom, "// 783 ADS" list populated correctly below an empty-looking globe.
- Map page's flat mode (`LocationMap.jsx`, react-leaflet): **confirmed working correctly** — real cluster markers ("2", "12", "11", "4") visible on satellite imagery, exactly as Dave reported.

## FIRST_FAILING_STAGE (via direct instrumentation, not inferred)
Traced the actual live `maplibregl.Map` instance (found via a React-fiber walk from the rendered `.maplibregl-canvas-container` DOM node — no public ref is exposed for this). `map.getSource('ooh-markers').loaded()` → **`false`**, `._isUpdatingWorker` → **`true`**, permanently, regardless of how long the page sits idle. `._pendingWorkerUpdate.data` held the fully correct 783-feature FeatureCollection (real coordinates, real types, real status) — the data reaches the source correctly; it is the source's own tile-processing pipeline that never completes.

## ROOT_CAUSE (CONFIRMED via live network capture + maplibre-gl library source tracing)
`maplibre-gl` resolves its worker script at runtime by string-appending the literal filename `maplibre-gl-worker.mjs` next to its own bundled chunk's `import.meta.url` (`node_modules/maplibre-gl/dist/maplibre-gl-dev.mjs`'s `defaultWorkerUrl()`). Vite's content-hashed build output never produces a file at that literal, unhashed name — every chunk gets a `-<hash>` suffix. Direct network capture on production caught the exact request: `GET https://oohearth.app/assets/maplibre-gl-worker.mjs` → **404**. `GeoJSONSource._dispatchWorkerUpdate()` awaits `(await this.actorPromise).sendAsync(...)` against a Worker that never successfully loaded any script — the promise never resolves and never rejects, so `_isUpdatingWorker` never clears and **no error is ever surfaced to the console**, on any browser, any device.

## WHY_PREVIOUS_P0_FIX_DID_NOT_SOLVE_IT
Completely different subsystem — the P0 fix retries/dedupes the plain HTTPS `Location` REST fetch. This bug is entirely inside MapLibre's own client-side worker-resolution mechanism, several layers downstream of that fetch already having succeeded.

## WHY_FLAT_MODE_WORKS
`LocationMap.jsx` uses `react-leaflet`/Leaflet, a completely separate mapping library that renders markers as plain DOM elements (`L.marker()`) — it has no GeoJSON-vector-tile worker pipeline at all, so it was never exposed to this bug.

## WHY_HOME_AND_MAP_GLOBE_FAIL
Both render through the same shared `Globe3D.jsx` component (`GlobeSection.jsx` for Home, `Map.jsx`'s `view === 'globe'` branch for the Map page) — the identical MapLibre GL + GeoJSON-source + worker-resolution code path in both places.

## MOBILE_SPECIFIC_OR_GENERAL
**General — confirmed not mobile-specific.** Reproduced identically on desktop Chrome (1280px) and 3 mobile viewport widths (360/390-wide); the 404 is a build-artifact/library-integration issue independent of device or viewport. Dave's own reports (both mobile) happened to be the ones that surfaced it, but the same live 404 was captured on desktop during this investigation.

## FIX
`src/lib/maplibreWorkerSetup.js` — calls `maplibregl.setWorkerUrl()` once at module load (before any `maplibregl.Map` is constructed) with the worker script imported via Vite's `?worker&url` suffix, which makes Vite treat the file as a genuine worker entry point: it parses and bundles the worker's own internal import graph (`import ... from "./maplibre-gl-shared.mjs"`) into one self-contained chunk, and returns that chunk's real, correctly-hashed URL.

**A first fix attempt using a plain `?url` suffix (raw byte-for-byte asset copy, no parsing) was insufficient** — it resolves the outer 404, but the worker file's own internal relative import is preserved unrewritten in the raw copy, and that sibling chunk (`maplibre-gl-shared.mjs`) is never separately emitted under that name — a second, identically-shaped silent failure (worker script loads, then fails to import its own dependency; `loaded()` still never becomes `true`). Caught by direct instrumentation of the live `_isUpdatingWorker`/`loaded()` state after the first attempt, not assumed fixed from a clean build log alone.

Side-effect-imported from both `Globe3D.jsx` and `src/components/ooh/report/MediaCorpGlobe.jsx` — the only other file in the codebase that constructs its own independent `maplibregl.Map` with the identical vulnerable pattern (not reported by Dave; fixed proactively as the identical root cause, not a separate investigation).

## TESTS
New `e2e/globe-markers.spec.ts` (3 tests): Home globe renders real markers, Map's default globe view renders real markers, flat mode unaffected. Inspects the actual `maplibregl.Map` instance's `getSource('ooh-markers').loaded()` and `queryRenderedFeatures()` state directly (via the same fiber-walk technique used for live diagnosis) — not just canvas presence or a 200 on the `Location` fetch, since **both of those were already true before the fix and the bug was invisible to either**.

Broader regression: 9 map/location-related spec files (49 tests) run against the fix — 48 passed; 1 pre-existing, unrelated flake (`location-detail.spec.ts`'s cache-staleness test) confirmed to fail **identically on a clean, unmodified `origin/main` checkout** before investigating further — not a regression introduced by this fix.

`eslint`/`tsc --noEmit`/`prettier --check` all clean. CI's fresh `npm ci` + `tsc` run caught a real gap a locally-cached typecheck run initially missed (masked by a shell pipe silently swallowing the real exit code) — TS couldn't resolve the `?worker&url` import specifier at all (`TS2307`) since this project's `jsconfig.json` has no `vite/client` types reference. Fixed with a narrowly-scoped ambient module declaration (`src/types/vite-worker-url.d.ts`), matching this project's existing `src/types/*.d.ts` convention — a type-only file with zero runtime/bundle effect (confirmed: rebuilding after adding it produced a byte-identical entry-file hash to the already-deployed-and-verified artifact).

## DEPLOYMENT STATUS
**DEPLOYED TO BACKUP AND PRODUCTION, LIVE-VERIFIED ON BOTH, 2026-09-23.**
- BACKUP (`6a6748e009b947cb29591871`): live entry-file hash matched the inspected build exactly; Home globe, Map default globe view, flat mode, and cluster-click-to-expand interaction all confirmed rendering real markers/clusters at correct geographic positions, on both mobile (360×740 Android UA) and desktop; no new console errors; P0 request-dedupe and P0.1 anonymous-realtime-WebSocket gating both confirmed unaffected.
- Production (`6a62213cff3ccbca88c04ff5`): identical full verification matrix against the real 783-location dataset — individual pins plus correctly-positioned "3" and "36" clusters across Asia matching the known real data distribution; live entry-file hash matched exactly; P0 dedupe confirmed unchanged (2 `Location` fetch pairs per fresh load, matching the already-documented production baseline, not a new request-storm); anonymous realtime WebSocket attempts confirmed still zero.
- Git: PR #274, branch `fix/mobile-globe-markers`, off `origin/main` at `9964d11`.

## GIT RECONCILIATION, 2026-09-25
All 10 CI checks passed (Lint & Typecheck, Analyze/CodeQL, Prettier, Build, Dependency audit, Dependency Review, Playwright smoke+accessibility, Playwright mobile Chromium, PR summary comment) — `mergeStateStatus: CLEAN`. Squash-merged into `origin/main` at `0ed56883257f2ba684891b6380d21d70000e0adb`. Post-merge drift check: PR #274's base (`9964d11`) was already `origin/main`'s tip pre-merge, so this merge introduces no delta beyond the PR's own diff — the artifact already live in production since 2026-09-23 needed no redeploy.

## POST-MERGE BROWSER VERIFICATION, 2026-09-25 (AUTOMATED_MOBILE_VISUAL_VERIFICATION: PASS)
Chrome/Chromium was not installed in this session's environment (chrome-devtools MCP's own `--browserUrl http://127.0.0.1:9223` mode had nothing listening on that port). Resolved without any system-level install: Playwright's own bundled Chromium was already present at `~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome` (pulled in by this repo's existing Playwright/e2e setup), launched headless (`--headless=new --remote-debugging-port=9223 --no-sandbox --disable-gpu --user-data-dir=<scratchpad>`), then chrome-devtools MCP connected to it normally. No system package install, no sudo, no new software added.

**Method:** for each viewport, found the live `maplibregl.Map` instance via a React-fiber walk from `.maplibregl-canvas-container` (no public ref is exposed), then asserted `getSource('ooh-markers').loaded() === true` **and** `queryRenderedFeatures().length > 0` — the same direct-instrumentation technique used in the original 2026-09-23 verification, chosen because canvas presence / API 200s / nonzero counts were already proven insufficient (see FIRST_FAILING_STAGE above). Screenshots were also captured at each step as independent visual evidence.

- **Home, 390×844 (cold nav, mobile UA/touch/DPR3):** `sourceLoaded: true`, 6 rendered marker features on first paint. Globe is below the fold under the hero/stats section — confirmed by scrolling and re-screenshotting (`// ORBITAL ATLAS · 783 SPOTS · LIVE SYNC`, real Earth texture, visible clusters "3"/"36" plus a pin). Rotated the globe via synthetic touch-drag: center moved lng 100.55→168.77, markers still rendered post-rotation (5, hemisphere-appropriate) — geographic attachment confirmed, no disappearance.
- **Map default view (globe), 390×844 (cold nav to `/map`, no persisted state):** `sourceLoaded: true`, 5 rendered features, visible above the fold immediately (search bar → mode toggle → globe with real clusters "3"/"36" and a pin, `// 783 ADS` list below with a real Dior ad-scan card).
- **Map flat mode:** switched via the real "Flat map" control — Leaflet container mounted, MapLibre canvas unmounted, 27 real marker DOM elements, satellite imagery with photo-thumbnail clusters ("2"/"6"/"4"/"15") — matches Dave's known-good baseline exactly.
- **Flat → Globe (lifecycle/reinit check):** switched back via "Globe view" — re-mount succeeded, source reloaded (`loaded(): true`), 2 marker features rendered on the post-remount hemisphere, no `_isUpdatingWorker` hang, no worker 404.
- **360×800 and 412×915 (Map default globe, cold nav each):** both `sourceLoaded: true`, 5 real rendered features each, screenshots confirm clean rendering with no clipping/overflow at either width.
- **Landscape smoke (412×915 rotated to 915×412):** no horizontal overflow, but the globe container is squashed to ~150px tall between the search bar and bottom sheet — a real, separate, minor mobile-landscape layout issue (not a data/rendering regression; noted below, not blocking this closure).
- **Location Detail:** clicked a real "> PAGE →" card link from the Map list → navigated to `/location/6a994a13ce43f0d2423db127`, rendered cleanly (photo, brand, mini-map), zero console errors.
- **Marker tap/click interaction:** attempted via synthetic `TouchEvent`/`PointerEvent` dispatch at the exact projected screen coordinates of both a cluster and a single point feature; **did not reliably trigger MapLibre's internal click-synthesis** (0 popups before/after; a cluster tap produced no `flyTo` zoom change). Read `Globe3D.jsx:308-351` and confirmed the click/cluster-expand handlers are correctly wired in source. This is judged a synthetic-input tooling limitation (no `isTrusted` native event, no OS-level gesture recognition) rather than an app regression — real touch/pointer-driven interaction was already live-verified end-to-end during the original 2026-09-23 deployment gate. **Not independently re-confirmed this pass**; flagged honestly rather than claimed as PASS.
- **Slow-network:** Slow 3G (the same condition used in the original P0 reproduction) — cold nav resolved in ~2ms to found+loaded, 4 real markers, no error state. Fast 3G — same result. One combined **Slow 4G + 4× CPU throttle** run crashed to the app's error boundary (`Unable to preload CSS for /assets/maplibre-gl-DvulA2N7.css`), traced to `net::ERR_QUIC_PROTOCOL_ERROR`/`ERR_NETWORK_CHANGED` in the console — a known Chrome DevTools Protocol artifact where CDP-level throttling corrupts in-flight QUIC/HTTP3 connections; this is a test-harness interaction, not a realistic degraded-network condition (immediately retried, non-reproducing, under lighter/more realistic throttle profiles). Worth a generic resilience note (lazy-loaded route chunks have no retry on a failed CSS/JS preload, so *any* transient network drop during code-splitting — real or synthetic — hard-fails to a full-page error boundary instead of retrying), but out of scope for this P0 and not required to close it.
- **Console/network evidence (all viewports):** worker resolves `200` (`/assets/maplibre-gl-worker-CJfwIrte.js`, ~487KB); legacy unhashed `/assets/maplibre-gl-worker.mjs` still 404s (correctly unused); zero MapLibre/WebGL fatal errors (only a benign "software WebGL fallback" warning specific to this headless/SwiftShader test environment, not expected on Dave's real hardware-accelerated mobile Chrome); zero anonymous WebSocket construction attempts (P0.1 gating intact); `Location?...limit=500` fetch pairs bounded (2 per fresh `/map` load, matching the documented production baseline — P0 dedupe intact); only pre-existing, already-documented noise otherwise (anonymous `User/me` 401, session-recordings 429 quota).
- **New, separate, minor finding (not P0, not globe-related):** 5 full-resolution image URLs (`media.base44.com/images/public/.../<hash>.jpg`, no resize suffix) 404, while their resized `-768x...` siblings 200 on the same underlying files. Flagged for Dave separately; does not affect this incident's closure.

**Screenshots saved** (session scratchpad, not committed): Home 390 (hero + scrolled-to-globe + post-tap), Map 390 default-globe/flat/flat-to-globe, Map 360 globe, Map 412 globe + landscape, Location Detail 390.

**Conclusion:** the Dave-reported defect (zero visible globe markers on Home and Map) is browser-verified resolved across 3 mobile viewports plus one landscape smoke, using the same direct-instrumentation acceptance bar as the original fix verification, not proxy signals. `DAVE_PHYSICAL_DEVICE_CONFIRMATION: PENDING` — this is automated verification only, not a substitute for Dave retesting on his own phone.

## DATA_LOSS
**NO.** Purely a client-side rendering/worker-resolution defect — no backend data was ever missing, deleted, or corrupted; the underlying `Location` records were always correct and always fully fetched.
