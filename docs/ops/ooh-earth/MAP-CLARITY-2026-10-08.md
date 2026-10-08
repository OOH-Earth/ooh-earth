# Environmental map clarity — 2026-10-08

## Problem and scope

The owner's Ecology screenshot starts at world zoom: detailed habitat polygons require zoom 5,
observations require zoom 6, water is off by default, and there is no fauna group. The expanded
legend obscures much of the map. A sparse view must not be described as an absence of life.

Shared `LocationMap` (Leaflet) and `Globe3D` (MapLibre) now show the existing bundled major-river
reference at world scale. This covers Home's orbital atlas, Main Map, Location Detail and the
public portals using those components. Ecology enables the same reference network, water,
habitat and park layers by default, includes animals, adds river labels to satellite imagery, collapses its legend initially and puts
observation guidance outside the legend. Rivers keeps its existing detailed OSM network and
observed USGS/EA stations. Specialist report/store mini-globes are not environmental explorers
and are not changed in this slice. No claim of complete all-route coverage.

The shared explorers have opt-in Plants, Fungi and Animals metadata layers. Pins link to dated
provider records and show positional uncertainty and retrieval time. Sidebar legacy generated
flora/mushroom hooks remain empty; conflict mapping remains disabled pending a licensed source.
Old hand-simplified river polylines are removed from the main-map layer renderers; legacy demo
point samples remain explicitly labelled separately. No new observation is written to Base44.

## Sources and precision

- Refreshed from hash-verified, pinned GitHub source `naturalEarthRivers.json`: Natural Earth
  `ne_50m_rivers_lake_centerlines`, public domain, 194 features with coordinates previously
  supplied upstream, without the previous rounding/thinning. https://github.com/nvkelso/natural-earth-vector
  and https://github.com/nvkelso/natural-earth-vector/blob/master/LICENSE.md.
  This is generalised reference geometry, **not an exact channel survey or live measurement**.
  It displays below zoom 6; users can open Rivers for detailed mapped waterways and readings.
  Upstream commit: ca96624a56bd078437bca8184e78163e5039ad19. Offline importer verifies SHA-256 before writing the bundle; source manifest records provenance. No package, API key or subscription.
- Existing iNaturalist v2 API, extended to Animalia (`taxon_id=1`). Research grade, last 180 days,
  at most 100 records per group and settled viewport. https://www.inaturalist.org/pages/developers
  and https://www.inaturalist.org/api. Open-source application code does not make every
  observation or photo unrestricted. This slice displays source-linked metadata, per-record
  licence and no photos. It does not import, redistribute or relicense an observation database.
  Provider accuracy is shown as supplied; missing accuracy is unknown, never “exact”.
- Detailed OSM/CARTO, USGS and Environment Agency sources and their existing limitations are
  unchanged; see `18-ENVIRONMENTAL-SOURCE-REGISTER.md`. Open-Meteo/CARTO commercial terms and
  unresolved sample provenance remain existing checkpoints, not resolved by this work.

## Request and privacy boundaries

Shared in-flight dedupe with consumer-aware cancellation, ten-second timeout, five-minute cache
bounded to 32 entries, and cache keys matching the requested bounds and date. Movement aborts
old consumers and clears stale pins; requests resume after the viewport settles. Failed pending
entries are removed. Requests omit credentials and referrer. Obscured/private locations,
non-finite/out-of-range coordinates, duplicate IDs and unsafe/non-provider source URLs are
excluded. No user profiles/photos/private coordinates requested. Public viewport bounds and IP
reach iNaturalist on activation; no OOH account identifiers. At most three group requests per
settled view; no bulk world query or pagination. Dateline-crossing queries still need a separate
provider-safe split: invalid bounds fail rather than invent coverage. Request starts are capped at 45/minute per browser tab, and provider Retry-After is honoured
without a retry loop. Empty/provider-error/reference data are different states.

## Evidence and release state

- Fresh `npm ci`, lint, typecheck and BACKUP-targeted production build: passed locally.
- Adapter unit tests: 9/9 passed; added to CI's offline checks.
- Production-scope npm audit: 0 findings. Existing full-tree build-chain findings not fixed here.
- Read-only live Animalia lookup near Bangkok returned source observation 406739331,
  `Brachythemis contaminata`, with 35 m provider accuracy. This proves the endpoint/fields, not
  the rendered UI or all-world coverage.
- Browser inspection of live BACKUP: this cloud browser cannot provide WebGL and shows the
  existing fallback. The uploaded screenshot is separate owner evidence, not this browser's
  rendering result. No DevTools MCP is exposed here; DOM/console inspection used Cloud Browser.
- Local Playwright could not launch: Chromium download was not a valid archive. No local
  browser pass claimed. New tests cover world-view rendered segment counts, fauna/source and
  uncertainty, and flat-map marker interaction at 360×800 and 844×390. Existing Ecology/Rivers/
  Home-globe regressions remain in CI. CI and fresh BACKUP rendered qualification are pending.
- Base44 CLI identity check was blocked by automatic approval review: its ancillary PostHog
  telemetry request had an unknown payload that could include environment/project metadata.
  No retry via another tool, route or host. Deployment remains blocked pending owner review.
- No merge, BACKUP deployment, production deployment, backend/schema/permission changes or
  production candidate changes. The currently qualified candidate remains separate.

## Qualification steps

Review the PR and exact-head CI (including new browser assertions and existing popup geometry).
Only after green checks, build that exact approved head for BACKUP, prove the true entry SDK
app ID, deploy frontend only, compare entry/chunks/manifest bytes, and inspect actual reference
lines and sourced observation pins on desktop and mobile with a real provider request recorded
separately from mocked tests. Physical-phone coverage remains an owner test, not emulation.
