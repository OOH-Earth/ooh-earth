# OOH Earth connected-product execution plan

Updated 2026-10-02. Follow `brain/PRODUCT.md`, `brain/INVARIANTS.md` and the owner sprint handoff. This plan tracks active work; historical merge plans do not define the current queue.

## NEW (2026-10-08) — environment, place research, combined BACKUP candidate
- [x] #346 dependency lockfile bumps merged (`beadb98`); production audit 0, full tree 7 (Tailwind 3 chain, plan in #348).
- [x] #336 place research + focus correction merged (`7877f05`); #344 closed as superseded.
- [x] #342 observed Rivers merged (`4d7db21`); #343 Main Map trust correction merged (`9adcf92550245eb2401601380532e1eb77a5433f`).
- [x] Combined BACKUP candidate `4fb6cad` qualified: attempt 1 35/36 (failed, slow document), attempt 2 36/36, zero retries; real-provider check separate. `b57cc46` is historical evidence only.
- [ ] Owner physical-phone testing of the BACKUP candidate (not yet performed).
- [ ] Tailwind 4 migration (isolated, #348) and `ci.yml` job timeouts (own PRs).

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
- [ ] #322 production release: pinned build, target-id proof, frontend-only deploy, post-deploy artifact verification, serial zero-retry regression (capture + the 5 globe/recovery/activity/heat suites) against live production. Requires owner's terminal (Base44 `site deploy` to the production app id is denied here by the sandbox/auto-mode classifier — not attempted a second time; see below). **PENDING** — live production is still #319's build (`index-D7jCRmhl.js`, confirmed 2026-10-02); no deployment output or evidence has been supplied yet. The pinned, reviewed, copy-paste-safe deploy script is with the owner. This candidate stays pinned at `20db711f` — built and deployed from that exact commit, not rebuilt from a later `main`, so later merges (#324 docs, #325/#327/#328 fixes) never silently ride along.

### NEXT candidate, queued behind #322 (one production candidate at a time)
`main` at `629f5cc77de958f159ffdf6ddb4b984ac7671100` now also carries #325 (gallery status indicator), #327 (public field-route page), and #328 (concept preview) — each individually merged and CI-verified. **BACKUP-qualified 2026-10-02**: pinned build from exact commit `629f5cc7`, true entry `index-BYkkZOIF.js` (SDK targets BACKUP once, zero production references), manifest `git_sha` matches, live BACKUP artifact byte-identical (707148 bytes, direct diff). Rendered QA on live BACKUP: `/field-route` renders both empty and populated states correctly; `ConceptPreview` opens, shows the permanent CONCEPT·NOT LIVE label, the no-photo fallback, accepts a caption, and resets it on close — all exercised live, not just in the test suite; a real location was added to the field route via the live UI and appeared correctly on `/field-route` with a working "View on map" link. Zero console errors throughout. The gallery status-indicator feature (#325) was not independently re-exercised live (no pending-photo location existed on BACKUP without fabricating data) — relies on its existing 11/11 automated `ad-scanner.spec.ts` coverage, noted rather than overclaimed. **Still not production-deployed** — ships only after #322 is confirmed shipped (one production candidate at a time).

## BUILD — Sprint 1/2 bounded capture recovery — CLOSED into SHIP

- [x] Reproduce manual-coordinate inputs disappearing as soon as both are populated.
- [x] Implement editable manual recovery and accessible field names in an isolated branch.
- [x] Root-cause and fix the 844x390 CI blocker (short-landscape results sheet covering Capture); rebase onto #323; 15/15 adjacent geometry regressions pass. See `docs/ops/ooh-earth/13-CAPTURE-RECOVERY-2026-10-02.md`.
- [x] Exact-head CI green (9/9, incl. previously-failing Playwright smoke+accessibility); BACKUP target-proof/deploy; rendered BACKUP QA (real click, real geometry, real manual-coordinate retyping) — PASS. Merged `20db711f`.
- [x] #319 SHIP candidate's responsive QA gate closed (above) — #322 production release is now the active SHIP candidate; see pinned deploy block provided to the owner.

## AUDIT — connected journey

- [x] Inspect Map → Capture entry and camera/location unavailable recovery on BACKUP.
- [x] Gallery → pending Contribution → verification context: found and fixed PhotoGallery.jsx silently dropping each photo's own `status`, so a pending/rejected row looked identical to a verified one to its creator/admin (the only viewers who can see it at all). PR #325 merged `4717841`, 9/9 required checks green at exact head. **Merged and CI-verified only** — not BACKUP-qualified, not production-deployed; it is not part of #322's pinned SHIP candidate above and rides into BACKUP/production in whatever release follows it.
- [x] Audit Location Detail → Mission Board → Field Record → Activity links and responsive states, selecting only evidenced bounded fixes — CLOSED 2026-10-02. Found the public "field route" (Map.jsx/LocationDetail.jsx "Add to field route," anonymous-friendly, sessionStorage only) had no viewer any non-agency visitor could reach: its only render path, `FieldMissionPanel`, lives inside `PortalOps` behind an `isAgency` gate. An existing test (`e2e/intelligent-map.spec.ts`) literally asserted the broken `/portal/ops?section=geo` href as correct. Fixed with a new public `/field-route` page reading the same sessionStorage shape directly; repointed both dead-end links. Deliberately left the separate ops-to-ops "Return to mission" banner untouched (reached only from inside PortalOps's own panel, works correctly). PR #327 merged `629f5cc7`, 9/9 required checks green at exact head (re-verified after two required branch updates for #326/#328). **Merged and CI-verified only** — not BACKUP-qualified, not production-deployed.
- This closes every item explicitly listed in this AUDIT lane. No further audit item is open; the broader Sprint-1 surface (Home, Orbital Atlas, Profile, Progress) named in the program brief has not been separately queued here — a new AUDIT item for it needs an explicit decision, not an assumption.

## DESIGN — checkpoints

- [x] Prepare Live Canvas separation/provenance/ownership package (#320).
- [x] Implement #320's own authorized "safe next step": a nonpersistent, local-only concept preview (existing cover photo + permanent "CONCEPT · NOT LIVE" label + ephemeral caption in component state, zero storage/backend/entity calls, zero save/share/export/publish action). PR #328 merged `46268d83`, 9/9 required checks green at exact head. **Merged and CI-verified only** — not BACKUP-qualified, not production-deployed.
- [ ] Owner decisions before public creative publishing, new schemas, Trails, Crews, Connections or persistent AR observations. Proposed future policies (moderation-queue reuse, creator notifications, derivative cascades, attribution-only dispute handling) remain **unvalidated proposals** requiring their own design/dependency assessment — not implemented, not assumed to work with existing infrastructure.

Preserve closed popup/glyph/worker/security work. Keep PERF-OBS-1, entity-manifest mismatch, function typecheck and production defence-in-depth schema drift in their own scopes.

## NEW PRIORITY — Hackers Club (owner request, 2026-10-05)

Purpose: bring artists, makers and ethical researchers into the real-world discovery/action loop. First bounded slice: public `/hackers-club`, three actionable briefs, a local poster concept editor, permission-based field planning and an authorised-research scope checklist. Menu discovery and per-route metadata included.

Status: implementation candidate only, not merged/BACKUP-deployed/production-shipped. No membership records, public uploads, messaging, location tracking, active security tools, new permissions or entities. Poster text/colour use component state only; reload clears them. Existing application telemetry is unaffected; no claim of app-wide zero writes.

Next: exact-head CI; responsive/keyboard/a11y browser checks; BACKUP targeting and artifact proof; rendered BACKUP QA. Then give Dave the verified preview link, what changed and three things to try. Preserve the existing pinned release queue; do not include this feature silently in #322 or the combined follow-up candidate.
