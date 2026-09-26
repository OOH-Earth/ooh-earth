# NOW — current truth only

Last verified: 2026-09-25 (fresh `git fetch` + live Base44/GitHub reads,
this pass, after UX-001's production deploy). Re-verify anything here
that's more than a few days old before acting on it.

## CURRENT_ORIGIN_MAIN
`c0d4e9c...` — "chore(deps-dev): Bump js-yaml from 4.3.1 to 4.3.2 (#248)"
— fresh `git fetch origin main`, 2026-09-25. This pass merged, in order:
#217, #277 (UX-001), #254, #248, on top of the prior pass's #275/#276.
**#249 is CI-green and merge-ready but not yet merged** (kept going BEHIND
by each of the above landing first) — re-fetch before trusting any hash.

## PRODUCTION_FRONTEND
`oohearth.app` → app id `6a62213cff3ccbca88c04ff5` → entry
`index-DUsMZ812.js`. **Includes UX-001** (hover/focus emphasis) — the
first deploy attempt was denied by the sandbox classifier, a retry later
in the same pass succeeded. Live-verified on real production data (786
locations, not synthetic): row hover → `rgb(255, 0, 200)` border + map
hover-ring at the correct marker, screenshot evidence. No new console
errors from the deploy.

## BACKUP_FRONTEND
`ooh-earth-backup.base44.app` → app id `6a6748e009b947cb29591871` → entry
`index-gkrKNNwa.js` — matches UX-001's BACKUP build (superseded by
production now having the same feature; not redeployed further).

## ENTITY_SCHEMA_STATE
24/24 entities match by name across production/BACKUP/`origin/main`
(verified prior pass, 2026-09-25; not re-checked this pass — no
schema/entity change was made or proposed).

## FUNCTION_STATE
`origin/main` = 39 real functions, production has all 39 including
`scanAd`/`migrateLocationImages` at parity (SEC-001/SEC-002, closed prior
pass). BACKUP has 38 (missing `cleanupIntelCache`, low-risk, unchanged).

## OPEN_P0
None.

## CURRENT_SECURITY_GAPS
**NONE OPEN in application code.** SEC-001/SEC-002 closed prior pass, full
public writeup in `docs/ops/ooh-earth/04-SECURITY-QUEUE.md`.

**Dependency vulnerability, FIXED THIS PASS:** GitHub Dependabot flagged a
HIGH-severity js-yaml issue (`maxTotalMergeKeys` CPU-exhaustion,
`.../security/dependabot/22`) on `main` — identified via `gh api
.../dependabot/alerts`, confirmed the vulnerable range (`>=4.0.0, <4.3.2`)
and first-patched version (`4.3.2`) directly from GitHub's advisory data
before merging, then merged PR #248 (the exact matching bump) rather than
treating it as a routine dependency PR. Re-check the alerts endpoint to
confirm it now shows resolved.

**CI/workflow hardening, FIXED THIS PASS:** PR #254 — the
`lynxie-publish-pr-head.yml` executor's checkout confusion (it read
manifest/patch files from the mutable target PR branch instead of the
immutable dispatching commit) and a script-injection risk pattern (raw
`${{ inputs.x }}` interpolation in `run:` blocks) were both real —
verified via an independent diff read-through (see `QUEUE.md` GIT-001),
not just trusting the PR body. Merged.

## CURRENT_RELEASE_BLOCKERS
None active. (UX-001's production deploy denial cleared on retry this
pass — see `CURRENT_UI_FEEDBACK`. `gh pr merge`/branch-update behavior
stays inconsistent day to day; verify live each time, don't assume from a
prior session's notes.)

## CURRENT_PRODUCT_DECISIONS (awaiting Dave, not re-litigated)
- AdObservation (multi-brand data model): recommended, deferred, low
  urgency — see `docs/ops/ooh-earth/09-MULTI-BRAND-DATA-MODEL.md`.
- Founding Profile directory: deferred, URL-only stays current —
  `docs/ops/ooh-earth/10-FOUNDING-PROFILE-DISCOVERY.md`.
- `fix/production-app-binding` branch (funnel/attribution feature, never
  opened as a PR): needs a decision on whether it's still wanted.
- **UX-004** (Carto tile watermark): decision package complete — see
  `QUEUE.md` — recommended: get the free Carto API key (Option A). Not
  implemented pending Dave obtaining the key.
- Whether #105's new Playwright test gets its wait-condition bug fixed in
  this engagement, and whether #188/#189/#190/#20/#39/#88/#191 (all real
  major-version dependency bumps) get a dedicated compatibility pass.

## CURRENT_UI_FEEDBACK (Dave — see `DAVE.md` for detail)
- **UX-001** (hover/marker emphasis): **CLOSED.** Implemented, BACKUP-
  verified, PR #277 merged, production-deployed and live-verified on real
  data.
- **UX-002** (marker/icon quality): **CLOSED.** Production-deployed, PR
  #276 merged, deployed bundle confirmed == merged `main`.
- **UX-003** (results-list "disappearance"): CLOSED, not a bug.
- **UX-004** (Carto watermark): decision package complete, awaiting Dave's
  API key.
- Overall Dave read: "good shape really" — not a redesign request.

## NEXT_TASK
GIT-001 (see `QUEUE.md` for full detail): #249 is CI-green, needs one more
update-branch+merge cycle. #192 was branch-updated once this pass but not
re-verified since — check fresh. #105 needs its new test's wait-condition
fixed (real bug, not a flake) before merge. #188/#189/#190/#20/#39/#88/#191
need a real major-version compatibility pass, not a merge-on-green. No
other UX/SEC item is open.

## NEXT_PRODUCTION_WRITE
None pending. (UX-001 was the last one; it's done.)

## HUMAN_CHECKPOINT
Dave needs to: (1) pick UX-004's fix direction / obtain the free Carto API
key, (2) decide on `fix/production-app-binding`, (3) decide whether #105's
test gets fixed in this engagement, (4) decide whether/when the
#188/#189/#190/#20/#39/#88/#191 major-version bumps get a dedicated
compatibility investigation.
