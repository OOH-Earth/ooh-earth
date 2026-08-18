# Test Evidence

## Independent post-merge verification on `main` @ `5877661`

All run fresh (not cached), after PR #96 merged:

| Check | Result |
|---|---|
| `git status` | Clean |
| `npm run lint` | Clean, 0 errors |
| `npm run typecheck` (`tsc -p ./jsconfig.json`) | Clean, 0 errors |
| `npx prettier --check .` | Clean |
| `npm run build` | Clean (only pre-existing chunk-size advisory, unrelated) |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `e2e/heat-layer-click-handoff.spec.ts` | 2/2 pass |

## Per-PR fail-before/pass-after evidence

Every behavioral fix in this pass was proven by stashing the source change
(keeping the new test), confirming the new test fails against the reverted
code, then restoring the fix and confirming it passes:

| PR | Test file | Tests | Fail-before confirmed | Pass-after confirmed |
|---|---|---|---|---|
| #91 | `e2e/related-locations-parent-corp.spec.ts` | 2 | Yes | Yes, 2/2 |
| #92 | `e2e/heat-layer.spec.ts` | 2 | Yes | Yes, 2/2 |
| #93 | `e2e/map-brand-search.spec.ts` | 2 | Yes | Yes, 2/2 |
| #95 | `e2e/ar-lens-brand-scan.spec.ts` (extended) | 3 (full suite) | Yes | Yes, 3/3 |
| #96 | `e2e/heat-layer-click-handoff.spec.ts` | 2 | Yes | Yes, 2/2 |

## CI verification (GitHub Actions, not just local)

Every merged PR in this pass had all 10 required checks green
(Lint & Typecheck, Prettier, Build, Analyze, Dependency Review, Dependency
audit, CodeQL, Playwright smoke+accessibility, Playwright mobile Chromium,
PR summary comment) and `mergeStateStatus: CLEAN` confirmed via a fresh
`gh pr view` check immediately before merge — not assumed from an earlier
check.

**One real CI-only failure was caught, not glossed over:** PR #96's first
push passed locally but failed CI's `Lint & Typecheck` job
(`tsc` error TS2345, effect-destructor return-type mismatch in
`HeatLayer.jsx`). Root-caused from the actual CI log, fixed with a one-line
change, verified with a fresh local `tsc` run before re-push, and confirmed
green on the second CI run before merging. This is disclosed here precisely
because the mission's own quality bar forbids hiding it.

## Sandbox testing caveats (documented risk, not new)

- Playwright's `webServer` runs `npm run preview` against `dist/`, not live
  source — every fix in this session was verified against a fresh
  `npm run build`, not stale output.
- This sandbox has no live Base44 backend; all e2e tests mock the REST
  surface at the network layer (`e2e/fixtures/mockBase44.ts`) rather than
  changing application code, so tests exercise real component logic against
  fixture data.
- A concurrent `claude .` session was active in this repository during part
  of this work (confirmed via `ps aux`); no file conflicts occurred, and all
  git operations were pathspec-scoped to avoid sweeping in unrelated changes.
