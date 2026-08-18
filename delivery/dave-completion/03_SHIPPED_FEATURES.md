# Shipped Features — This Completion Pass

All merged to `main`, all independently post-merge verified (fresh checkout,
lint/typecheck/prettier/build/regression tests — not cached).

## PR #91 — Corporate footprint cross-referencing
**Files:** `RelatedLocations.jsx`, `e2e/related-locations-parent-corp.spec.ts`
**Problem:** `parent_corp` was captured on every location but never cross-referenced — two differently-branded surfaces under the same holding company had no visible link.
**Fix:** A second "same parent corporation" group alongside the existing "same advertiser" group, excluding same-brand matches so the two stay distinct. No new entity.
**Evidence:** Fail-before/pass-after, 2/2 pass.

## PR #92 — Activity Heat map layer
**Files:** `HeatLayer.jsx` (new), `LayerManager.jsx`, `MapLayerToggle.jsx`, `LocationMap.jsx`, `Map.jsx`, `index.css`, `package.json`/`package-lock.json` (`leaflet.heat`), `e2e/heat-layer.spec.ts`
**Problem:** No way to see where report activity concentrates geographically.
**Fix:** Toggleable report-density heat layer via `leaflet.heat`, wired through the existing layer-toggle registry. Two real bugs found via testing and fixed: (1) `Map.jsx`'s marker-filtering logic starved the heat layer of data in one layer combination; (2) a site-wide `canvas{max-width:100%}` CSS reset collapsed the heat canvas to 0×0 against Leaflet's unsized overlay pane.
**Evidence:** Fail-before/pass-after, 2/2 pass; both bugs confirmed via real browser interaction, not assumed.

## PR #93 — Brand/parent-corp map search
**Files:** `Map.jsx`, `e2e/map-brand-search.spec.ts`
**Problem:** Map search only matched title/address; searching "Shell" found nothing even though `brand_name`/`parent_corp` were already on every marker.
**Fix:** One-line extension of the existing query match.
**Evidence:** Fail-before/pass-after, 2/2 pass.

## PR #95 — Parent corporation in AR's result summary
**Files:** `ArLens.jsx`, `e2e/ar-lens-brand-scan.spec.ts`
**Problem:** AR's done-state summary showed brand + operator but silently dropped the already-detected, already-saved parent_corp.
**Fix:** One-line addition to the existing summary string, matching the pattern `ooh_operator` already used.
**Evidence:** Fail-before/pass-after via a precise assertion extension; full 3-test AR suite still passes.

## PR #96 — Heat hotspot → nearest report handoff
**Files:** `HeatLayer.jsx`, `LayerManager.jsx`, `LocationMap.jsx`, `e2e/heat-layer-click-handoff.spec.ts`
**Problem:** The heat layer had no interaction — a hotspot was a picture of the data, not a way into it.
**Fix:** A map click near a real point opens that report the same way tapping its pin already does (`onExpandPin`), reusing 100% existing selection/detail-sheet machinery. Legend updated to make it discoverable.
**Evidence:** Fail-before/pass-after, 2/2 pass. **A real CI-only TypeScript error was caught and fixed post-open** (`map.off()` returns Leaflet's `Map` for chaining, which isn't assignable to React's void-only effect-destructor type) — first local typecheck run had gone stale; the fix was verified with a fresh run before re-push, and CI confirmed green afterward.

## Also part of this convergence effort (merged earlier, listed for completeness)
PR #85 — Per-job Playwright CI job summaries (pass/fail counts, failing test titles, file:line, trimmed error, artifact pointer), with a real CodeQL-flagged backslash-escaping bug found and fixed in the same PR.

---

## Real defects found and fixed via testing (not assumed away)

1. Heat canvas 0×0 sizing bug (CSS reset collision) — PR #92
2. Heat layer starved of data in one layer-toggle combination — PR #92
3. CodeQL incomplete-escaping bug in the CI summary script — PR #85
4. TypeScript effect-destructor typing error, CI-only (stale local typecheck) — PR #96

Each was root-caused via direct inspection (computed-style dumps, CI log
reading, real browser interaction) before being fixed — none were patched by
guessing.
