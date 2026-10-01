# Work production truth - 2026-10-01

## Current source and environments

- Current origin/main: `133e9db922da2746594626ab66c7779983373c68` (#318).
- #308 merged as `1cd9d2676c0a44002cabcf6182e39b1956dab462`; GitHub CI summary records all blocking gates successful.
- #318 is merged; its head CI and CodeQL workflow runs are successful.
- Production manifest identifies #308, not #318. A fresh clean build from #308 with only `VITE_BASE44_APP_ID=6a62213cff3ccbca88c04ff5` exactly matches production entry `assets/index-BN4u-e3V.js` and `Globe3D-DtphFOlP.js` byte for byte.
- Live entry SHA256: `8a09cb363ebaca51d9fa0e88e656f685d0343e8dad580d822240d663a41f1dda`. Production ID occurs eight times; BACKUP ID occurs zero times.
- BACKUP manifest identifies #318 (`133e9db`). This manifest alone does not prove rendered qualification.
- #308 implementation is live. No redundant deployment was performed. Production geometry closure remains pending a WebGL2-capable browser.

## Browser and deployment limitations

The available cloud Chromium displays Home's page error boundary. Console evidence identifies `GPUInitializationError: WebGL2 is required` from Globe3D map construction. Reload reproduces it. This is a concrete unsupported-device failure, not evidence that supported devices fail or that popup geometry regressed.

The local Playwright browser installer fails with truncated/non-ZIP download errors. No local Chromium execution or responsive geometry QA is claimed. No Chrome DevTools MCP is exposed.

Base44 CLI 0.1.14 `whoami` reports no authenticated session and automatically starts device login. The waiting login was cancelled. No deployment was attempted and no deployment-classifier denial occurred in this session. Authentication must be restored through the normal CLI login before BACKUP qualification. No production entity/resource writes were initiated.

## Bounded BUILD candidate

Catch only MapLibre's `GPUInitializationError` during globe construction. Home retains a clear, keyboard-accessible field-map link; Map reuses its existing `onError` transition to Flat. Other initialization errors continue to surface. Popup placement, glyphs, worker setup, schemas, permissions, data access, and subscriptions are unchanged.

Regression spec forces WebGL2 unavailable and exercises Home -> Map -> Leaflet across 360x800, 844x390, 1440x900. Browser execution is pending. Keep this candidate draft until BACKUP rendered QA and required gates are complete. Do not merge/deploy it based solely on static checks.

## Next serialized release

1. Finish real rendered production #308 geometry QA on a WebGL2-capable browser.
2. Reconcile #318 BACKUP live assets and activity-card behavior before promoting its merged source; do not combine the unmerged fallback into its release.
3. Qualify the fallback separately on BACKUP, run the forced-WebGL2 regression and normal globe geometry suite, then PR/CI/merge and fresh production build.

## Authorized continuation - 2026-10-01

Owner supplied #308 release QA: deterministic geometry zero intersection and >=8px gap, responsive QA pass, no overflow or page errors, no data mutations, with natural live marker selection unavailable. This is owner-provided release evidence, not a new measurement in this Work browser. Together with the exact live artifact reconciliation it supports the prior P0 closure; the unsupported-WebGL2 failure remains a separate candidate.

- #319: draft unsupported-WebGL2 fallback. Required CI runs the new three regression cases in the desktop Chromium suite; BACKUP qualification remains pending authentication.
- #320: draft Live Canvas decision package, no publishing/schema authority added.
- #321: separate brace-expansion 1.1.18 -> 1.1.21 lockfile patch. Local npm audit: zero high/critical, one low and one moderate remain. Lint/typecheck/build and glob compatibility checks pass; all 288 build assets equal the current-main build. CodeQL is green; browser CI is still running at this update.
- Terminal Git writes lack a credential. Authorized publication used the connected GitHub app; published trees exactly match validated local trees.
- Production remains #308; no deployment or production data change was made. #318 remains the separate merged release candidate.
