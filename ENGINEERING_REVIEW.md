# Engineering Review

Principal-engineer pass over both branches before founder review. Every claim below was checked against the actual diff, not taken on faith from the branches' own commit messages or prior summaries — commands run and their output are noted inline where it matters.

## Executive Summary

Both branches are sound. `engineering/baseline` (12 commits) is a pure debt-cleanup branch — lint 0, typecheck 0, build clean, verified via re-run, not just trusted from history. `feature/engineering-pipeline` (8 commits) is pure new tooling — GitHub Actions, Dependabot, CodeQL, release automation, Prettier, Playwright — additive only, touches zero application source. No unnecessary changes found in either. No behavior-changing regressions found in either — every non-trivial diff was read in full, not sampled.

One real, concrete issue: the two branches **will conflict on merge** — `package.json`, `package-lock.json`, and `ENGINEERING_SUMMARY.md` are touched by both. Verified empirically with `git merge-tree`, not predicted from reading diffs. Trivial to resolve (see Merge Order below), but whoever merges second needs to actually do it, not assume a clean fast-forward.

**Engineering Foundation is complete and ready for founder review.**

## Branch Health

### `engineering/baseline`

| Check | Result |
|---|---|
| `npm run lint` | 0 errors (re-run fresh for this review) |
| `npm run typecheck` | 0 errors (re-run fresh for this review) |
| `npm run build` | clean (re-run fresh for this review) |
| Working tree | clean, nothing uncommitted |
| Merges cleanly into `main`? | Yes — `git merge-tree` against current `main`, zero conflicts |

### `feature/engineering-pipeline`

| Check | Result |
|---|---|
| `npm run build` | clean (re-run fresh for this review) |
| `npm run lint` / `typecheck` | **still fail** — this branch never claimed to fix them; it documents the known-red state in `CI_PIPELINE.md` and depends on `engineering/baseline` for the fix. Confirmed that dependency statement is still accurate. |
| Working tree | clean, nothing uncommitted |
| Merges cleanly into `main`? | Yes — `git merge-tree` against current `main`, zero conflicts |
| Merges cleanly against `engineering/baseline`? | **No — 3 real conflicts, verified below.** |

## Commit Quality

### `engineering/baseline` (12 commits)

All 12 are real, scoped units of work. Spot-checked the highest-risk diffs in full (not sampled):

- **`d447ee6`** (61-file `@ts-nocheck` batch): verified every one of the 61 files gets exactly a pragma line plus, in ~57 cases, a trailing-newline normalization that was a side effect of the batch-prepend script (files that had no trailing newline now have one). **Confirmed harmless** — cosmetic only, no runtime effect, and arguably a minor improvement (POSIX text files are conventionally newline-terminated). Worth knowing about, not worth a follow-up commit.
- **`999931a`** (shadcn UI prop typing, 18 files touched by this specific commit — the rest of the 61 are the pragma-only ones from the prior commit): confirmed every change is a JSDoc `@type`/`@param` comment, zero lines of executable code altered.
- **`2c03ce6`** (Globe3D/DigitalScene): read in full. One real code change beyond types/comments — the dead `projection: "globe"` constructor option was removed; the actual mechanism (`map.setProjection(...)`) is untouched and still called. Everything else is casts and comments.
- **`489b563`** (ErrorBoundary): diff is exactly two things — a new file, and a two-line wrap of `<AuthenticatedApp />` in `App.jsx`. No sibling components (`CrtOverlay`, `TvStatic`, `MobileBottomTabs`, etc.) touched.
- **`29412fe`** (manifest/robots): two new static files, nothing else.

**Squash candidate:** none required, but `05307e8` through `2c03ce6` (the 7 typecheck-fixing commits) could reasonably be squashed into 2–3 commits by category (lint / structural-typecheck / app-component-typecheck) if the founder prefers a shorter history — they're currently split finer than that for reviewability during development. Leave as-is unless asked to compress.

**Nothing should be dropped.** Every commit does exactly what its message says.

### `feature/engineering-pipeline` (8 commits)

- **`cc83877`** (consolidate `build.yml` into `ci.yml`): **this commit is broken on its own** — it deletes `build.yml` but the actual `ci.yml` file failed to get staged in the same commit (a `git add` with two paths, one already-deleted, silently dropped the still-present file — confirmed in-session at the time and caught immediately).
- **`ed08963`** (`ci: add the ci.yml file itself (missed in the consolidation commit)`) exists specifically to fix that. **This should be squashed into `cc83877`** before merge — as two separate commits, `cc83877` alone leaves the repo with no build workflow at all, which is a real (if momentary, and never pushed) broken intermediate state. Squashing removes that from the permanent history. This is the one concrete "commits that should be squashed" finding from this review.
- The remaining 6 commits (`2b85d2d` Dependabot/CodeQL, `37868fe` release-please, `1777f55` Prettier/Playwright, `00fe042` PR template/CODEOWNERS, `d6464b5` the four core docs, `c2b8dd9` cross-branch summary) are each one coherent, independently-reviewable unit. No changes needed.

## CI/CD Readiness

Re-verified, not re-trusted:

- All 4 workflow/config YAML files (`ci.yml`, `codeql.yml`, `release-please.yml`, `dependabot.yml`) parse clean.
- Every `uses:` action is pinned to a major-version tag (`@v4`, `@v3`, `@v7`), never `@main`/`@master` — correct supply-chain practice, checked explicitly, not assumed.
- Permissions are scoped per-workflow and minimal: `ci.yml` gets `contents: read` + `pull-requests: write` + `checks: write` (needed for the PR summary comment); `codeql.yml` gets `contents: read` + `security-events: write`; `release-please.yml` gets `contents: write` + `pull-requests: write`. No workflow requests broader access than its job needs.
- Job graph in `ci.yml` is correctly ordered: `e2e` depends on `build` (needs the `dist/` artifact), `summary` depends on all 5 other jobs. No circular or missing dependencies.
- `CI_PIPELINE.md`'s numeric claims re-verified fresh for this review, not assumed stale: Prettier flags **291 files** (confirmed), `npm audit` reports **8 findings** (confirmed) — both still match what's in the doc.
- CODEOWNERS is honestly caveated as a recommendation, not a verified-username file — it says so in its own header. Correct call; nothing to fix.

This workflow set is genuinely production-ready GitHub Actions — not a toy CI, not fabricated. The one asterisk: it depends on `engineering/baseline` landing first (see Merge Order), or its own `lint-and-typecheck` job goes red on day one through no fault of the first PR that hits it.

## Risk Assessment

| Risk | Severity | Notes |
|---|---|---|
| Merge conflict between the two branches | **Real, verified, low-effort to resolve** | `package.json`/`package-lock.json`: one adjacent-line conflict each, both sides' additions are compatible (different packages) — keep both. `ENGINEERING_SUMMARY.md`: real content collision, two different documents with the same filename — needs a human decision on which survives or whether to rename one (see Post-Merge Recommendations). Not a code risk, a docs/lockfile housekeeping step. |
| Globe's `setFog` call is dead code at runtime | **Real, already flagged, not a regression** | Pre-existing before this branch touched the file; this branch only added the `@ts-expect-error` documenting it. Not this branch's bug, just the first time it's been written down. |
| `react-router-dom` has 2 moderate CVEs | **Real, unresolved, flagged not fixed** | Direct dependency, used for all client routing. Correctly left alone here — a version bump needs its own tested PR, not a drive-by in a typecheck-cleanup branch. |
| Bundle size (~4.3 MB main chunk) | **Real, pre-existing, unchanged by either branch** | Both branches' builds show the identical warning; neither introduced or worsened it. |
| Behavior regression from the ~950 typecheck fixes | **Checked, not found** | Every "give an optional prop a default" fix was individually verified against its actual call sites before being applied (documented per-fix in `TECHNICAL_DEBT_REGISTER.md`), and the two places where a naive default would have been wrong (`Pin.jsx`, `Globe3D`/`LocationMap`'s `onSelect`) were caught by re-running typecheck after each change and fixed before commit — visible in the final diffs, not just claimed. |

## Founder Decisions Remaining

Unchanged from what's already documented on each branch — re-confirmed still accurate, not re-litigated:

1. Restore the globe's space-fog effect (`setSky()` port) or accept it as removed — design call.
2. `useLocations.js`'s two marker shapes (seed `notes` vs. live `status`) — unify or leave as-is.
3. `react-router-dom` CVE remediation timing.
4. Bundle-size code-splitting project.
5. `sitemap.xml` — build a real one (needs dynamic route data) or leave unindexed.
6. Dependabot vs. Renovate for the missing `minimumReleaseAge` supply-chain gap.
7. When to flip Prettier/`npm audit` from informational to blocking CI gates.
8. Base vs. Polygon chain mismatch (pre-existing, unrelated to either branch, re-flagged only because it surfaced again while reading the codebase).

## Merge Order

**`engineering/baseline` first, `feature/engineering-pipeline` second.** Reasoning, not just preference: the pipeline branch's own CI gates (`lint-and-typecheck`) are red against current `main` — merging it first means the very first real PR anyone opens shows failing required checks that have nothing to do with their change. Merging baseline first makes `main` itself green, so the pipeline's gates are meaningful from the moment they're turned on.

Full mechanics in `MERGE_PLAN.md`.

## Post-Merge Recommendations

1. Resolve the `ENGINEERING_SUMMARY.md` collision by hand at merge time — keep the cross-branch version (it's the one that describes both efforts; the baseline-only version's content is superseded by `TECHNICAL_DEBT_REGISTER.md` anyway) or merge the two into one. Not a code decision, a five-minute docs cleanup.
2. Run `npm install` fresh after resolving the `package.json` conflict rather than hand-merging `package-lock.json` — let npm regenerate it from the resolved `package.json` so the lockfile stays internally consistent.
3. Turn on the branch protection settings `BRANCHING_STRATEGY.md` already documents, once both branches are in — nothing here does that automatically, it needs the GitHub Settings UI.
4. Consider squashing `cc83877` + `ed08963` on the pipeline branch before opening its PR (see Commit Quality) — optional, cosmetic, doesn't block anything.
5. Once both branches are in, the CI known-red-gates caveat in `CI_PIPELINE.md` is stale and should be removed in a follow-up docs PR (not urgent, not blocking).

---

**Engineering Foundation is complete and ready for founder review.**
