# Engineering

The entry point for how this repo is engineered day to day. CONTRIBUTING.md covers *how to contribute*; this covers *how the engineering system fits together*. See also CI_PIPELINE.md, BRANCHING_STRATEGY.md, RELEASE_PROCESS.md, and [.env.example](./.env.example) for environment variables.

**Troubleshooting a bug?** Check [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) first — a running, verified log so a reported issue can be checked against prior investigation before re-diagnosing it from scratch.

## Stack

- Frontend: React 18 + Vite + Tailwind + shadcn/ui, served from `src/`.
- Backend: Base44 SDK + Deno functions (`base44/functions/*/entry.ts`). Base44 is the runtime source of truth — GitHub is a two-way mirror, not where the app runs from (CLAUDE.md).
- Payments: Stripe. Donations: Donorbox (embedded).
- Automation: n8n, webhook-bridged from Base44 functions.
- Type checking: `tsc` over `jsconfig.json` (JS/JSX with `checkJs`) plus `tsconfig.ops.json` for the TypeScript-native Ops Portal.

## Local commands

| Command | What |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run typecheck` | `tsc` (jsconfig + tsconfig.ops) |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run test:e2e` | Playwright (smoke + accessibility) |
| `npm run test:a11y` | Just the accessibility scan |

CI runs the same commands — see CI_PIPELINE.md for exactly which ones block a merge.

## Repo-wide engineering state (as of `docs/base44-github-migration-plan`, 2026-08-11)

Real numbers, verified live by actually running each command on this branch — not copied from another branch's docs:

| Check | State |
|---|---|
| `npm run lint` | **0 errors.** `engineering/baseline`'s fixes (7→0) are already an ancestor of this branch — verified via `git merge-base`, not assumed. |
| `npm run typecheck` | **0 errors.** Same — `engineering/baseline` took this from 1,153→0 (full breakdown in `TECHNICAL_DEBT_REGISTER.md`), already inherited here. |
| `npm run build` | Clean, with a bundle-size warning — `dist/assets` totals ~4.9 MB uncompressed across 152 files as of this build. Not addressed; needs route-level code-splitting as its own PR. |
| Accessibility (`e2e/a11y.spec.ts`) | 4 routes baselined (`/`, `/about`, `/report`, `/location/:id`), pre-existing `color-contrast` debt only (12/10/13/23 nodes respectively) — `/about`'s `aria-hidden-focus` was fixed by `fix/phase1-runtime` (also already inherited here) and the baseline updated to match, 2026-08-11. |
| `npm run format:check` | **516 files** flagged (Prettier newly configured on this branch, not yet run — see Decision Register). Informational only, not a merge gate. |
| `npm audit --omit=dev` | 4 moderate, 0 high/critical, verified 2026-08-11. `dependency-audit` in `ci.yml` blocks on high/critical only, so this gate currently starts green. |

`engineering/baseline` and `fix/phase1-runtime` are both already merged into this branch (confirmed ancestors via `git merge-base`, not assumed from branch names). `feature/engineering-pipeline` was the one genuinely-separate branch; its CI/tooling additions have been reconciled onto this branch file-by-file (not a branch merge) — see individual commit messages for exactly what came from where.

## Decision Register (cross-cutting, not CI-specific)

1. **Base vs Polygon chain mismatch** — already flagged in CLAUDE.md across `fundConfig.js`, `sitemapData.js`, `StatusMatrix.jsx`. Unrelated to this pipeline, re-flagged because it keeps surfacing.
2. **`react-router-dom` moderate CVEs** (2, open redirect + SSR constructor injection) — a direct dependency used for all client-side routing. Not upgraded here; a version bump needs its own tested PR, not a drive-by in an infra pass.
3. **516-file Prettier backlog** — one-time formatting PR needed before `format-check` can become a blocking gate. Reviewing a 516-file diff (even if every line is mechanical) needs a maintainer's sign-off, not something to run unattended.
4. **Bundle size (~4.9 MB main chunk)** — code-splitting is a scoped follow-up, not touched here.
5. **Renovate vs Dependabot** — Dependabot has no equivalent to a minimum-release-age supply-chain cooldown. See CI_PIPELINE.md.
6. **When to promote Prettier / expand dependency-audit further** — see CI_PIPELINE.md Decision Register.

## What's GitHub-native tooling vs. application code

Everything in `.github/`, the root-level engineering docs, `playwright.config.ts`, `.prettierrc.json`, and `e2e/` is repo/process tooling — no application functionality changes. Application-code changes on this branch (the multi-photo gallery, rolling tag counter, and their Playwright coverage) are documented separately in `RELEASE_VERIFICATION.md` and their own commit messages.
