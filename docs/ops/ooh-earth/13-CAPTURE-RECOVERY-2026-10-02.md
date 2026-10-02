# Capture recovery and release qualification — 2026-10-02

## Qualified release

Owner terminal reports 16/16 Chromium tests passed against live BACKUP with one worker and retries disabled at `7f58ce9`. This covers forced WebGL2 recovery, normal globe markers/geometry, mobile activity and heat. Earlier six-worker run failed 11/14; concurrency is a possible contributor, not a proven root cause. Exact-head CI run 36902037859 and CodeQL 36902037871 succeeded. #319 merged as `31617284a289c62d8a8cb312fc4d70c079c5a746`.

Fresh merged-source production entry: `assets/index-D7jCRmhl.js`; SHA256 `d8aca1f8dd214ca9c71293287a4a94192c2c55c8526cb55c2107d17615fa59e7`; SDK appId `6a62213cff3ccbca88c04ff5`, BACKUP string hits zero. No deployment initiated from Work. Previous Base44 API execution-policy denial prevents deployment here. Production live reconciliation remains a separate gate.

## Bounded audit

Goal: recover field capture when camera/location are unavailable, without losing place context. Current-run cloud Chromium at 1363×936, anonymous BACKUP, was used. No real user location supplied; public test coordinates were typed without submission.

| Step | Health | Evidence |
| --- | --- | --- |
| 1. Map → Capture | Works | Visible capture action opens named, focus-trapped modal; exact screenshot capture-01-map.jpg |
| 2. Camera/location unavailable | Recovery offered | Gallery and manual coordinate fields appear; exact screenshot capture-02-recovery.jpg |
| 3. Fill both coordinates | Defect confirmed | Manual inputs removed and focus moves to page root; exact screenshot capture-03-hidden-inputs.jpg |

Screenshots are current-run local audit attachments, not historical screenshots. Camera hardware, actual geolocation, upload, submission and authenticated states were not exercised. No upload or contribution submission was initiated. This is a bounded recovery audit, not full capture-loop or accessibility certification.

## Root cause and candidate

`QuickCapture.jsx` renders manual inputs only while latitude or longitude is empty. The first character in the second field removes both fields; corrections and negative-coordinate typing can be interrupted. Candidate tracks whether coordinates were manually edited, keeps those fields visible, and assigns stable accessible names. Successful geolocation and reset clear manual mode. Existing upload, submission, offline queue, identity, moderation and privacy semantics are unchanged.

Three responsive browser regression cases type a negative longitude character by character, assert focus/value retention, edit latitude, check overflow and verify no entity mutation requests. Browser execution must complete in CI; local browser unavailable. Local lint/typecheck pass; build/format validation recorded separately. No new schema/vendor/permission/function or backend work.

Next: qualify this candidate on BACKUP after CI, then serialize its release after #319. Continue the existing Place → Contribution loop without inventing public creative publishing or social graph infrastructure.

## Fresh production observation

Public check at the end of this pass finds production entry `assets/index-D00a9FXq.js`, SHA256 `8a497bad076918554120b7b72f4b5af2506949276a0f096e29de2febb105711b`; Globe3D `Globe3D-BJEfLZs5.js`. Runtime SDK targets production with zero BACKUP references. Live release manifest identifies merged #318 (`133e9db`) rather than previous #308. This deployment was not performed by Work. Do not assume the earlier production artifact remains current; reconcile the #318 build before recommending the #319 deploy. Manifest fields alone do not establish rendered release qualification.

Fresh #318-targeted build produces the same `index-D00a9FXq.js` entry and SHA256 as live production. The entry is reconciled byte-for-byte. This removes source ambiguity for the pending #319 frontend release; it does not substitute for rendered production QA.

## Owner deployment and current live proof

Owner attachment `Pasted text(20261002-104011).txt` records successful frontend-only production deployment from pinned #319 merge in `/tmp/tmp.YaCwdsSQqU`, after the entry hash guard passed. Fresh public production entry is `/assets/index-D7jCRmhl.js`, SHA256 `d8aca1f8dd214ca9c71293287a4a94192c2c55c8526cb55c2107d17615fa59e7`. Live manifest identifies `31617284a289c62d8a8cb312fc4d70c079c5a746`. Entry and Home-D9J_DvYd, Map-DyQwRnAb, Globe3D-DQhI618A, LiveActivityFeed-Ax881eaI chunks match the clean merged-source build byte-for-byte. Earlier #318 production observation is superseded.

Cloud Chromium 1363×936 without WebGL2 renders Home normally with a 44px field-map recovery link. Clicking navigates to `/map`: Leaflet container 723×657.21875, 23 marker DOM elements, visible real clusters/thumbnails, no document overflow and no page error boundary. Console inspection finds known session-recordings 429 and browser-extension metadata failures, no application error entries. Current-run screenshot `production-319-flat.jpg` captured and inspected. No upload, capture submission or entity mutation was initiated; comprehensive network mutation monitoring was unavailable. Full responsive supported-device and authenticated production QA are not claimed; owner serial production regression remains pending.

## #322 landscape overlap — found, root-caused, fixed (this pass)

**Original failed QA result (preserved):** PR #322's own CI (`Playwright (smoke + accessibility)`, run `36997083892`, retried 3×) failed `capture-manual-coordinates.spec.ts` at 844×390 only: `locator.click` on "Capture photo" timed out after 30s, with Playwright reporting `<div class="flex justify-center pt-2">…</div> from <div class="ooh-bottom-sheet …">… subtree intercepts pointer events`. 361 other tests passed. The manual-coordinate editing fix itself was never exercised at that viewport because the click never landed.

**Root cause, measured locally** (isolated worktree, rebuilt `dist`, fresh `vite preview`, `page.evaluate` `getBoundingClientRect()` — no guessing from source alone):
- The "Capture photo" button sits at a viewport-height-independent `top:176px, bottom:210px` (it's `position:absolute` inside an ancestor anchored to the header, not to `100vh`).
- `MapBottomSheet`'s default "peek" state used a fixed `132px` height plus a fixed `76px` bottom-nav offset, so its top edge is at `vh - 208`.
- At `vh=375/390/412` that put the sheet's top edge at `167/182/204` — above the button's `210` bottom edge, so the sheet's (opaque, `z-[1100]`) drag-handle visually and physically covered the button. At `vh=430` the sheet's top edge (`222`) already cleared the button by `12px`, which is why wider short-landscape viewports looked fine and the collision was easy to miss.
- Confirmed by direct measurement, not inference: `667×375` gap `-43px`, `844×390` gap `-28px`, `844×412` / `915×412` gap `-6px`, `932×430` gap `+12px`, portrait and desktop (`lg:hidden` hides the sheet) unaffected.

**Fix:** `MapBottomSheet.jsx`'s peek height is now `Math.min(132, Math.max(64, vh - 294))` — unchanged (`132px`) above `~430px` tall, shrinking on shorter viewports to keep a constant `8px` clearance below the floating controls. Re-measured after the fix: `375`→gap `8`, `390`→gap `8`, `412`→gap `8`, `430`→gap `12` (unchanged), portrait `805`→gap `386` (unchanged), desktop unaffected (sheet not laid out). Real (non-force) clicks now land at every measured short-landscape height.

**Test coverage added**, not just a click-retry workaround: `capture-manual-coordinates.spec.ts` now also covers `844×412` (the tightest pre-fix margin short of outright overlap) and asserts, numerically, that the Capture button and `.ooh-bottom-sheet` have zero intersection and ≥8px gap before clicking — so a future regression fails on geometry, not a flaky timeout.

**Verification performed:**
- Local reproduction of the exact CI failure (same timeout, same intercepting element) on the unfixed branch.
- `npm run lint`, `npm run typecheck`, `npm run format:check` — clean.
- Production build — succeeds; no dependency/schema/function changes.
- `capture-manual-coordinates.spec.ts` (all 4 viewports) — pass. One transient desktop-viewport typing failure during a loaded run was not reproducible in 4 subsequent isolated/full-suite runs (consistent with this host's heavy concurrent-session load, not a code defect) — recorded here rather than silently dropped.
- Full `e2e/map-landscape-layout.spec.ts` (both existing landscape viewports), `map-fieldcheck-freshness.spec.ts`, `map-my-discoveries.spec.ts`, `map-contribution-highlight.spec.ts`, `heat-layer-click-handoff.spec.ts` — 15/15 pass; no marker geometry, popup collision, WebGL recovery, or mobile-activity regression.
- Not yet done: PR head CI (push pending), BACKUP target proof/deploy, rendered BACKUP QA. No production action taken or needed for this frontend fix until it clears BACKUP qualification and is merged.

No backend, schema, permission, vendor, or production-data change. No deployment performed in this pass.

## #322 qualified: exact-head CI green, BACKUP deployed and rendered-verified

Pushed rebased head `e046f7e3ed51d6d1005ae0e9fddb79d71d823521` (onto merged `#323`, `5ca1644`). All 9 required checks passed at this exact head, including `Playwright (smoke + accessibility)` (the suite that previously failed this spec) at 13m24s. `mergeStateStatus: CLEAN`.

Built with `VITE_BASE44_APP_ID=6a6748e009b947cb29591871`; true entry `assets/index-B31vTGEn.js` contains the BACKUP SDK `appId` once and zero production-id hits. Deployed via `base44 site deploy --no-build --yes --app-id 6a6748e009b947cb29591871`. Live entry byte-for-byte identical to the local build (706894 bytes, direct diff).

Rendered QA on live BACKUP (`ooh-earth-backup.base44.app`), real viewport 844×390, via a real browser (chrome-devtools MCP, not curl):
- Measured in-page geometry: Capture button `bottom:210`, sheet `top:218` — 8px gap, matching the local prediction exactly.
- `document.elementFromPoint()` at the button's center resolves to the button's own label span (contained within the button), not the bottom sheet — confirms no pointer-event interception at this viewport.
- Opened the real QuickCapture modal via the button, typed `40.7484` into Latitude, then focused Longitude and typed `-` as the very first character (the exact trigger for the original defect) — both fields kept their values (`40.7484` / `-`), then completed to `-73.9857`. This is the live, deployed artifact exhibiting the fix, not just the local test suite.
- No horizontal overflow. One console error: anonymous `401`, the same benign auth-probe pattern already documented elsewhere in this repo's QA history — not an application error, not an entity write.

**Not yet done:** production deployment. Per `plan.md`'s SHIP lane, #319's own production regression gate ("full responsive supported-device production Playwright check") is still open, and only one production candidate is carried at a time — #322's production release is serialized behind that, not blocked by anything in #322 itself. PR #322 is undrafted and ready to merge on this evidence; merging to `main` is a pre-production step (GitHub only) and does not deploy anything.
