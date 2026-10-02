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
- [ ] Full responsive supported-device production Playwright check. Do not report new feature completion to Dave before this gate.

## BUILD — Sprint 1/2 bounded capture recovery

- [x] Reproduce manual-coordinate inputs disappearing as soon as both are populated.
- [x] Implement editable manual recovery and accessible field names in an isolated branch.
- [x] Root-cause and fix the 844x390 CI blocker (short-landscape results sheet covering Capture); rebase onto #323; 15/15 adjacent geometry regressions pass. See `docs/ops/ooh-earth/13-CAPTURE-RECOVERY-2026-10-02.md`.
- [x] Exact-head CI green (9/9, incl. previously-failing Playwright smoke+accessibility); BACKUP target-proof/deploy; rendered BACKUP QA (real click, real geometry, real manual-coordinate retyping) — PASS. Undrafted, ready to merge.
- [ ] Serialize its production release after the #319 SHIP candidate's responsive QA gate closes.

## AUDIT — connected journey

- [x] Inspect Map → Capture entry and camera/location unavailable recovery on BACKUP.
- [ ] Continue gallery → existing Place → pending Contribution → verification context with mocked browser tests; no synthetic production data.
- [ ] Audit Location Detail → Mission Board → Field Record → Activity links and responsive states, selecting only evidenced bounded fixes.

## DESIGN — checkpoints

- [x] Prepare Live Canvas separation/provenance/ownership package (#320).
- [ ] Owner decisions before public creative publishing, new schemas, Trails, Crews, Connections or persistent AR observations.

Preserve closed popup/glyph/worker/security work. Keep PERF-OBS-1, entity-manifest mismatch, function typecheck and production defence-in-depth schema drift in their own scopes.
