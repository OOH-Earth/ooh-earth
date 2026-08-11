# Release Process

## How it works

[`googleapis/release-please`](https://github.com/googleapis/release-please) watches every push to `main` (`.github/workflows/release-please.yml`) and keeps one standing "release PR" up to date, built from Conventional Commit messages since the last release. Merging that PR is what actually cuts a release:

1. You merge normal PRs into `main` using Conventional Commit-style titles (see below) — squash merge, so the PR title *is* the commit message (BRANCHING_STRATEGY.md).
2. release-please opens/updates a PR titled something like `chore(main): release 0.2.0`, containing a version bump in `package.json` and a new `CHANGELOG.md` section generated from those commits.
3. When *that* PR is merged, release-please tags the commit and publishes GitHub Release notes.

Nothing here runs `npm publish`. This app isn't distributed via the npm registry (`"private": true` in `package.json`) — release-please only manages the version field, the changelog, and the git tag/GitHub Release.

## Conventional Commits — this is the part that needs adoption

Recent commit history (`git log --oneline`) is almost entirely `External agent changes` / `File changes` — not Conventional Commits format. **This automation only works from the point the team starts using the format going forward; it does not retrofit history.** If PR titles don't follow the format below, release-please will find nothing to bucket and won't open a release PR, or will only be able to infer a generic patch bump.

Format: `type(scope): subject`

| Type | Triggers | Example |
|---|---|---|
| `feat` | minor bump | `feat(map): add access-key filter to toolbar` |
| `fix` | patch bump | `fix(donation): correct Stripe metadata on product checkout` |
| `feat!` / `fix!` / any type with `BREAKING CHANGE:` in the body | major bump | `feat(auth)!: require token refresh on every request` |
| `chore`, `docs`, `refactor`, `test`, `ci`, `style`, `perf` | no version bump, but still shows in the changelog under its own heading | `chore(deps): bump vite to 6.2` |

Scope is optional but encouraged (`map`, `donation`, `radio`, `auth`, `ci`, …) — it's what makes the generated CHANGELOG.md scannable instead of a flat list.

## `CHANGELOG.md`

This repo already has a hand-curated `CHANGELOG.md` ("Changelog & Pre-Launch Checklist") going back to the project's early days. release-please **prepends** new automated sections above existing content — it never rewrites or deletes what's there. The two styles will sit side by side: hand-written narrative entries below, terse Conventional-Commits-derived sections (`## [0.2.0]`) accumulating above them once releases start. Skim each release-please PR before merging — automation quality is only as good as the commit messages it's built from.

## First release

`package.json` is currently at `0.0.0` and `.release-please-manifest.json` matches it. The first release-please PR (once qualifying commits land on `main`) will propose `0.1.0` for a `feat` commit or `1.0.0` if any commit is marked breaking — release-please's own judgment call from Conventional Commits semantics, not something configured here. If the team wants the first tag to be `1.0.0` regardless, that's a one-line edit to `.release-please-manifest.json` before the first release PR merges, worth a deliberate decision rather than defaulting into it.

## Config files

- `.github/workflows/release-please.yml` — the workflow.
- `release-please-config.json` — release type (`node`, so it tracks `package.json`), changelog path.
- `.release-please-manifest.json` — current version, what release-please diffs against.
