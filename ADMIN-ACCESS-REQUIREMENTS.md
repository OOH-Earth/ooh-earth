# Admin Access Requirements

Everything below needs GitHub **Admin** (or Maintain, where noted) on `oohearth/ooh-earth`. Current engineering access is **Write** — enough to push branches, open PRs, and run Actions, but not enough to touch repo Settings. This is a checklist for whoever holds Admin (Dave, or the org owner) to work through once, in order. Each item is a few clicks; none require GitHub expertise beyond what's written here.

## 1. Enable Dependency graph (blocks a real PR check today)

**Settings → Code security and analysis → Dependency graph → Enable.**

This is the one concrete thing blocking PR #1's CI from going fully green right now. The `Dependency Review` check fails with: *"Dependency review is not supported on this repository. Please ensure that Dependency graph is enabled."* Everything else in that PR's CI passes (lint, typecheck, build, Playwright, CodeQL, audit) — this single toggle is the only remaining blocker, and it's not something Write access can flip.

While on that same settings page, also enable:
- **Dependabot alerts**
- **Dependabot security updates**

Do **not** enable "CodeQL default setup" on the same page — this repo already runs a custom-configured CodeQL workflow (`.github/workflows/codeql.yml`); the automatic default setup would run CodeQL a second time on every push.

## 2. Confirm Actions workflow permissions

**Settings → Actions → General → Workflow permissions.**

`ci.yml`'s summary job posts/updates a comment on every PR with the CI results table. That needs "Read and write permissions" for `GITHUB_TOKEN` (or, if it's currently "Read only," confirm "Allow GitHub Actions to create and approve pull requests" isn't itself required — it isn't, only the read/write toggle is). If this is still on the default "Read only," the summary job will silently fail to post its comment; every other job is unaffected.

## 3. Branch protection on `main`

**Settings → Branches → Add branch protection rule → `main`.**

Full reasoning for each setting lives in `BRANCHING_STRATEGY.md`; the short version to enter:

- Require a pull request before merging (no exceptions, including admins)
- Require status checks to pass before merging, branches up to date:
  - `Lint & Typecheck`
  - `Build`
  - `Playwright (smoke + accessibility)`
  - `Analyze (javascript-typescript)` (CodeQL)
  - `Dependency Review` (only becomes reliably green after item 1 above)
- Leave `Prettier (informational)` and `Dependency audit (informational unless high/critical)` **not required** — making them required today would block every PR (the codebase has a 516-file pre-existing Prettier backlog; see `CI_PIPELINE.md` Decision Register #1).
- Require conversation resolution before merging
- Require linear history
- Disallow force pushes and branch deletion

**Do this last of the three sections above**, once item 1 is enabled — otherwise `Dependency Review` would be a required check that can never pass.

## 4. CODEOWNERS enforcement — not yet, informational only

`.github/CODEOWNERS` currently ships as a documented placeholder (`* @oohearth`) — see the comment at the top of that file. It has no effect until (a) it's edited to point at a real second maintainer's GitHub username, and (b) "Require review from Code Owners" is turned on in the same branch protection rule as item 3. Nothing to do here until there's a second regular contributor — noted so it isn't forgotten, not because it's actionable today.

## 5. Repository secrets — none currently needed

Worth stating plainly: nothing in the current pipeline (`ci.yml`, `codeql.yml`, `release-please.yml`, `dependabot.yml`) requires a repository secret beyond the automatic `GITHUB_TOKEN`. No Base44, Stripe, or crypto credentials are used in CI — there's no live backend in the test environment by design (`CI_PIPELINE.md`). If a future workflow needs a real secret (e.g. a deploy step), add it under **Settings → Secrets and variables → Actions** at that time, scoped as narrowly as possible, and prefer a GitHub **Environment** (item 6) with required reviewers over a bare repo secret if it can trigger production changes.

## 6. Environments / deployment protection — not yet configured

No GitHub Environment exists yet because there's no GitHub-triggered deployment step in this pipeline today (Base44 remains the deploy target, per `CLAUDE.md`). If/when a workflow is added that deploys or writes to production, create a **Production** environment (**Settings → Environments**) with required reviewers before wiring any deploy credentials to it — don't let a production-writing workflow run unattended off a bare secret.

---

## Priority order

1. **Dependency graph** (item 1) — unblocks the one real failing check on the open PR today.
2. **Actions workflow permissions** (item 2) — confirms the PR summary comment actually posts; quick to verify.
3. **Branch protection** (item 3) — do once item 1 is live, so the required checks list is accurate from the start.
4. Items 4–6 — no action needed until their triggering condition (second contributor, first deploy workflow) actually arrives.
