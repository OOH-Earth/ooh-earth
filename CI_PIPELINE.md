# CI Pipeline

What runs on every push/PR to `main`, what blocks a merge, and what's informational. All of it lives in `.github/workflows/`.

## `ci.yml` — the main pipeline

Supersedes the old `build.yml` (its build step is now the `build` job below — same intent, one place instead of two workflows both running `npm ci && npm run build` on every PR).

```
        ┌─ lint-and-typecheck ──┐
        ├─ format-check ────────┤
push/PR ┤                       ├─ summary (PR comment, PR only)
        ├─ build ─── e2e ───────┤
        │        └── e2e-mobile ┤
        ├─ dependency-audit ────┤
        │    (info unless       │
        │     high/critical)    │
        └─ dependency-review ───┘
             (PR only)
```

| Job | What | Blocking? |
|---|---|---|
| `lint-and-typecheck` | `npm run typecheck && npm run lint` | **Yes** |
| `format-check` | `npm run format:check` (Prettier) | **Yes** — see below |
| `build` | `npm run build`, uploads `dist/` + a bundle-size JSON as artifacts | **Yes** |
| `e2e` | Downloads the `dist/` artifact, runs Playwright desktop chromium (`smoke.spec.ts` + `a11y.spec.ts`) against a `vite preview` server | **Yes** |
| `e2e-mobile` | Same setup, runs the `mobile-chromium` project (gallery/upload/tag-counter feature specs, `testMatch`-scoped — see below) — added 2026-08-12, previously local/manual only | **Yes** |
| `dependency-audit` | `npm audit --omit=dev`, fails only if high/critical count > 0, uploads the report | **Yes, but only on high/critical** |
| `dependency-review` | `actions/dependency-review-action@v4` — flags newly-introduced vulnerable/incompatible deps in a PR's diff specifically | **Yes** (PR-only job) |
| `summary` | Posts/updates one PR comment with a results table + top-5 bundle assets by size | N/A |

### Prettier is now blocking (and why the audit mostly is)

- **Prettier**: was informational (`continue-on-error: true`) while the codebase carried a pre-Prettier backlog — 444 files as of the one-time formatting PR that landed 2026-08-12 (verified live via `git diff --stat` on that PR, not estimated). That PR ran the formatter across everything `.prettierignore` doesn't exclude, verified formatting-only via lint/typecheck/build/Playwright (desktop + mobile) all passing after, plus one real catch: Prettier stripped the parens around a JSDoc type-cast in `src/lib/imageCompress.js`, silently changing what was being cast and breaking typecheck — fixed and guarded with `// prettier-ignore` on that exact line so a future `npm run format` run can't reintroduce it. With the backlog gone, `format-check` is a real blocking gate as of 2026-08-12 — see Decision Register #1.
- **Dependency audit**: promoted from purely-informational to severity-gated — moderate/low findings stay informational (surfaced via the uploaded report, not silent), but the job now fails the build on any high/critical count. As of 2026-08-11, `npm audit --omit=dev` reports **4 moderate, 0 high/critical** — this gate starts green, not pre-broken. Re-run `npm audit --omit=dev` for current status; numbers drift as the dependency tree changes.

## `codeql.yml`

Static analysis (`security-and-quality` query pack) on every push/PR to `main` plus a weekly Monday-morning run so it also catches newly-published query packs against unchanged code. Covers both the Vite frontend and the Deno functions in `base44/functions/*` — CodeQL's `javascript-typescript` extractor handles both without extra config.

## `release-please.yml`

See RELEASE_PROCESS.md. Its push to the release PR branch uses this workflow's own `GITHUB_TOKEN`, which GitHub excludes from triggering other workflows (anti-recursion rule) — left alone, the release PR would sit with zero CI/CodeQL checks and could never satisfy required-status-checks branch protection. As of 2026-08-14, `release-please.yml` re-dispatches `ci.yml` and `codeql.yml` via `workflow_dispatch` (exempt from that suppression) directly onto the release PR's branch right after release-please opens/updates it — see Decision Register #8. `dependency-review` (a job inside `ci.yml`) also accepts `workflow_dispatch` now, passing explicit `base-ref`/`head-ref` since it has no `pull_request` context to infer them from.

## `.github/dependabot.yml`

Weekly npm + GitHub Actions dependency PRs. **Known gap**: Dependabot has no equivalent to the `.npmrc` `min-release-age=7` supply-chain cooldown this repo already relies on — a Dependabot PR can propose a version published minutes ago. Renovate has a native `minimumReleaseAge` setting that would close this gap, at the cost of installing the Renovate GitHub App. Until one or the other happens, don't auto-merge Dependabot PRs — check the npm publish date by hand.

## Playwright tests (`e2e/`)

- `smoke.spec.ts` — boots the production build, confirms `/` and `/about` render (non-empty `#root`, correct `<title>`) and that no client-side crash signal (`Uncaught`, `ReferenceError`, `is not defined`) appears in the console. CI has no live Base44 backend (no secrets in this workflow — CLAUDE.md rule #4), so `Base44Error` / 404-on-fetch console noise is an *expected* offline artifact and is deliberately not treated as a failure.
- `a11y.spec.ts` — runs `@axe-core/playwright` (WCAG 2.1 A/AA) against 4 routes (`/`, `/about`, `/report`, `/location/:id`) as a **regression gate**, not a zero-violations bar. `e2e/a11y-baseline.json` records pre-existing debt (`color-contrast` on all 4 routes) — real numbers, captured live. CI only fails if a route grows a *new* rule ID or an existing one's violation count *increases*. `/about`'s `aria-hidden-focus` violation was fixed upstream (`fix/phase1-runtime`) and the baseline updated to match, 2026-08-11 — a stale baseline would have silently kept allowing it without ever detecting the fix. Fixing the remaining `color-contrast` debt is a design/contrast decision, not this pipeline's call.
- `location-detail.spec.ts`, `multi-photo-upload.spec.ts`, `verify-reject-workflow.spec.ts` — feature-specific coverage for the gallery/upload/tag-counter work, network-mocked (`e2e/fixtures/mockBase44.ts`) since there's no live backend in CI either. Desktop `chromium` (via the `e2e` job) + a Chromium-backed mobile viewport (`mobile-chromium`, via the separate `e2e-mobile` job, both now CI-gated as of 2026-08-12 — scoped via `testMatch` to just these three files, see that file's comment for why `smoke`/`a11y` don't also run at mobile viewport).

## Decision Register

| # | Decision | Status |
|---|---|---|
| 1 | ~~One-time repo-wide Prettier formatting PR, then flip `format-check` to blocking~~ | **Done, 2026-08-12** — 444 files reformatted, verified formatting-only (one real Prettier-introduced type-cast bug found and fixed, see above), `format-check` is now a required status check |
| 2 | Expand Playwright/a11y coverage to more routes (landing, map, donation/support, auth) | Partial — 4 routes covered as of 2026-08-11 (started at 2); see Phase 6 testing-gap notes in `ENGINEERING_SUMMARY.md` |
| 3 | Dependabot → Renovate (for `minimumReleaseAge`), or a documented manual-check habit | Not started |
| 4 | ~~Promote `npm audit` to blocking on high/critical only~~ | **Done, 2026-08-11** — `dependency-audit` now fails on high/critical, moderate/low stay informational |
| 5 | Bundle-size regression tracking (currently absolute-size reporting only, no vs-main diff — that would require building `main` on every PR too, doubling build time) | Not started — candidate: `size-limit` or `bundlewatch` with a committed budget file |
| 6 | ~~Branch protection settings~~ | **Done, 2026-08-12** — applied via API once GitHub Admin access was granted, independently verified live. See ADMIN-ACCESS-REQUIREMENTS.md / BRANCHING_STRATEGY.md for the exact configuration |
| 7 | ~~Add `dependency-review` job~~ | **Done, 2026-08-11** |
| 8 | ~~Release PRs get zero CI/CodeQL checks (`GITHUB_TOKEN` push doesn't trigger `pull_request` workflows) and sit permanently BLOCKED under required-status-checks~~ | **Done, 2026-08-14** — `release-please.yml` re-dispatches `ci.yml`/`codeql.yml` via `workflow_dispatch` after opening/updating a release PR; `dependency-review` now accepts `workflow_dispatch` with explicit `base-ref`/`head-ref` (derived from `github.event.repository.default_branch`, not hardcoded). No PAT, no force-push, no branch-protection change. `release-please.yml` also gained a `concurrency` group so two near-simultaneous pushes to `main` can't start overlapping release-please runs that each independently dispatch CI/CodeQL. **Live bug found and fixed, 2026-08-15**: once actually merged and exercised against the real, already-open PR #63, the re-dispatch step failed — `gh workflow run` (no preceding `actions/checkout` in this job) couldn't infer the target repository from git context (`fatal: not a git repository`). Fixed by passing `--repo "${{ github.repository }}"` explicitly to both `gh workflow run` calls rather than adding a full checkout just for two CLI invocations. Confirmed via a real failed run (`gh run view`), not assumed — see PR that introduced this fix for the exact log. Full end-to-end proof (PR #63 actually receiving green checks) still needs a subsequent push to `main` to re-trigger `release-please.yml` after this fix lands. |

## Verified state on `main`, 2026-08-12

Every blocking gate is meaningfully blocking because all of them currently pass on `main`: `npm run lint` (0 errors), `npm run typecheck` (0 errors), `npm run build` (clean), `npm run format:check` (clean, post-444-file formatting PR), Playwright desktop 18/18 + mobile 9/9. `main` is tagged `v1.0.0`. See `ENGINEERING.md` for the full state table.
