# Merge Plan

Concrete steps, not a restatement of the review. See `ENGINEERING_REVIEW.md` for the reasoning behind the order.

## Order

1. `engineering/baseline` → `main`
2. `feature/engineering-pipeline` → `main`

## Step 1 — merge `engineering/baseline`

Clean merge, verified via `git merge-tree` against current `main` — zero conflicts.

```bash
git checkout -b engineering/baseline-pr origin/main   # or push the branch and open a PR normally
git push -u origin engineering/baseline
# open PR: engineering/baseline -> main
```

Merge method: **squash or regular merge, either is fine** — commit history on this branch is already clean (see Commit Quality in the review). No pre-merge action needed beyond normal PR review.

After merge: confirm `main` is green —

```bash
npm ci
npm run lint       # expect 0
npm run typecheck  # expect 0
npm run build      # expect clean
```

## Step 2 — merge `feature/engineering-pipeline`

**Not a clean merge against post-step-1 `main`.** Verified via `git merge-tree`: 3 conflicting files.

### Before opening the PR

Rebase (or merge `main` into) `feature/engineering-pipeline` locally first, so the conflicts are resolved once, on the feature branch, not in GitHub's UI mid-review:

```bash
git checkout feature/engineering-pipeline
git fetch origin
git merge origin/main   # main now includes engineering/baseline's changes
```

Three files will conflict. Resolve each like this:

**`package.json`** — one adjacent-line conflict in `devDependencies`. Keep both sides' additions (they're different packages, not competing versions of the same one):
```json
"@axe-core/playwright": "^4.12.1",
"@eslint/js": "^9.19.0",
"@playwright/test": "^1.62.1",
"@types/leaflet": "^1.9.22",
"@types/node": "^22.13.5",
...
"@types/three": "^0.185.4",
...
"prettier": "^3.9.6",
```
(Exact alphabetical position doesn't matter functionally — npm doesn't care about key order — but keeping it alphabetized matches the rest of the file.)

**`package-lock.json`** — don't hand-resolve. Delete it, keep the merged `package.json`, then:
```bash
rm package-lock.json
npm install
```
This regenerates a lockfile consistent with the merged dependency set instead of hand-splicing two independently-generated lockfiles (which risks a subtly broken tree).

**`ENGINEERING_SUMMARY.md`** — real content collision, not a mechanical merge. Recommendation: keep the version from `feature/engineering-pipeline` (the cross-branch one — it describes both efforts and is the more complete document); the `engineering/baseline` version's factual content already lives in `TECHNICAL_DEBT_REGISTER.md` on that branch. Concretely:
```bash
git checkout --theirs ENGINEERING_SUMMARY.md   # or --ours, depending which side you're merging from — pick the pipeline-branch version
git add ENGINEERING_SUMMARY.md
```

### Verify after resolving

```bash
npm run lint        # expect 0 (engineering/baseline's fixes are now in main)
npm run typecheck   # expect 0
npm run build         # expect clean
npx playwright test   # expect 4/4 pass — needs a browser install: npx playwright install chromium
git status             # confirm no leftover conflict markers anywhere
```

### Open the PR

```bash
git push -u origin feature/engineering-pipeline
# open PR: feature/engineering-pipeline -> main
```

Once this merges, `CI_PIPELINE.md`'s "known-red gates" section is stale (main is green now) — worth a one-line follow-up docs PR, not blocking.

## Do not

- Do not merge `feature/engineering-pipeline` first. Its `lint-and-typecheck` CI gate will be red against pre-baseline `main`, and the conflict-resolution direction in this doc assumes baseline is already in.
- Do not force-push either branch to resolve the conflict — merge/rebase locally, verify green, then push normally.
- Do not hand-edit the merged `package-lock.json`. Regenerate it.
