# Branching Strategy

## Model: trunk-based, `main` is always deployable

- `main` is the only long-lived branch. Base44 is the runtime source of truth (CLAUDE.md rule #1) and GitHub is a two-way mirror — `main` should always reflect what's safe to be live.
- Everything else is a short-lived feature branch: `feat/…`, `fix/…`, `chore/…`, `docs/…` (already the convention in CONTRIBUTING.md).
- No direct commits to `main`. Every change — including this pipeline itself — goes through a PR, per this repo's standing rule (CLAUDE.md rule #3: no one, human or agent, commits/pushes/opens PRs against `main` without explicit instruction in that session).
- One concern per PR (already stated in CONTRIBUTING.md) — CI's PR-summary comment and the checklist in the PR template both assume a focused diff; a PR that mixes an unrelated refactor with a real fix is harder to review and harder to revert.

## Why not GitFlow / release branches

This is a single deployed app with one environment that matters (production) plus a BACKUP/sandbox for proving risky changes (CONTRIBUTING.md's "BACKUP-first rule") — not a library shipping multiple supported versions. Long-lived `develop`/`release` branches would add merge overhead without a second version to maintain. Revisit if the app ever needs to support multiple concurrent releases.

## Branch protection — recommended settings for `main`

**Not applied here.** Applying branch protection requires GitHub admin access via the API or the Settings UI — this session has neither a GitHub token with admin scope nor authorization to change repo settings. These are the settings to turn on by hand at `github.com/oohearth/ooh-earth/settings/branches`:

- **Require a pull request before merging** — no direct pushes to `main`, including from admins (uncheck "Allow specified actors to bypass" unless there's a specific break-glass need).
- **Require status checks to pass before merging**, and require branches to be up to date first. Required checks, once `engineering/baseline` merges and the known-red gates above are clear:
  - `Lint & Typecheck`
  - `Build`
  - `Playwright (smoke + accessibility)`
  - `Analyze (javascript-typescript)` (CodeQL)
  - Leave `Prettier (informational)` and `Dependency audit (informational)` **not required** until Decision Register #1 and #4 in CI_PIPELINE.md are resolved — marking them required today would block all merges immediately.
- **Require conversation resolution before merging.**
- **Require linear history** — keeps `git log` on `main` readable and matches squash-or-rebase merging.
- **Do not allow force pushes** to `main`. Do not allow deletions.
- **Require review from Code Owners** once `.github/CODEOWNERS` has real usernames in it instead of the current placeholder (see that file) — until then this setting has nothing to enforce.
- Require at least 1 approving review. Given this is currently effectively a single-maintainer repo, this can't be enforced with a team of one — revisit once there's a second regular contributor.

## Merge method

Squash merge, PR title becomes the commit message on `main`. This is what makes `release-please.yml` reliable — it reads commit messages on `main` to decide the next version, and a squash-merged PR gives one clean Conventional Commit instead of a noisy merge of WIP commits. See RELEASE_PROCESS.md.
