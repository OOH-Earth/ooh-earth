# PR & Commit Manifest

Every row verified fresh against GitHub (`gh pr list --state merged
--json number,title,mergedAt,mergeCommit`) at delivery time — not
transcribed from memory or an earlier report.

## This delivery pass (2026-08-18)

| PR | Title | Merge commit | Merged |
|---|---|---|---|
| #91 | feat(map): surface corporate footprint via parent_corp cross-referencing | `da16399` | 2026-08-18 |
| #92 | feat(map): add report-density Activity Heat layer | `f3e896f` | 2026-08-18 |
| #93 | feat(map): make brand and parent corporation searchable/filterable | `c447448` | 2026-08-18 |
| #95 | feat(ar): surface parent corporation in AR's done-state summary | `fec6c47` | 2026-08-18 |
| #96 | feat(map): clicking a heat hotspot opens the nearest report | `5877661` | 2026-08-18 |
| #97 | docs: Dave completion delivery package | `a94819d` | 2026-08-18 |
| #98 | feat(nft): connect earned merit badges to the NFT studio | `4ca1381` | 2026-08-18 |
| #99 | ci: extend job-summary triage to Lint/Typecheck/Prettier/Build | `0c22970` | 2026-08-18 |
| #100 | docs: finalize Dave completion delivery package post-merge | `43bfe9d` | 2026-08-18 |

**Current `main` HEAD: `43bfe9d`.**

## Preceding convergence effort (same overall product push, for continuity)

| PR | Title | Merge commit | Merged |
|---|---|---|---|
| #85 | ci: add a per-job test-result summary so Playwright failures are triageable in seconds | `b3e6664` | 2026-08-17 |
| #84 | feat(map): highlight a user's own newly-created contribution | `33b1522` | 2026-08-17 |
| #83 | fix(ar): give a filed AR report a way back into the product | `5b85b32` | 2026-08-17 |
| #82 | chore(deps): upgrade recharts 2.15.4 -> 3.10.1 | `40e87ce` | 2026-08-16 |
| #81 | fix(ar): frame the AR CO2 overlay as an average, not a per-billboard measurement | `ed5fca9` | 2026-08-16 |
| #80 | feat(ar): identify the brand in AR-filed reports via the same scanner /report uses | `89fc849` | 2026-08-16 |
| #79 | fix(portals): disclose sample-data fallback on the adbusting/graffiti discovery portals | `b76b504` | 2026-08-16 |
| #78 | feat(location): cross-reference ooh_operator against the real MediaCorp registry | `dd5e58d` | 2026-08-16 |
| #77 | fix(nft): surface AI-generate failures, stop overclaiming "Mint on Zora" | `723cc29` | 2026-08-16 |
| #76 | fix(status): consolidate duplicated status-color logic | `3b5d73f` | 2026-08-16 |
| #75 | feat(advertiser): give parent-corp sector data a real, structured source | `d5093dc` | 2026-08-16 |
| #74 | fix(report): stop Step 2 from silently re-running Step 1's AI scan | `a4de958` | 2026-08-16 |
| #73 | fix(ui): stop CommandCenter's closed state from trapping GraffitiCamera | `0338c8c` | 2026-08-16 |
| #72 | fix(a11y): make label-wrapped file-picker controls keyboard-operable | `d366499` | 2026-08-16 |
| #71 | feat(nav): lead the primary menu with Tools, add progressive disclosure | `30ba3ad` | 2026-08-16 |
| #70 | fix(ci): give gh workflow run explicit repo context in release-please.yml | `7bbc797` | 2026-08-15 |
| #69 | feat(data): pilot useQuery on StoreAdmin, hard-stop on LabAdmin | `53bd499` | 2026-08-16 |
| #68 | chore(codeql): resolve 12 open js/unused-local-variable findings | `27349c5` | 2026-08-16 |
| #67 | fix(mobile): clear the fixed bottom nav from SiteFooter's last content | `0b36a9e` | 2026-08-16 |
| #66 | docs: field-testing playbook + structured GitHub Issues intake | `a598fa5` | 2026-08-16 |
| #65 | feat(a11y): adopt useFocusTrap in UnitFinder | `96942cd` | 2026-08-15 |
| #64 | ci(release): re-dispatch CI/CodeQL onto release-please PRs | `f9fed2a` | 2026-08-15 |

## Open, not part of this pass's scope (verified, not touched)

| PR | Title | Status |
|---|---|---|
| #63 | chore(main): release 1.3.0 | Blocked — see `14_RELEASE_STATUS.md` |
| #20, #23, #35, #36, #37, #39, #87, #88, #89, #90, #94 | Dependabot dependency bumps | Deliberately untouched — no product-value review performed this pass |

## Merge discipline applied to every PR merged this pass

1. Fresh `gh pr view <n> --json mergeable,mergeStateStatus` immediately before merge
2. All 10 required CI checks confirmed green
3. Review threads confirmed resolved/none
4. File scope confirmed to match intent exactly (`gh pr diff --name-only`)
5. Squash merge, branch deleted
6. `git fetch origin main` + `git log origin/main -1` to confirm the merge commit landed
7. Independent post-merge verification (fresh checkout, lint/typecheck/prettier/build/regression tests)
