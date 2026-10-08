# Current state (reconciled 2026-10-08)

State vocabulary: **merged** (in `main`) / **CI-qualified** (exact-head required checks green) / **BACKUP-qualified** (deployed to BACKUP, bytes verified, rendered checks pass) / **production-shipped**. Only the first three are claimed below; nothing in this file is production-shipped.

## Merged to main since the pilot reconciliation (none deployed to production)
- #346 `beadb98` bounded lockfile bumps (moment, dompurify, source-map-js); audit: production 2 -> 0, full tree 10 -> 7. Doc 24.
- #336 `7877f05` place-research pilot + focus correction (includes everything #344 carried).
- #342 `4d7db21` observed Rivers (USGS, UK Environment Agency) with the request-cancellation/cache hardening.
- #343 `9adcf92550245eb2401601380532e1eb77a5433f` Main Map: mushroom/flora/conflict hooks are empty stubs (no model request, controls disabled, pointer to Ecology); the environmental news summary stays opt-in, labelled AI-generated/unverified, http(s)-only links, no coordinates.
- #344 closed as superseded by #336 (its focus hook, specs and workflow are byte-identical on main).

## Open
- #345 release script and doc 23, being re-pinned to the new combined candidate (below).
- #348 Tailwind 3 -> 4 migration plan (docs only). The 7 remaining audit findings are NOT accepted; they need that migration (no patched `braces` exists).

## Candidates
- Historical, preserved: `b57cc4645592f6e696f917fc860d672c397895b0` (#336 head before the merges above). BACKUP-deployed 2026-10-07 by the pinned script; **script-reported** live-byte match and 12/12 zero-retry mocked browser checks. Its deploy log and `results.json` were not independently reviewed after a classifier denial (see doc 23). It does not contain #342, #343 or #346-era merge combinations and cannot certify them.
- New combined BACKUP candidate: the `main` commit pinned in `scripts/release/place-research-backup.sh` (doc 23 records it). Not qualified until that script reports its exact-head CI, both audit scopes, and the deployed-artifact browser run.
- Frozen production candidate: `a1868f122aa965fd96ab023492bed62470fb1106` (unchanged; production is still #319).

## Limits that remain
- Mocked providers and entities in the deployed browser checks; real-USGS evidence is adapter-level only; physical-phone testing has not been performed.
- Runner hang observed: a CI Playwright job stalled 6 h at "Install Playwright OS deps" (no `timeout-minutes` on `ci.yml` jobs); re-run, not a code defect.
- Dirty weather checkout `/home/hiker123/oohearth` and the owner's unpublished local commits are preserved and out of scope.
