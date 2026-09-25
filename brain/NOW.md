# NOW — current truth only

Last verified: 2026-09-25 (fresh `git fetch` + live Base44 reads). Re-verify
anything here that's more than a few days old before acting on it.

## CURRENT_ORIGIN_MAIN
`0ed56883257f2ba684891b6380d21d70000e0adb` — "fix(globe): resolve maplibre-gl
worker 404 breaking all globe markers (#274)". **Correction from a prior
session's brief**: a docs commit (`ea1fa8e`) was reported as "origin/main" —
that commit only ever existed locally on the dirty `feat/weather-context-v1`
checkout and was never pushed. Always `git fetch origin main` and trust that,
not a hash quoted in a prompt.

## PRODUCTION_FRONTEND
`oohearth.app` → app id `6a62213cff3ccbca88c04ff5` → entry `index-B-AnR6ZB.js`.
Matches `origin/main` at `0ed5688`. No drift.

## BACKUP_FRONTEND
`ooh-earth-backup.base44.app` → app id `6a6748e009b947cb29591871` → entry
`index-DXxhGwtV.js`. Matches its last verified deploy. No drift.

## ENTITY_SCHEMA_STATE
24/24 entities match by name across production/BACKUP/`origin/main`. Every
named security invariant (see `INVARIANTS.md`) verified byte-identical across
all three, 2026-09-25. No drift.

## FUNCTION_STATE
`origin/main` = 39 real functions. Production has all 39. BACKUP has 38
(missing `cleanupIntelCache` only — low-risk, not investigated further).
**`scanAd` and `migrateLocationImages` are behind on production** — see
`CURRENT_SECURITY_GAPS` below and `docs/ops/ooh-earth/04-SECURITY-QUEUE.md`.
`moderate`/`getPublicProfile`/`claimLead`/`n8nPing` all clean (n8nPing is
packaged differently on production — single bundled file vs. multi-file
source — but the logic is a verified-faithful port, not drift).

## OPEN_P0
None. Globe-markers incident closed (PR #274, browser-verified across
360×800/390×844/412×915 + landscape). Dave's own physical-device retest is
still pending but is **not an engineering blocker**.

## CURRENT_SECURITY_GAPS
- **SEC-001 / SEC-002**: two production functions are behind already-hardened
  source that exists on `origin/main` and is already live on BACKUP; one is
  security-relevant. **This repo is public — exact mechanism/impact detail
  is deliberately not written here or in `docs/ops/`; it's kept in private
  notes with the project owner pending the fix.** Both are prepared-but-not-
  executed redeploys of already-tested code, no new code needed. See
  `docs/ops/ooh-earth/04-SECURITY-QUEUE.md`'s redacted public entry, and ask
  the project owner directly for the full technical writeup if you need it
  to prepare the deploy.

## CURRENT_RELEASE_BLOCKERS
- This session's sandbox denies `gh pr merge` for a batch with reason
  "Merge Without Review" — a human must run the merge commands themselves.
  See `QUEUE.md` GIT-001.
- Production function/schema/security writes require explicit human
  authorization in this engagement — never autonomous, regardless of how
  well-qualified the fix is.

## CURRENT_PRODUCT_DECISIONS (awaiting Dave, not re-litigated)
- AdObservation (multi-brand data model): recommended, deferred, low
  urgency — see `docs/ops/ooh-earth/09-MULTI-BRAND-DATA-MODEL.md`.
- Founding Profile directory: deferred, URL-only stays current —
  `docs/ops/ooh-earth/10-FOUNDING-PROFILE-DISCOVERY.md`.
- `fix/production-app-binding` branch (funnel/attribution feature, never
  opened as a PR): needs a decision on whether it's still wanted before
  anyone invests in reviving it.

## CURRENT_UI_FEEDBACK (Dave, this pass — see `DAVE.md` for detail)
Desktop results-row hover/active highlight feels weaker than before;
marker/icon size and quality wanted higher; possible (unconfirmed, "maybe
random") results-list disappearance; one non-Chrome sighting of Carto
"API KEY REQUIRED" tiles, not reproduced on Chrome. Overall: "good shape
really" — not a redesign request.

## NEXT_TASK
See `QUEUE.md`. In order: SEC-001/SEC-002 authorization package (prepared,
awaiting Dave) → GIT-001 fresh PR audit and merge of whatever's still safe
→ UX-003/UX-004 reproduction (cheap, read-only) → UX-001/UX-002 (real
implementation work, scope first).

## NEXT_PRODUCTION_WRITE
The `scanAd` + `migrateLocationImages` redeploy, pending Dave's
authorization. No other production write is proposed right now.

## HUMAN_CHECKPOINT
Dave needs to: (1) authorize or decline the SEC-001/SEC-002 redeploy,
(2) run the GIT-001 merge commands himself (sandbox blocks them for this
session), (3) decide on `fix/production-app-binding`.
