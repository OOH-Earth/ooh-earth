# Pre-migration visual baselines (Tailwind 4 safety net)

Reference for how the application looked at the **qualified BACKUP candidate `4fb6cad3c2c908be7f9d559ea825e363f9a9e240`** before any Tailwind 4 work. It does not change the application, qualify anything, or authorize a migration.

## What is captured
8 states x 3 viewports = **24 screenshots** (`e2e/visual/__baselines__/`): Main Map (disabled generated layers), Capture dialog with manual-coordinate focus, Location Detail, Location research panel (fixture, no live request), Ecology (observations), Rivers (observed station selected), Field Route (saved route), Hackers Club. Viewports 360x800, 844x390, 1440x900. Page-level screenshots for the two long pages (Field Route, Hackers Club) are full-page.

## Determinism controls (`e2e/visual/visual.spec.ts`, `playwright.visual.config.ts`)
- Browser pinned by the lockfile: `@playwright/test` 1.63.0 -> Chrome for Testing 153.0.8010.12 (Playwright revision 1243). Device scale factor 1, dark colour scheme, reduced motion, `en-US`, `UTC`, animations disabled, caret hidden, one worker, zero retries.
- Fonts: Google Fonts CSS is stubbed empty, so text renders in the machine's fallback fonts (DejaVu on the reference machine).
- Time: `page.clock.setFixedTime(2026-10-08T00:00:00Z)` (header clocks/counters are stable). Geolocation denied, camera unavailable.
- Network: every non-local request is aborted unless stubbed; Leaflet tiles are a constant 1x1 PNG; Base44 entities, environment tiles, iNaturalist and USGS/EA are the same fixtures the e2e suite uses. **No provider-network test is here** (those stay in `e2e/rivers-observed.spec.ts` etc. and the separate real-provider check).
- **MapLibre canvases are masked** (shown magenta in the images): software-GL raster is not stable enough to compare. Map *chrome* (buttons, panels, legends, cards, detail panels) is compared; map *pixels* are not.
- Threshold: `maxDiffPixelRatio` 0.002. Tight on purpose.
- Determinism evidence: baselines were generated, then compared by a second full run on the same machine: 24/24 pass.

## Environment of record
Ubuntu 24.04.4 on WSL2, Node 26.8.2, 156 installed font files (sans-serif -> DejaVu Sans, monospace -> DejaVu Sans Mono). Baselines are valid **only on a machine with the same browser build and fonts**. They are deliberately **not** part of per-PR CI (`testIgnore: **/visual/**`) because a different runner would diff for reasons unrelated to the code. Run: `npm run build && npm run test:visual`. Create new baselines only with `npm run test:visual:update` in the same environment.

## Review notes (images were inspected before commit)
- A first generation was discarded: a `canvas` mask covered the full page (solid magenta), which would have "passed" forever. Only `canvas.maplibregl-canvas` is masked now.
- Rivers at 360x800: the station detail panel overlaps the page title block at the top of the viewport. That is how the app renders at the reference commit; it is baselined, not endorsed. A migration must not change it silently, and fixing it is a separate product change.
- Disabled mushroom/flora layers and the "Ecology observations" link are visible in Main Map; the capture dialog shows the camera-unavailable and manual-coordinate states.

## Rules for using this suite during a migration
Never auto-accept differences (`--update-snapshots` only after a person reviews each diff image); record every accepted difference with its reason; capture the same states on the migrated build in the same environment; keep this suite separate from provider-network tests; keep it as the rollback verification.

## Limits
Chromium only: this is **not** Safari/WebKit or Firefox evidence, and not physical-phone evidence. Masked map canvases are not compared. Fallback fonts differ from the production web fonts. See doc 27 for the browser-support question.
