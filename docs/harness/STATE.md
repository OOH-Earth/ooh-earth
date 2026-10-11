# Current state (reconciled 2026-10-08)

State vocabulary: **merged** (in `main`) / **CI-qualified** (exact-head required checks green) / **BACKUP-qualified** (deployed to BACKUP, bytes verified, rendered checks pass) / **production-shipped**. Only the first three are claimed below; nothing in this file is production-shipped.

## Merged to main since the pilot reconciliation (none deployed to production)
- #346 `beadb98` bounded lockfile bumps (moment, dompurify, source-map-js); audit: production 2 -> 0, full tree 10 -> 7. Doc 24.
- #336 `7877f05` place-research pilot + focus correction (includes everything #344 carried).
- #342 `4d7db21` observed Rivers (USGS, UK Environment Agency) with the request-cancellation/cache hardening.
- #343 `9adcf92550245eb2401601380532e1eb77a5433f` Main Map: mushroom/flora/conflict hooks are empty stubs (no model request, controls disabled, pointer to Ecology); the environmental news summary stays opt-in, labelled AI-generated/unverified, http(s)-only links, no coordinates.
- #344 closed as superseded by #336 (its focus hook, specs and workflow are byte-identical on main).

## Merged since (documentation/tooling): #345 `15c931c` pinned BACKUP release script + doc 23 (script commit identity is independent of the candidate), #350 `4fb6cad` state docs.

## Merged since (continued): #348 `ec3ef6f` Tailwind 3 -> 4 migration plan (docs only; a plan, not risk acceptance). #352 `0156ce2` CI job/step timeouts (a Playwright job hung 6 h at "Install Playwright OS deps"; limits from 37 observed runs; no retry or assertion change).

## Open
- #353 pre-migration visual baselines at `4fb6cad` (24 reviewed shots, separate from CI, doc 26).
- #354 browser-support evidence and the Tailwind 4 floor trade-off (doc 27; recommendation only, owner decision).
- The 7 remaining full-tree audit findings are NOT accepted; a simulated clean lockfile does not prove application compatibility. No browser-support reduction and no migration deployment is authorized.

## Candidates (identity is the pinned commit, not the latest main)
- **BACKUP candidate `4fb6cad3c2c908be7f9d559ea825e363f9a9e240`** (main tip after #346/#336/#342/#343/#350; application source identical to `9adcf92`). Exact-head CI `37741933887`, CodeQL `37741933461`, interaction regression `37741959755` green; production audit 0, full tree 7; unit tests 33/33. Deployed to BACKUP from the pinned script: entry `/assets/index-DYBFc-cG.js`, SHA-256 `97f04d66ec2c0f6936a3ec9ba876c7e6d4cb19cfce1e0748eb3cd25f7be80f31`.
  - **Attempt 1** (`/tmp/q/evidence/ooh-place-backup.JTYEhL`): live bytes matched; browser gate **35 passed / 1 failed** at zero retries. `manual capture coordinates remain editable at 360x800` did not see the Capture button within its 5 s expectation: the `/map` document request took 5.7 s (BACKUP host latency) and the page was still on its loading splash. An isolated repeat on the deployed build passed 5/5. This failure stands; it is not erased and the candidate was not qualified on that run.
  - **Attempt 2** (`/tmp/q/evidence/ooh-place-backup.rNU5AO`): same script, same candidate, no test change; live bytes matched; **36/36 at zero retries**. This is a fresh whole-gate run after a measured explanation, not a flawless first-run result and not an in-test retry.
  - Real-provider browser check (separate, not part of the 36): USGS Water Data 275 stations, UK Environment Agency 140 stations. On attempt 1's first real-provider run USGS failed once and the page correctly showed PROVIDER UNAVAILABLE; two immediate repeats returned 200.
  - Mocked providers/entities in the 36 checks. Physical-phone testing has not been performed.
  - Later `main` commits (this docs reconciliation, #345, #348) do not change the deployed artifact. Do not relabel BACKUP as the latest main SHA.
- Historical, preserved: `b57cc4645592f6e696f917fc860d672c397895b0`: script-reported 12/12 mocked checks on 2026-10-07; deploy log and `results.json` not independently reviewed after a classifier denial. Superseded as evidence by the candidate above.
- Frozen production candidate: `a1868f122aa965fd96ab023492bed62470fb1106` (unchanged; production is still #319).

## Limits that remain
- Mocked providers and entities in the deployed browser checks; real-USGS evidence is adapter-level only; physical-phone testing has not been performed.
- Runner hang observed: a CI Playwright job stalled 6 h at "Install Playwright OS deps" (no `timeout-minutes` on `ci.yml` jobs); re-run, not a code defect.
- Dirty weather checkout `/home/hiker123/oohearth` and the owner's unpublished local commits are preserved and out of scope.
