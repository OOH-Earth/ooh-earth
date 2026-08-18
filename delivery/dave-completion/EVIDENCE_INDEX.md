# Evidence Index

Every capability claim in this delivery package traces to a real route, a
real screenshot, a merged PR, and/or a passing automated test. Where a
screenshot isn't practical (camera-gated AR flows, CI-only artifacts), that
is stated explicitly rather than substituted with a fabricated image.

Screenshots referenced below live in `showcase/screenshots/`, captured this
pass via real Playwright browser sessions against a fresh production build
of `main` @ `43bfe9d`, with the backend mocked at the network layer (this
sandbox has no live Base44 backend — application logic runs unmodified
against fixture data).

| ID | Capability | Dave Goal | Route | Action | Expected Result | Screenshot | PR | Commit ref | Test | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Adbusting capture | Fast, obvious first action | `/`, `/report` | Land on home, click Report | Clear "START ADBUSTING" 4-step flow, no login required | `09_home_to_report.png` | — (existing) | `main` | `e2e/report-scan-dedup.spec.ts` | Verified existing |
| 02 | Brand/parent-corp map search | Find activity by brand or corporation | `/map` | Search "shell plc" | Results filter to matching locations | `02_map_brand_search.png` | #93 | `c447448` | `e2e/map-brand-search.spec.ts` (2/2) | Shipped |
| 03 | Corporate footprint | Map corporate relationships | `/location/:id` | Open a location, scroll to "Connected Locations" | Nearby + same-brand + same-parent-corp groups | `03_corporate_footprint.png` | #91 | `da16399` | `e2e/related-locations-parent-corp.spec.ts` (2/2) | Shipped |
| 04 | Activity Heat | See where activity concentrates | `/map` | Toggle "Activity Heat" | Real density heat layer renders over markers | `04_activity_heat.png` | #92 | `f3e896f` | `e2e/heat-layer.spec.ts` (2/2) | Shipped |
| 05 | Heat → report handoff | Turn the heat map into a way in, not just a picture | `/map` | Click a hotspot | Pin detail sheet opens for the nearest report | `05_heat_to_report.png` | #96 | `5877661` | `e2e/heat-layer-click-handoff.spec.ts` (2/2) | Shipped |
| 06 | AR brand identification | Real AR capture identifies the brand | `/ar` | Capture a billboard | Brand + agency shown in AI-identified result | *(not captured — requires real camera + HTTPS origin, cannot be headlessly screenshotted honestly)* | #80 (earlier convergence) | — | `e2e/ar-lens-brand-scan.spec.ts` | Verified existing (proven by passing test, not a screenshot) |
| 07 | AR parent-corporation context | AR carries the same corporate context as the report wizard | `/ar` | Same capture as #06 | Parent corporation shown alongside brand | *(same camera limitation as #06)* | #95 | `fec6c47` | `e2e/ar-lens-brand-scan.spec.ts` (precise assertion) | Shipped |
| 08 | Trophy → NFT Studio | Trophies displayable, connected to the collectible system | `/operative` → `/lab/nft?badge=<id>` | Hover an earned badge → "Mint as NFT" | Studio opens pre-filled with that badge's title/grade | `08_trophy_nft_studio.png` | #98 | `4ca1381` | `e2e/nft-badge-mint-prefill.spec.ts` (3/3) | Shipped |
| 09 | Engineering quality | A maintainable product, not just a demoable one | `.github/workflows/ci.yml` | A CI job fails | Structured job/file/line/error summary, not a raw log dump | *(CI-artifact evidence, not a browser screenshot — see below)* | #85, #99 | `b3e6664`, `0c22970` | N/A (verified via deliberately-broken local runs pre-merge, documented in `07_TEST_EVIDENCE.md`) | Shipped |

## Why some rows have no screenshot

- **AR (06, 07)**: real camera access requires a secure, top-level HTTPS
  origin — unavailable in a headless/iframe/sandbox context by design (this
  is a platform constraint, documented honestly in the product itself, not
  an engineering gap). The AI-identification chain is proven by a passing
  automated test that exercises the real code path with a mocked camera
  stream, not a screenshot.
- **Engineering quality (09)**: the evidence is the *content* of a CI job
  summary, which only exists inside a GitHub Actions run — pasting a
  screenshot of a terminal would be less useful than pointing directly at
  `scripts/ci-tool-summary.mjs` and `07_TEST_EVIDENCE.md`, which describe
  exactly what was verified (including a real, deliberately-broken local run
  per parser, reverted afterward).

No screenshot in this package was staged to look more finished than the
underlying feature actually is.
