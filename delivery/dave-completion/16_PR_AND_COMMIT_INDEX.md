# PR and Commit Index

## This completion pass (merged, `main` @ `5877661`)

| PR | Title | Merged |
|---|---|---|
| #91 | feat(map): surface corporate footprint via parent_corp cross-referencing | 2026-08-18 |
| #92 | feat(map): add report-density Activity Heat layer | 2026-08-18 |
| #93 | feat(map): make brand and parent corporation searchable/filterable | 2026-08-18 |
| #95 | feat(ar): surface parent corporation in AR's done-state summary | 2026-08-18 |
| #96 | feat(map): clicking a heat hotspot opens the nearest report | 2026-08-18 |

## Preceding convergence effort (same overall product push, for continuity)

| PR | Title | Merged |
|---|---|---|
| #85 | ci: add a per-job test-result summary so Playwright failures are triageable in seconds | 2026-08-17 |
| #84 | feat(map): highlight a user's own newly-created contribution | 2026-08-17 |
| #83 | fix(ar): give a filed AR report a way back into the product | 2026-08-17 |
| #82 | chore(deps): upgrade recharts 2.15.4 -> 3.10.1 | 2026-08-16 |
| #81 | fix(ar): frame the AR CO2 overlay as an average, not a per-billboard measurement | 2026-08-16 |
| #80 | feat(ar): identify the brand in AR-filed reports via the same scanner /report uses | 2026-08-16 |
| #79 | fix(portals): disclose sample-data fallback on the adbusting/graffiti discovery portals | 2026-08-16 |
| #78 | feat(location): cross-reference ooh_operator against the real MediaCorp registry | 2026-08-16 |
| #77 | fix(nft): surface AI-generate failures, stop overclaiming "Mint on Zora" | 2026-08-16 |
| #76 | fix(status): consolidate duplicated status-color logic | 2026-08-16 |
| #75 | feat(advertiser): give parent-corp sector data a real, structured source | 2026-08-16 |
| #74 | fix(report): stop Step 2 from silently re-running Step 1's AI scan | 2026-08-16 |
| #73 | fix(ui): stop CommandCenter's closed state from trapping GraffitiCamera | 2026-08-16 |
| #72 | fix(a11y): make label-wrapped file-picker controls keyboard-operable | 2026-08-16 |
| #71 | feat(nav): lead the primary menu with Tools, add progressive disclosure | 2026-08-16 |
| #70 | fix(ci): give gh workflow run explicit repo context in release-please.yml | 2026-08-15 |
| #69 | feat(data): pilot useQuery on StoreAdmin, hard-stop on LabAdmin | 2026-08-16 |
| #68 | chore(codeql): resolve 12 open js/unused-local-variable findings | 2026-08-16 |
| #67 | fix(mobile): clear the fixed bottom nav from SiteFooter's last content | 2026-08-16 |
| #66 | docs: field-testing playbook + structured GitHub Issues intake | 2026-08-16 |
| #65 | feat(a11y): adopt useFocusTrap in UnitFinder | 2026-08-15 |
| #64 | ci(release): re-dispatch CI/CodeQL onto release-please PRs | 2026-08-15 |
| #62 | feat(a11y): WAI-ARIA focus-trap foundation | 2026-08-13 |
| #61 | docs(known-issues): confirm CSP's external blocker precisely | 2026-08-13 |
| #60 | security(ci): pin third-party GitHub Actions to immutable commit SHAs | 2026-08-13 |
| #59 | feat(map): spotlight locations with verified before/after evidence | 2026-08-13 |
| #58 | perf(fonts): load Google Fonts asynchronously to unblock first paint | 2026-08-13 |
| #57 | chore(main): release 1.2.0 | 2026-08-13 |
| #56 | feat(location): use original report photo as before/after baseline | 2026-08-13 |
| #54 | fix(telemetry): correct cancelled-flag typo in TelemetryBar | 2026-08-12 |
| #53 | feat(field-check): AI condition scan in the revisit flow | 2026-08-12 |
| #52 | chore(deps): upgrade react-router-dom to v7.18.2 | 2026-08-12 |
| #50 | fix(security): client-side validation on all real photo-upload sites | 2026-08-12 |

## Open, unmerged (not part of this pass's scope)

| PR | Title | Status |
|---|---|---|
| #63 | chore(main): release 1.3.0 | Blocked — see `14_RELEASE_STATUS.md` |
| #20, #23, #35, #36, #37, #39, #87, #88, #89, #90 | Dependabot dependency bumps | Deliberately untouched — no product value review performed this pass, per instruction not to blindly process dependency PRs |

## Merge discipline applied to every PR in this pass

1. Fresh `gh pr view <n> --json mergeable,mergeStateStatus` immediately before merge (not reused from an earlier check)
2. All 10 required CI checks confirmed green
3. Review threads confirmed resolved/none
4. File scope confirmed to match intent exactly (`gh pr diff --name-only`)
5. Squash merge, branch deleted
6. `git fetch origin main` + `git log origin/main -1` to confirm the merge commit landed
7. Independent post-merge verification (fresh checkout, lint/typecheck/prettier/build/regression tests)
