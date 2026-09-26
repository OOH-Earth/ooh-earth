# NOW — current truth only

Last verified: 2026-09-26 (fresh `git fetch` + live GitHub reads, this pass
— "loop #3", CI reliability / TEST-001 / dependency programme). Re-verify
anything here that's more than a few days old before acting on it.

## CURRENT_ORIGIN_MAIN
`28db8d3` — "fix(test): authenticate the /lab/nft navigation in
route-metadata.spec.ts (#279)" — fresh `git fetch origin main`,
2026-09-26. This pass merged, in order: #217 (carried over), #249, #192,
#105, #279. PR #190 is CI-green (pending a final rerun of its own
smoke+accessibility job at time of writing) and not yet merged — re-fetch
before trusting any hash.

## PRODUCTION_FRONTEND / BACKUP_FRONTEND
Unchanged this pass — no frontend deploy happened (all work this pass was
CI/test/tooling, not application runtime code). See prior `NOW.md`
snapshot in git history for the last verified entries; re-verify fresh
before any production-facing claim.

## OPEN_P0
None.

## CURRENT_SECURITY_GAPS
None open, unchanged this pass. SEC-001/SEC-002 and the js-yaml CVE
(prior pass) remain closed.

## TEST-001 — CI reliability investigation — **CLOSED, ROOT-CAUSED, FIXED, MERGED**
- **Symptom**: `e2e/route-metadata.spec.ts`'s hydrated-metadata test
  intermittently failed CI with `expect(page).toHaveTitle(...)` getting
  "Sign In — OOH Earth" instead of "NFT Creator — OOH Earth Lab", across
  3+ unrelated PRs (one docs-only) in the prior pass.
- **Root cause, confirmed by direct instrumentation + real reproduction**
  (not guessed): the test navigates to `/lab/nft` without
  `?access_token=`, so `AuthContext.jsx`'s `checkAppState()` — which only
  calls `checkUserAuth()` when a token is present — locks
  `isAuthenticated=false` before `LabAccessRoute`'s own fallback effect
  gets a chance to run. Mocking the backend user via `mockBase44` alone
  is not sufficient; every other authenticated-route test in this suite
  already passes `?access_token=mock-admin-token` (this test was the one
  exception). Whether the test passed or failed depended entirely on an
  unrelated, narrow timing race in that effect scheduling — reproduced
  both directions (14/15 pass in one batch, 4/8 pass in another,
  `--repeat-each`, `retries=0`).
- **This was a TEST bug, not an application bug** — no application code
  changed. `AuthContext.jsx`/`LabAccessRoute.jsx` behave correctly for a
  real user (who always has a token before hitting a protected route).
- **CI architecture checked and ruled out as a contributing factor**:
  `playwright.config.ts` already runs `workers: 1` in CI (no intra-job
  parallelism), `e2e`/`e2e-mobile` are separate GitHub Actions jobs on
  separate isolated runner VMs (no cross-job resource sharing), so the
  prior pass's "concurrent CI overload" theory does not fit this
  failure's actual mechanism — it was a real, reproducible race in
  application effect timing, not infra contention.
- **Fix**: added `?access_token=mock-admin-token` to the `/lab/nft`
  navigation, matching the established convention. Verified: 60/60 pass
  locally (20 repeats, retries disabled), full chromium suite clean (320
  passed, 2 unrelated pre-existing flakes on retry — see TEST-EXTRA
  below), real GitHub CI green including an explicit rerun of the
  historically-unstable job (both green). **PR #279 merged.**
- **New, separate finding (TEST-EXTRA, not investigated further this
  pass)**: `heat-layer.spec.ts` and `multi-photo-upload.spec.ts` both
  flaked-but-passed-on-retry in the full-suite run. Different failure
  signatures from TEST-001, not touched by PR #279. Worth tracking if
  they recur.

## GIT-001 — this pass's merges and dependency programme
- **Merged, fresh-vetted each one:** #249 (dev-deps group bump, clean),
  #192 (GitHub Actions CodeQL 4.37→4.38, CI-config-only, no app/lockfile
  risk), #105 (footer touch-target a11y fix — its own new test had a real
  bug, see below, fixed and merged), #279 (TEST-001 fix, see above).
- **#105, corrected**: the prior pass's "isolated CI rerun" plan was
  wrong — the failure was deterministic (3/3), not a flake. Root cause:
  `e2e/footer-touch-targets.spec.ts` queried the DOM right after
  `waitForLoadState('domcontentloaded')`, before this client-rendered SPA
  had necessarily hydrated the footer. Fixed by waiting on an
  auto-retrying `expect(footerLinks.first()).toBeVisible()` before
  measuring — a test-only fix; the actual `SiteFooter.jsx` CSS change was
  already correct. Verified 10/10 locally, green on real CI, merged.
- **#190 (rollup-plugin-visualizer 6.0.11→7.1.1)**: real lockfile
  conflict from divergence with main. First resolution attempt used the
  stale PR branch's lockfile as a base and accidentally caused npm to
  re-resolve an unrelated transitive dependency
  (`postcss-selector-parser`) back down to an old low-severity-vulnerable
  version — **caught by GitHub's own Dependency Review check failing on
  the real PR**, not locally. Corrected by resetting to `origin/main`'s
  lockfile and applying only this PR's own targeted bump
  (`npm install rollup-plugin-visualizer@7.1.1 --package-lock-only`),
  which scoped the diff to just that package's own dependency subtree.
  Verified: `npm ci` clean, 0 vulnerabilities, `ANALYZE=true npm run
  build` correctly produces a working `dist/bundle-analysis.html` (real
  per-chunk data, not just "build didn't crash"). One open, soft risk:
  the package declares `engines.node >= 22`; this repo's CI pins Node 20.
  npm's default `engine-strict=false` means this warns, not fails — real
  GitHub CI (Node 20) is verifying this definitively; check its final
  status before merging (was CI-green on 8/9 checks, one job still
  finishing as of this writing).
- **Major dependency compatibility matrix** (see `QUEUE.md` for full
  detail) — built from real evidence (npm registry peer-dependency data,
  actual usage-count greps, actual mergeable-state checks), not
  Dependabot's own PR titles (already proven unreliable last pass on
  #188):
  - **#20 (react-leaflet 4→5) is HARD BLOCKED on React 19** — confirmed
    via `npm view react-leaflet@5.0.0 peerDependencies`:
    `{ react: '^19.0.0' }`. Cannot be merged independently of #88+#39.
  - **#88 (react 18→19) + #39 (react-dom 18→19)** are a linked pair (must
    land together) and are themselves the gate for #20. This is the
    highest-blast-radius item in the whole queue — a full major React
    version bump touching every component in the app. #39 currently has
    a real lockfile conflict (`DIRTY`/`CONFLICTING`); #88 does not
    (`BEHIND`/`MERGEABLE`). Not attempted this pass — this needs to be
    its own dedicated, deliberately-scoped project (full regression
    testing across every page, not a queue-clearing pass), not squeezed
    into a general dependency sweep.
  - **#188 (framer-motion 12→13) and #189 (react-resizable-panels
    2.1.9→4.12.4)** are both real majors but **not** React-19-gated
    (peer deps accept React 18 OR 19 for both, confirmed via npm
    registry). #189 has a real lockfile conflict; #188 doesn't currently.
    framer-motion has 19 usage sites in `src/`, react-resizable-panels
    has 1. Candidates for a future dedicated pass, not attempted this
    pass (time/scope, and #190's lockfile-conflict lesson argues for
    doing these one at a time, carefully, not in a batch).
  - **#191 (typescript 5.9→7.0)**: confirmed via `npm view typescript
    dist-tags` that `7.0.2` is genuinely the current `latest` as of this
    session's date (not a fluke/beta) — TypeScript 7 is the native
    Go-based compiler rewrite ("tsgo"), a fundamentally different
    toolchain, not a typical major bump. Highest-novelty, hardest-to-
    predict blast radius of the group (could affect type-checking output
    across the entire codebase even with zero real behavior bugs). Not
    attempted — deserves dedicated investigation, likely its own
    engagement.
- **Still deferred, untouched, reasons unchanged from before**: #201
  (draft), #156 (needs Dave's email confirmation), #63 (release-please,
  known CI gap), #158/#154/#153/#152 (4 `rnd/*`, "not for merge" per own
  titles), #108 (not re-checked).

## CURRENT_RELEASE_BLOCKERS
None active.

## CURRENT_PRODUCT_DECISIONS (awaiting Dave, not re-litigated)
- AdObservation, Founding Profile directory, `fix/production-app-binding`:
  unchanged, see prior notes / `docs/ops/ooh-earth/`.
- **UX-004** (Carto tile watermark): decision package complete, awaiting
  Dave's free API key — untouched this pass, per explicit instruction.
- Whether/when #88+#39 (React 19, gates #20 too) and #188/#189/#191 get
  their own dedicated compatibility investigations.

## NEXT_TASK
Confirm #190's final CI check, merge if green (or close/defer with the
Node-engine evidence if it fails there). #192/#249/#105/#279 all done.
No other UX/SEC item is open. The React 19 migration (#88+#39+#20) and
the framer-motion/react-resizable-panels/typescript majors are real,
identified, evidenced work — not attempted this pass, each needs its own
dedicated, careful pass per the matrix above.

## NEXT_PRODUCTION_WRITE
None pending — this pass touched only CI/tests/tooling, no application
runtime code.

## HUMAN_CHECKPOINT
Dave needs to: (1) pick UX-004's fix direction / obtain the free Carto
API key, (2) decide on `fix/production-app-binding`, (3) decide
whether/when to greenlight the React 18→19 migration project (gates
react-leaflet 5 too) — this is a real, scoped decision now, not a vague
"major bumps pending" note, (4) decide priority on framer-motion/
react-resizable-panels/typescript-7 investigations.
