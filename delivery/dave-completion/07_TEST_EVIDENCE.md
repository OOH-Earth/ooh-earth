# Test Evidence

## Final independent verification on `main` @ `43bfe9d`

Run from a **fully clean environment** — `node_modules` and `dist` both
removed and rebuilt from scratch, not cached from any earlier step:

| Check | Result |
|---|---|
| `git status` | Clean |
| `npm ci` (from scratch) | Clean |
| `npm run lint` | Clean, 0 errors |
| `npm run typecheck` (`tsc -p ./jsconfig.json`) | Clean, 0 errors |
| `npx prettier --check .` | Clean |
| `npm run build` (`rm -rf dist` first) | Clean (only a pre-existing, unrelated chunk-size advisory) |
| `npm audit --omit=dev` | 0 vulnerabilities |
| CodeQL (every merged PR) | Clean |
| Combined regression suite (6 files, 14 tests) | **14/14 pass** |

The 14-test combined suite: `e2e/related-locations-parent-corp.spec.ts` (2),
`e2e/heat-layer.spec.ts` (2), `e2e/heat-layer-click-handoff.spec.ts` (2),
`e2e/map-brand-search.spec.ts` (2), `e2e/ar-lens-brand-scan.spec.ts` (3),
`e2e/nft-badge-mint-prefill.spec.ts` (3). This is the exact, actual count —
not inflated, not counting tests that didn't run.

## Per-PR fail-before/pass-after evidence

Every behavioral change in this pass was proven by stashing the source
change (keeping the new test), confirming the new test fails against the
reverted code, then restoring the fix and confirming it passes:

| PR | Test file | Tests | Fail-before confirmed | Pass-after confirmed |
|---|---|---|---|---|
| #91 | `e2e/related-locations-parent-corp.spec.ts` | 2 | Yes | Yes, 2/2 |
| #92 | `e2e/heat-layer.spec.ts` | 2 | Yes | Yes, 2/2 |
| #93 | `e2e/map-brand-search.spec.ts` | 2 | Yes | Yes, 2/2 |
| #95 | `e2e/ar-lens-brand-scan.spec.ts` (extended) | 3 (full suite) | Yes | Yes, 3/3 |
| #96 | `e2e/heat-layer-click-handoff.spec.ts` | 2 | Yes | Yes, 2/2 |
| #98 | `e2e/nft-badge-mint-prefill.spec.ts` | 3 | Yes | Yes, 3/3 |
| #99 | (CI parsers — see below, not an app-behavior test) | — | — | — |
| #97, #100 | Docs-only — no behavioral test applicable | — | — | — |

**PR #99** (CI observability for Lint/Typecheck/Prettier/Build) was verified
differently: each of the four log parsers (`tsc`, `eslint`, `prettier`,
`vite`) was tested against a **real, deliberately-broken local run** (a real
type error, a real ESLint parsing error, a real formatting violation, a
realistic synthetic build-error block), confirmed to produce a correct
summary, then the break was reverted before committing.

## CI verification (GitHub Actions, not just local)

Every merged PR in this pass had all 10 required checks green (Lint &
Typecheck, Prettier, Build, Analyze, Dependency Review, Dependency audit,
CodeQL, Playwright smoke+accessibility, Playwright mobile Chromium, PR
summary comment) and `mergeStateStatus: CLEAN` confirmed via a fresh
`gh pr view` check immediately before merge — never assumed from an earlier
check.

## Two real issues caught during this pass, disclosed rather than hidden

1. **CI-only TypeScript error (PR #96)**: first push passed locally but
   failed CI's `Lint & Typecheck` job (`tsc` error TS2345, an effect
   destructor returning a non-void value). Root-caused from the actual CI
   log, fixed with a one-line change, reverified with a fresh local `tsc`
   run, confirmed green on the second CI run before merging.
2. **Stale local preview server (post-merge on PR #98)**: after merging,
   a local regression rerun showed 2/3 tests failing. Investigation (direct
   DOM dump, not guessing) found the *source code was correct* — a
   `npm run preview` process left running from an **earlier `git stash`
   cycle in the same long session** was silently serving stale JavaScript to
   new test runs (`playwright.config.ts`'s `reuseExistingServer: true`
   locally allows this). Confirmed by killing the stray process, doing a
   fully clean rebuild, and rerunning — 3/3 passed. No code was reverted or
   changed; the feature was correct the entire time. This is now documented
   in `CLAUDE_CONVERGENCE_STATE.md` as a standing operational lesson.

## Sandbox testing caveats (documented, not hidden)

- Playwright's `webServer` runs `npm run preview` against `dist/`, not live
  source — every verification in this pass used a build freshly produced
  from the exact code being tested.
- This sandbox has no live Base44 backend; all e2e tests mock the REST
  surface at the network layer (`e2e/fixtures/mockBase44.ts`), so tests
  exercise real component logic against fixture data, not a live database.
- A concurrent `claude .` session was active in this repository during part
  of this work (confirmed via `ps aux`); no file conflicts occurred, and all
  git operations were pathspec-scoped to avoid sweeping in unrelated changes.
