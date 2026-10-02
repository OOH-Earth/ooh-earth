# OOH Earth connected-product execution plan

Updated 2026-10-02. Follow `brain/PRODUCT.md`, `brain/INVARIANTS.md` and the owner sprint handoff. This plan tracks active work; historical merge plans do not define the current queue.

## SHIP — one production candidate

- [x] Close #308 through owner geometry evidence and source/build/live reconciliation.
- [x] Merge #321 security lock fix; audit zero high/critical.
- [x] Qualify #319 on BACKUP: owner serial Chromium 16/16; exact-head CI and CodeQL pass; merge `3161728`.
- [x] Build merged source for production; true entry `index-D7jCRmhl.js` targets production with no BACKUP references.
- [x] Reconcile newly observed production #318 entry byte-for-byte with a fresh #318 build.
- [x] Owner-terminal frontend-only #319 production deploy from the pinned merge.
- [x] Reconcile live #319 manifest, entry and four feature chunks byte-for-byte; desktop unsupported-device recovery and Flat rendering pass.
- [x] Full responsive supported-device production Playwright check — CLOSED 2026-10-02. #323 (test-only, tree-identical head `0ed533c`/merge `5ca1644`) split the shared 60s viewport budget and fixed glyph-sprite timing; owner reran the corrected 26-test suite (`globe-unavailable`, `globe-markers`, `home-globe-marker-artifact`, `live-activity-mobile`, `heat-layer`) against live `https://oohearth.app`, exact commit `0ed533c`: 26/26 passed, one worker, zero retries, tracing on, 4.3 min. Original 13/16 result and artifacts retained as superseded historical evidence (`docs/ops/ooh-earth/14-PRODUCTION-REGRESSION-2026-10-02.md`); original traces were never inspected, so the 3 earlier failures' exact cause stays unproven, not claimed fixed by inference.
- [x] #322 (manual capture coordinates + landscape overlap fix) merged as `20db711f9b322ea3d6dc9b38caf2fc92b7ee2bc7` — exact-head CI/CodeQL green (both the PR head `f9c7af9` and the main-branch merge commit), BACKUP-deployed and rendered-QA'd. See `docs/ops/ooh-earth/13-CAPTURE-RECOVERY-2026-10-02.md`.
- [ ] #322 production release: pinned build, target-id proof, frontend-only deploy, post-deploy artifact verification, serial zero-retry regression (capture + the 5 globe/recovery/activity/heat suites) against live production. Requires owner's terminal (Base44 `site deploy` to the production app id is denied here by the sandbox/auto-mode classifier — not attempted a second time; see below). **PENDING** — live production is still #319's build (`index-D7jCRmhl.js`, confirmed 2026-10-02); no deployment output or evidence has been supplied yet. The pinned, reviewed, copy-paste-safe deploy script is with the owner. This candidate stays pinned at `20db711f` — built and deployed from that exact commit, not rebuilt from a later `main`, so later merges (#324 docs, #325 gallery fix) never silently ride along.

## BUILD — Sprint 1/2 bounded capture recovery — CLOSED into SHIP

- [x] Reproduce manual-coordinate inputs disappearing as soon as both are populated.
- [x] Implement editable manual recovery and accessible field names in an isolated branch.
- [x] Root-cause and fix the 844x390 CI blocker (short-landscape results sheet covering Capture); rebase onto #323; 15/15 adjacent geometry regressions pass. See `docs/ops/ooh-earth/13-CAPTURE-RECOVERY-2026-10-02.md`.
- [x] Exact-head CI green (9/9, incl. previously-failing Playwright smoke+accessibility); BACKUP target-proof/deploy; rendered BACKUP QA (real click, real geometry, real manual-coordinate retyping) — PASS. Merged `20db711f`.
- [x] #319 SHIP candidate's responsive QA gate closed (above) — #322 production release is now the active SHIP candidate; see pinned deploy block provided to the owner.

## AUDIT — connected journey

- [x] Inspect Map → Capture entry and camera/location unavailable recovery on BACKUP.
- [x] Gallery → pending Contribution → verification context: found and fixed PhotoGallery.jsx silently dropping each photo's own `status`, so a pending/rejected row looked identical to a verified one to its creator/admin (the only viewers who can see it at all). PR #325 merged `4717841`, 9/9 required checks green at exact head. **Merged and CI-verified only** — not BACKUP-qualified, not production-deployed; it is not part of #322's pinned SHIP candidate above and rides into BACKUP/production in whatever release follows it.
- [ ] Audit Location Detail → Mission Board → Field Record → Activity links and responsive states, selecting only evidenced bounded fixes.

## DESIGN — checkpoints

- [x] Prepare Live Canvas separation/provenance/ownership package (#320).
- [ ] Owner decisions before public creative publishing, new schemas, Trails, Crews, Connections or persistent AR observations.

Preserve closed popup/glyph/worker/security work. Keep PERF-OBS-1, entity-manifest mismatch, function typecheck and production defence-in-depth schema drift in their own scopes.
