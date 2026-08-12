# CI Pipeline

What runs on every push/PR to `main`, what blocks a merge, and what's informational. All of it lives in `.github/workflows/`.

## `ci.yml` — the main pipeline

Supersedes the old `build.yml` (its build step is now the `build` job below — same intent, one place instead of two workflows both running `npm ci && npm run build` on every PR).

```
        ┌─ lint-and-typecheck ──┐
        ├─ format-check (info) ─┤
push/PR ┤                       ├─ summary (PR comment, PR only)
        ├─ build ─── e2e ───────┤
        ├─ dependency-audit ────┤
        │    (info unless       │
        │     high/critical)    │
        └─ dependency-review ───┘
             (PR only)
```

| Job | What | Blocking? |
|---|---|---|
| `lint-and-typecheck` | `npm run typecheck && npm run lint` | **Yes** |
| `format-check` | `npm run format:check` (Prettier) | No — see below |
| `build` | `npm run build`, uploads `dist/` + a bundle-size JSON as artifacts | **Yes** |
| `e2e` | Downloads the `dist/` artifact, runs Playwright (`smoke.spec.ts` + `a11y.spec.ts`) against a `vite preview` server | **Yes** |
| `dependency-audit` | `npm audit --omit=dev`, fails only if high/critical count > 0, uploads the report | **Yes, but only on high/critical** |
| `dependency-review` | `actions/dependency-review-action@v4` — flags newly-introduced vulnerable/incompatible deps in a PR's diff specifically | **Yes** (PR-only job) |
| `summary` | Posts/updates one PR comment with a results table + top-5 bundle assets by size | N/A |

### Why Prettier isn't blocking (and why the audit mostly is)

- **Prettier**: the codebase predates it. `npm run format:check` (`prettier --check .`) currently flags **516 files** (verified 2026-08-11). Turning this into a merge gate today would block every PR, including ones that never touch those files. Once a dedicated one-time formatting PR lands (see Decision Register below), flip `continue-on-error: true` off in `ci.yml`'s `format-check` job.
- **Dependency audit**: promoted from purely-informational to severity-gated — moderate/low findings stay informational (surfaced via the uploaded report, not silent), but the job now fails the build on any high/critical count. As of 2026-08-11, `npm audit --omit=dev` reports **4 moderate, 0 high/critical** — this gate starts green, not pre-broken. Re-run `npm audit --omit=dev` for current status; numbers drift as the dependency tree changes.

## `codeql.yml`

Static analysis (`security-and-quality` query pack) on every push/PR to `main` plus a weekly Monday-morning run so it also catches newly-published query packs against unchanged code. Covers both the Vite frontend and the Deno functions in `base44/functions/*` — CodeQL's `javascript-typescript` extractor handles both without extra config.

## `release-please.yml`

See RELEASE_PROCESS.md.

## `.github/dependabot.yml`

Weekly npm + GitHub Actions dependency PRs. **Known gap**: Dependabot has no equivalent to the `.npmrc` `min-release-age=7` supply-chain cooldown this repo already relies on — a Dependabot PR can propose a version published minutes ago. Renovate has a native `minimumReleaseAge` setting that would close this gap, at the cost of installing the Renovate GitHub App. Until one or the other happens, don't auto-merge Dependabot PRs — check the npm publish date by hand.

## Playwright tests (`e2e/`)

- `smoke.spec.ts` — boots the production build, confirms `/` and `/about` render (non-empty `#root`, correct `<title>`) and that no client-side crash signal (`Uncaught`, `ReferenceError`, `is not defined`) appears in the console. CI has no live Base44 backend (no secrets in this workflow — CLAUDE.md rule #4), so `Base44Error` / 404-on-fetch console noise is an *expected* offline artifact and is deliberately not treated as a failure.
- `a11y.spec.ts` — runs `@axe-core/playwright` (WCAG 2.1 A/AA) against 4 routes (`/`, `/about`, `/report`, `/location/:id`) as a **regression gate**, not a zero-violations bar. `e2e/a11y-baseline.json` records pre-existing debt (`color-contrast` on all 4 routes) — real numbers, captured live. CI only fails if a route grows a *new* rule ID or an existing one's violation count *increases*. `/about`'s `aria-hidden-focus` violation was fixed upstream (`fix/phase1-runtime`) and the baseline updated to match, 2026-08-11 — a stale baseline would have silently kept allowing it without ever detecting the fix. Fixing the remaining `color-contrast` debt is a design/contrast decision, not this pipeline's call.
- `location-detail.spec.ts`, `multi-photo-upload.spec.ts`, `verify-reject-workflow.spec.ts` — feature-specific coverage for the gallery/upload/tag-counter work, network-mocked (`e2e/fixtures/mockBase44.ts`) since there's no live backend in CI either. Desktop `chromium` + a Chromium-backed mobile viewport (`mobile-chromium`, scoped via `testMatch` to just these three files — see that file's comment for why `smoke`/`a11y` don't also run at mobile viewport).

## Decision Register

| # | Decision | Status |
|---|---|---|
| 1 | One-time repo-wide Prettier formatting PR, then flip `format-check` to blocking | Not started — needs a maintainer to review a 516-file diff before merging |
| 2 | Expand Playwright/a11y coverage to more routes (landing, map, donation/support, auth) | Partial — 4 routes covered as of 2026-08-11 (started at 2); see Phase 6 testing-gap notes in `ENGINEERING_SUMMARY.md` |
| 3 | Dependabot → Renovate (for `minimumReleaseAge`), or a documented manual-check habit | Not started |
| 4 | ~~Promote `npm audit` to blocking on high/critical only~~ | **Done, 2026-08-11** — `dependency-audit` now fails on high/critical, moderate/low stay informational |
| 5 | Bundle-size regression tracking (currently absolute-size reporting only, no vs-main diff — that would require building `main` on every PR too, doubling build time) | Not started — candidate: `size-limit` or `bundlewatch` with a committed budget file |
| 6 | Branch protection settings | See BRANCHING_STRATEGY.md — needs to be applied by hand in GitHub Settings, no admin API token available here |
| 7 | ~~Add `dependency-review` job~~ | **Done, 2026-08-11** |

## Verified state on `docs/base44-github-migration-plan`, 2026-08-11

`lint-and-typecheck` and `build` are meaningfully blocking because they currently pass: `npm run lint` (0 errors), `npm run typecheck` (0 errors), `npm run build` (clean) — re-verified live 2026-08-12 after resyncing against `origin/main`. `engineering/baseline` and `fix/phase1-runtime`'s fixes are already here, not pending — present in the tree, though not as literal git ancestors after the branch rebuild (see `ENGINEERING.md`'s note on why `git merge-base` alone is the wrong check here). See `ENGINEERING.md` for the full state table.
