# Engineering Summary

Current state, updated as it changes — not a point-in-time snapshot. For day-to-day reference (stack, commands, decision register) see `ENGINEERING.md`; for the CI job graph see `CI_PIPELINE.md`. Historical detail on how the repo got here lives in `TECHNICAL_DEBT_REGISTER.md`, `ENGINEERING_REVIEW.md`, and `MERGE_PLAN.md` — those describe branches and states that are now superseded; this file reflects where things actually stand.

## Where the branches actually stand (verified via `git merge-base`, not assumed)

- **`engineering/baseline`** (lint 7→0, typecheck 1,153→0) and **`fix/phase1-runtime`** are both already ancestors of `docs/base44-github-migration-plan` — their fixes are live on this branch today, not pending merge. This is why `npm run lint` / `npm run typecheck` pass clean here.
- **`feature/engineering-pipeline`**'s CI/CD and docs tooling has been reconciled onto this branch file-by-file (specific `git checkout <branch> -- <paths>`, never a branch merge) — `ci.yml`, `codeql.yml`, `dependabot.yml`, `release-please.yml` + config, `.prettierrc.json`, `CODEOWNERS`, and this doc set. Two gaps that branch's own audit flagged (`dependency-review` job, severity-gated `npm audit`) are closed as part of this reconciliation.
- Nothing has been merged to `main`, and nothing has been pushed. All of the above is local commits on `docs/base44-github-migration-plan`.

## Verified state, 2026-08-11

| Check | Result |
|---|---|
| `npm run lint` | 0 errors |
| `npm run typecheck` | 0 errors |
| `npm run build` | Clean (~4.9 MB `dist/assets` uncompressed, bundle-size warning unaddressed) |
| `npm run format:check` | 516 files flagged (Prettier newly configured, not run — informational only) |
| `npm audit --omit=dev` | 4 moderate, 0 high/critical |
| `e2e/a11y.spec.ts` | 4 routes baselined, pre-existing `color-contrast` only (`/about`'s `aria-hidden-focus` confirmed fixed and baseline updated) |
| Playwright suite | 24+ tests across `smoke`, `a11y`, and 3 feature specs, passing on desktop + mobile-viewport Chromium |

## Founder decisions still open

Carried forward, still unresolved, still not this session's call to make:

1. **Base vs Polygon chain mismatch** (CLAUDE.md, `fundConfig.js`, `sitemapData.js`, `StatusMatrix.jsx`).
2. **`react-router-dom` moderate CVEs** (2, open redirect + SSR constructor injection) — direct dependency, needs its own tested version-bump PR.
3. **516-file Prettier backlog** — needs a maintainer to review a one-time formatting PR before `format-check` can block merges.
4. **Bundle size** (~4.9 MB main chunk) — needs route-level code-splitting, its own PR.
5. **Branch protection on `main`** — documented in `BRANCHING_STRATEGY.md`, requires GitHub admin access to apply; no session so far has had it.
6. **The "EDIT & CLASSIFY" admin toolbar discrepancy** (see `RELEASE_VERIFICATION.md`) — visible in a founder-provided screenshot, not present anywhere in this GitHub mirror. Either Base44 has live functionality that hasn't synced down, or it's something else — unverified, flagged rather than guessed at.
