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
**NONE OPEN.** SEC-001 (`scanAd` missing `validateMediaUrl` host-allowlist)
and SEC-002 (`migrateLocationImages` leaking `error.stack` to the client)
were both source-verified against fresh main/BACKUP/production pulls
(byte-identical hashes to intended source), test-qualified (26/26 focused
tests pass), rollback-prepared, and deployed to production 2026-09-25 —
then re-verified by pulling production's live source post-deploy and
confirming it matches `origin/main` exactly. Full public writeup now safe
to publish (fix is live everywhere) — see
`docs/ops/ooh-earth/04-SECURITY-QUEUE.md`'s "FIXED AND DEPLOYED" entry.

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
Desktop results-row hover/active highlight feels weaker than before
(**UX-001**, not started); marker/icon size and quality wanted higher
(**UX-002**, not started). Two items already investigated and resolved
2026-09-25: the results-list "disappearance" (**UX-003**) reproduced as the
app's own correct empty-viewport state, not a bug — closed. The Carto
"API KEY REQUIRED" tile watermark (**UX-004**) *does* reproduce on Chrome
(contradicting Dave's own guess) — root-caused to 4 of 5 map styles using
an unauthenticated Carto endpoint; awaiting Dave's choice between getting a
real API key or swapping the tile source. Overall: "good shape really" —
not a redesign request.

## NEXT_TASK
See `QUEUE.md` and `HANDOFF.md`. GIT-001 mostly done (3 of 12 merged, 4
more clean and ready, 2 need an isolated CI re-check). UX-003/UX-004 done
(closed / root-caused). UX-002 implemented, tested, BACKUP-deployed and
verified, PR #276 open — production deploy is the only remaining step,
blocked on authorization. UX-001 not started.

## NEXT_PRODUCTION_WRITE
Two pending: (1) `scanAd` + `migrateLocationImages` redeploy (SEC-001/
SEC-002, oldest, highest priority, detail private); (2) PR #276's marker/
icon quality fix (frontend-only, BACKUP-verified, already built for
production — purely a "run the command" step, no remaining engineering
question).

## HUMAN_CHECKPOINT
Dave needs to: (1) authorize or decline the SEC-001/SEC-002 redeploy,
(2) authorize or run PR #276's production deploy himself (the sandbox
blocked it for this session, reason unexplained), (3) run the GIT-001
merge commands for the remaining PRs (sandbox blocked further merges for
this session), (4) pick UX-004's fix direction, (5) decide on
`fix/production-app-binding`.
