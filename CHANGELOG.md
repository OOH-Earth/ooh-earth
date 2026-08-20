# OOH Earth — Changelog & Pre-Launch Checklist

_Last updated: 2026-08-01_

## Recent fixes

- **Map page bottom nav** — Leaflet/MapLibre panes (z-index 200–700) escaped the map container and painted over the `z-50` mobile bottom tabs. Added `isolate` to the map wrapper so its internal stacking context can no longer cover the nav.
- **Mobile menu clipping** — `NavMenu` now portals to `document.body`, escaping the backdrop-blur containing block so the full-screen launcher fills the viewport on mobile.
- **Header hidden under nav on notched devices** — the fixed nav inflates by `env(safe-area-inset-top)` on iPhones with notches/dynamic islands, but page top padding was a fixed `pt-24/pt-28`, causing masthead H1s to slip underneath. Added a `.page-top` utility (`calc(6rem + env(safe-area-inset-top))`, `7rem` on md) and applied it to `Channel.jsx`.

## [1.3.0](https://github.com/OOH-Earth/ooh-earth/compare/v1.2.0...v1.3.0) (2026-08-20)


### Features

* **a11y:** adopt useFocusTrap in UnitFinder ([#65](https://github.com/OOH-Earth/ooh-earth/issues/65)) ([96942cd](https://github.com/OOH-Earth/ooh-earth/commit/96942cd7573a7eb0be6d293cc37e7a114e6e1027))
* **a11y:** WAI-ARIA focus-trap foundation for CommandCenter/NavMenu/QuickCapture ([#62](https://github.com/OOH-Earth/ooh-earth/issues/62)) ([73a496b](https://github.com/OOH-Earth/ooh-earth/commit/73a496b7701dec7cf43da28ecdf9131d62a2ab31))
* **advertiser:** give parent-corp sector data a real, structured source ([#75](https://github.com/OOH-Earth/ooh-earth/issues/75)) ([d5093dc](https://github.com/OOH-Earth/ooh-earth/commit/d5093dc628c20ff5c438b60b07260b10cb4982c4))
* **analytics:** Tier 1 traction instrumentation via base44.analytics.track ([#121](https://github.com/OOH-Earth/ooh-earth/issues/121)) ([00bb001](https://github.com/OOH-Earth/ooh-earth/commit/00bb001c467cbb87b591e2eac99132f63538ad98))
* **ar:** identify the brand in AR-filed reports via the same scanner /report uses ([#80](https://github.com/OOH-Earth/ooh-earth/issues/80)) ([89fc849](https://github.com/OOH-Earth/ooh-earth/commit/89fc849f322704bceae1f4667edd638f2a351b4e))
* **ar:** surface parent corporation in AR's done-state summary ([#95](https://github.com/OOH-Earth/ooh-earth/issues/95)) ([fec6c47](https://github.com/OOH-Earth/ooh-earth/commit/fec6c473d0f102f0a0de5ca7b6221dc6b4170c61))
* **data:** pilot useQuery on StoreAdmin, hard-stop on LabAdmin ([#69](https://github.com/OOH-Earth/ooh-earth/issues/69)) ([53bd499](https://github.com/OOH-Earth/ooh-earth/commit/53bd49925cfca5ead6e44b5bbb5f59c2171e1768))
* **fieldcheck:** honest "Last confirmed" freshness signal on /location/:id ([#119](https://github.com/OOH-Earth/ooh-earth/issues/119)) ([fda8404](https://github.com/OOH-Earth/ooh-earth/commit/fda84047d017b5ddcf2b826ab31222d7ca0e950b))
* **fieldcheck:** wire re-checks into moderation + derive a real "what changed" summary ([#117](https://github.com/OOH-Earth/ooh-earth/issues/117)) ([1fcc253](https://github.com/OOH-Earth/ooh-earth/commit/1fcc2531b2aa7ee31c4d0b12938fa2029116290a))
* **gamification:** add generic Brand Explorer / Brand Collector milestone badges ([#110](https://github.com/OOH-Earth/ooh-earth/issues/110)) ([98523a7](https://github.com/OOH-Earth/ooh-earth/commit/98523a762d99c1bd634e44be45b008602b24b7df))
* **gamification:** show live X/Y progress toward locked collector milestones ([#111](https://github.com/OOH-Earth/ooh-earth/issues/111)) ([707b4a2](https://github.com/OOH-Earth/ooh-earth/commit/707b4a2120b582824013d745dfe70bc3352c4838))
* **location:** cross-reference ooh_operator against the real MediaCorp registry ([#78](https://github.com/OOH-Earth/ooh-earth/issues/78)) ([dd5e58d](https://github.com/OOH-Earth/ooh-earth/commit/dd5e58d07d192f4f4bd47738a864560a94dfeff1))
* **map:** add My Discoveries layer to /map ([#114](https://github.com/OOH-Earth/ooh-earth/issues/114)) ([e1eef99](https://github.com/OOH-Earth/ooh-earth/commit/e1eef9996abd98bca9c3219ec0a5956e7c36bef0))
* **map:** add report-density Activity Heat layer ([#92](https://github.com/OOH-Earth/ooh-earth/issues/92)) ([f3e896f](https://github.com/OOH-Earth/ooh-earth/commit/f3e896fba9b3d5c5618c8c0e3a870462f9dc2f9c))
* **map:** clicking a heat hotspot opens the nearest report ([#96](https://github.com/OOH-Earth/ooh-earth/issues/96)) ([5877661](https://github.com/OOH-Earth/ooh-earth/commit/587766177f0611872b3e0fa5301c2fadf941b606))
* **map:** highlight a user's own newly-created contribution ([#84](https://github.com/OOH-Earth/ooh-earth/issues/84)) ([33b1522](https://github.com/OOH-Earth/ooh-earth/commit/33b15226354b94d63afe7ac1df1b9a8fc9866eab))
* **map:** make brand and parent corporation searchable/filterable ([#93](https://github.com/OOH-Earth/ooh-earth/issues/93)) ([c447448](https://github.com/OOH-Earth/ooh-earth/commit/c447448956fad433500d7346cc6faf278e8282b8))
* **map:** propagate FieldCheck freshness signal into LocationCard ([#120](https://github.com/OOH-Earth/ooh-earth/issues/120)) ([e8e8b6c](https://github.com/OOH-Earth/ooh-earth/commit/e8e8b6c876cdcf41dcd928cdd2cb40436c890c7b))
* **map:** surface corporate footprint via parent_corp cross-referencing ([#91](https://github.com/OOH-Earth/ooh-earth/issues/91)) ([da16399](https://github.com/OOH-Earth/ooh-earth/commit/da16399a1266c00ad2ab51d418f0cb06c53e7fe6))
* **nav:** lead the primary menu with Tools, add progressive disclosure ([#71](https://github.com/OOH-Earth/ooh-earth/issues/71)) ([30ba3ad](https://github.com/OOH-Earth/ooh-earth/commit/30ba3ade4577d8b976eae4221dde91486af3138f))
* **nft:** connect earned merit badges to the NFT studio ([#98](https://github.com/OOH-Earth/ooh-earth/issues/98)) ([4ca1381](https://github.com/OOH-Earth/ooh-earth/commit/4ca138105fd0dabd8175cf34e36b2769ca0edc1b))
* **operative:** add Brands Discovered collection view ([#109](https://github.com/OOH-Earth/ooh-earth/issues/109)) ([a3ebde5](https://github.com/OOH-Earth/ooh-earth/commit/a3ebde55e05ecba0202651a0947d2ee76f641ffa))
* **operative:** add Recent Discoveries intelligence feed to /operative ([#113](https://github.com/OOH-Earth/ooh-earth/issues/113)) ([02f84a1](https://github.com/OOH-Earth/ooh-earth/commit/02f84a1ac13fa60c8916e2ca7380337c4747452a))
* **operative:** add Recently Changed, a platform-wide field intelligence feed ([#124](https://github.com/OOH-Earth/ooh-earth/issues/124)) ([6d359ce](https://github.com/OOH-Earth/ooh-earth/commit/6d359cebff4dce93a05aef3d4263cf8c5f297869))
* **operative:** recognize badges earned since the user's last visit ([#116](https://github.com/OOH-Earth/ooh-earth/issues/116)) ([9ff158b](https://github.com/OOH-Earth/ooh-earth/commit/9ff158b4886bdf657ca5d642cfaddeb4d7be2efe))
* **operative:** surface real FieldCheck re-check activity on /operative ([#123](https://github.com/OOH-Earth/ooh-earth/issues/123)) ([e5aae4f](https://github.com/OOH-Earth/ooh-earth/commit/e5aae4fbb4da100410194c98a10f49ea65c2eca2))
* **protocol-one:** add Open Graph/Twitter Card metadata for shareable link previews ([#107](https://github.com/OOH-Earth/ooh-earth/issues/107)) ([7c3cd2f](https://github.com/OOH-Earth/ooh-earth/commit/7c3cd2f4b32247aa4b5d935891d178daaefd8b38))
* **protocol-one:** thin static story page over the existing product loop ([#106](https://github.com/OOH-Earth/ooh-earth/issues/106)) ([7c17992](https://github.com/OOH-Earth/ooh-earth/commit/7c1799208529fc0f5d1290bd1fc66361434aa1ab))
* **report:** add Discovery Intelligence panel to the report success screen ([#112](https://github.com/OOH-Earth/ooh-earth/issues/112)) ([ab4db08](https://github.com/OOH-Earth/ooh-earth/commit/ab4db080409d4a5d837b1a313db9241b495ac97b))
* **seo:** bake per-route metadata into static HTML for non-JS crawlers ([#102](https://github.com/OOH-Earth/ooh-earth/issues/102)) ([cf8df31](https://github.com/OOH-Earth/ooh-earth/commit/cf8df313225ba7b463bde4c39ac62025806c84c0))


### Bug Fixes

* **a11y:** make label-wrapped file-picker controls keyboard-operable ([#72](https://github.com/OOH-Earth/ooh-earth/issues/72)) ([d366499](https://github.com/OOH-Earth/ooh-earth/commit/d366499f3036016b95197e635b738e40fcb2305a))
* **ar:** frame the AR CO2 overlay as an average, not a per-billboard measurement ([#81](https://github.com/OOH-Earth/ooh-earth/issues/81)) ([ed5fca9](https://github.com/OOH-Earth/ooh-earth/commit/ed5fca9801d67e3747afb7bb2deed28c20b4ba50))
* **ar:** give a filed AR report a way back into the product ([#83](https://github.com/OOH-Earth/ooh-earth/issues/83)) ([5b85b32](https://github.com/OOH-Earth/ooh-earth/commit/5b85b32566ff990097d31f46d05cad9ea0179d94))
* **auth:** prevent invalid token login redirect loop ([#104](https://github.com/OOH-Earth/ooh-earth/issues/104)) ([3241ace](https://github.com/OOH-Earth/ooh-earth/commit/3241aced8a0d2cd12190dcae97fb1f39ac15fe52))
* **ci:** give gh workflow run explicit repo context in release-please.yml ([#70](https://github.com/OOH-Earth/ooh-earth/issues/70)) ([7bbc797](https://github.com/OOH-Earth/ooh-earth/commit/7bbc79789a34017d1b01b62fa59afe43feae15d3))
* **mobile:** clear the fixed bottom nav from SiteFooter's last content ([#67](https://github.com/OOH-Earth/ooh-earth/issues/67)) ([0b36a9e](https://github.com/OOH-Earth/ooh-earth/commit/0b36a9e86af3e2e3028a71ab61a2afd85f342286))
* **nft:** surface AI-generate failures, stop overclaiming "Mint on Zora" ([#77](https://github.com/OOH-Earth/ooh-earth/issues/77)) ([723cc29](https://github.com/OOH-Earth/ooh-earth/commit/723cc29d424b207cd6207fe13653e0c773987326))
* **operative:** differentiate Recent Discoveries cards and fix milestone track relevance ([#115](https://github.com/OOH-Earth/ooh-earth/issues/115)) ([6d63e86](https://github.com/OOH-Earth/ooh-earth/commit/6d63e8664d7657680c77eb6081d5ba0c872e5e4c))
* **portals:** disclose sample-data fallback on the adbusting/graffiti discovery portals ([#79](https://github.com/OOH-Earth/ooh-earth/issues/79)) ([b76b504](https://github.com/OOH-Earth/ooh-earth/commit/b76b504d865ebbec37cb30d8a739b4f51d7716b7))
* **report:** stop Step 2 from silently re-running Step 1's AI scan ([#74](https://github.com/OOH-Earth/ooh-earth/issues/74)) ([a4de958](https://github.com/OOH-Earth/ooh-earth/commit/a4de958e0dc788c15e22ff9d733f25023136987e))
* restore canonical dashboard and social share links ([#122](https://github.com/OOH-Earth/ooh-earth/issues/122)) ([1887386](https://github.com/OOH-Earth/ooh-earth/commit/1887386daaf9811b6a5591c71eb5849a72b39562))
* **status:** consolidate duplicated status-color logic, fix rejected/verified badge collision ([#76](https://github.com/OOH-Earth/ooh-earth/issues/76)) ([3b5d73f](https://github.com/OOH-Earth/ooh-earth/commit/3b5d73f24cde90e230cc4ce36127c16535353db8))
* **toast:** wire the missing close-button dismiss handler ([#118](https://github.com/OOH-Earth/ooh-earth/issues/118)) ([9ea817d](https://github.com/OOH-Earth/ooh-earth/commit/9ea817d6abb2406652a695256009ac2aa202fdf4))
* **ui:** stop CommandCenter's closed state from trapping GraffitiCamera ([#73](https://github.com/OOH-Earth/ooh-earth/issues/73)) ([0338c8c](https://github.com/OOH-Earth/ooh-earth/commit/0338c8c3bfb1aa272f8acb0339e32e11d8baf395))

## [1.2.0](https://github.com/OOH-Earth/ooh-earth/compare/v1.1.0...v1.2.0) (2026-08-13)


### Features

* **location:** use original report photo as before/after baseline ([#56](https://github.com/OOH-Earth/ooh-earth/issues/56)) ([6e8eea1](https://github.com/OOH-Earth/ooh-earth/commit/6e8eea166c8f41bec394b46acbdc4562447834dc))
* **map:** spotlight locations with verified before/after evidence ([#59](https://github.com/OOH-Earth/ooh-earth/issues/59)) ([c45f819](https://github.com/OOH-Earth/ooh-earth/commit/c45f819008a3a8e885ed5af03fb52073cca55390))


### Performance Improvements

* **fonts:** load Google Fonts asynchronously to unblock first paint ([#58](https://github.com/OOH-Earth/ooh-earth/issues/58)) ([2590416](https://github.com/OOH-Earth/ooh-earth/commit/259041694655c11776637072bbfb3ba928208702))

## [1.1.0](https://github.com/OOH-Earth/ooh-earth/compare/v1.0.0...v1.1.0) (2026-08-12)


### Features

* **field-check:** AI condition scan in the revisit flow ([#53](https://github.com/OOH-Earth/ooh-earth/issues/53)) ([0c1f0be](https://github.com/OOH-Earth/ooh-earth/commit/0c1f0bed9d255084adb523255e1c18d1fcf9d6e4))
* **leadClaim:** move LeadClaim.create behind a validated server function ([#40](https://github.com/OOH-Earth/ooh-earth/issues/40)) ([f0c282d](https://github.com/OOH-Earth/ooh-earth/commit/f0c282d18e36d39521bb1db2efeca9429ace1143))


### Bug Fixes

* **security:** client-side validation on all real photo-upload sites ([#50](https://github.com/OOH-Earth/ooh-earth/issues/50)) ([0cb676a](https://github.com/OOH-Earth/ooh-earth/commit/0cb676acab82f1899d5df80fe6c9651f1682a2bf))
* **security:** close incomplete HTML sanitization + double-escape bugs ([#48](https://github.com/OOH-Earth/ooh-earth/issues/48)) ([4e97ed6](https://github.com/OOH-Earth/ooh-earth/commit/4e97ed6a6efcbf97fc4a84884e39231dc035a23f))
* **security:** remove unused react-quill/quill ([#41](https://github.com/OOH-Earth/ooh-earth/issues/41)) ([7a1e54d](https://github.com/OOH-Earth/ooh-earth/commit/7a1e54d08762eff19fda4fec7bca4eb54a694950))
* **telemetry:** correct cancelled-flag typo in TelemetryBar air-quality effect ([#54](https://github.com/OOH-Earth/ooh-earth/issues/54)) ([7774b4b](https://github.com/OOH-Earth/ooh-earth/commit/7774b4b6ff1ecbedf81e09e607f30fd7cd367226))


### Performance Improvements

* **home:** lazy-load below-the-fold sections, cut entry chunk 27% ([#46](https://github.com/OOH-Earth/ooh-earth/issues/46)) ([135777e](https://github.com/OOH-Earth/ooh-earth/commit/135777ec4baeded45062f0f9aba00d31751b4f22))

## 1.0.0 (2026-08-12)


### Features

* establish production engineering foundation ([#1](https://github.com/OOH-Earth/ooh-earth/issues/1)) ([b3c4c38](https://github.com/OOH-Earth/ooh-earth/commit/b3c4c388b919a7bcdf0186a118f17e591c7e7fa8))


### Bug Fixes

* **types:** bump framer-motion to 12.43.0, fix Variants type break ([#27](https://github.com/OOH-Earth/ooh-earth/issues/27)) ([c16ccfe](https://github.com/OOH-Earth/ooh-earth/commit/c16ccfee89c269758772853286708ee442687ce1))

## 2026-08-01 — Lab: OE-1K/66 Streetrunner (Akira-class concept bike)

- New Lab project at `/lab/streetrunner` (`LabStreetRunner.jsx`): an **original** Akira-class field-bike concept in our Orbital Perspective palette (genre references only: Katalis × Machine56 EV-1K/56, Akira — not reproduced). One SVG geometry, three treatments via an interactive build-up stepper — **01 vector → 02 blueprint → 03 3D concept render** — plus a rebranded concept spec sheet. Route + `LabHub` tile (`Bike` icon) wired.
- Hub tile now **self-surfaces on main** via a built-in default in `LabHub` (no DB record needed); a real `LabPrototype` row via `/lab/admin` still takes precedence.
- Added a **Roadmap** section (hero render, livery variants, exploded view, poster) as scaffolding for the next design passes.
- **Lab project registry + auto-provisioning** — new `labProjects.js` is the single source of truth for code-defined Lab projects. The **Control Console (`/lab/admin`) auto-provisions** a `LabPrototype` record for any registry project missing one on load, so new Lab pages appear in the control panel automatically and stay togglable (access / status / visible). The hub reads the same registry. Adding a project is now: page + route + one registry line.
- **Fix (visible toggle):** the hub's registry fallback checked the *visible-filtered* list, so a project set to `visible: off` in the console got re-added from the registry and stayed on the hub. It now falls back only when **no record exists at all** — so access / status / visible from the console sync correctly for every registry project, current and future.

## 2026-08-01 — Hero dispatch panel + licence placement

- **Hero dispatch reworked** — the `// Field dispatch` + open-source/copyleft/licence lines were overlapping the corner reticle (desktop) and the console card + “Descend” cue (mobile). Rebuilt as a bordered HUD panel (backdrop-blur), lifted clear of the bracket, **desktop-only**. `LicenseMark` simplified to a clean block (ethos line + micro licence line — no superscript collision).
- **Licence in the footer** — added `AGPL-3.0 · CC BY-SA 4.0` to the footer © line, so mobile keeps the licence and it sits in the natural place.
- **Mobile dispatch restored** — the desktop-only panel left mobile with nothing; added an in-flow mobile version (below the console, above “Descend”) that shows on mobile without overlapping.
- **Globe header (orbital atlas) reworked** — stacked the title + `global surveillance grid` / spots / `cluster intel` sublabels vertically so they no longer collide, and gave the “Open field map” button a backdrop. (BACKUP also: dropped the redundant standalone surveillance-grid label from `Globe3D`.)

## 2026-08-01 — Removed “No VC” credential copy

- Stripped the “No VC” / “zero VC” / “Zero VC by design” lines from `LicenseMark`, `AuthShell` (trust list), `Plans`, `Store`, and the gated-page footers (`CapitalLead`, `Console`, `InvestorHub`). Separators cleaned — no dangling middots.
- Held (flagged for a call): the `anti-VC` ethos statements in `README.md` and the journey personas (`panelsB.js` ×2) — structural-ethos framing, not marketing badges.

## 2026-08-01 — Brandmark symbol placed across the site

- **Footer** (`SiteFooter`, global — 25 pages) now shows the **animated brandmark symbol only** (was a wordmark lockup), h-16→h-20. Symbol spins; tagline line kept below.
- **Auth screens** (`AuthShell` — login / register / reset / plans) gained the symbol beside the “OOH EARTH” wordmark in the header.
- **404** (`PageNotFound`) rebranded from the stock light-theme scaffold to Orbital Perspective (void / ozone / flare) — animated symbol as centrepiece, “Signal lost / Off the map”, and “Return to base” + “Open field map” actions. Admin note + auth check preserved.
- **Hero** — the animated symbol now crowns the `oohearth.app` wordmark (mark-over-wordmark lockup, h-14→h-20 with glow).
- **Field Pulse** — removed the FUNDED / amount-raised item from the ticker.
- **Beta tag** — new `BetaTag` (flare chip + blinking dot + tooltip) sits beside the symbol in the header, hero, footer, and auth screens to signal public beta / early access.
- **Licence dispatch** — new `LicenseMark` in the hero dispatch area: “Open source · Copyleft · Community-funded · No VC” with the licence pair (AGPL-3.0 · CC BY-SA 4.0) set in superscript, like a rights mark.
- Symbol-only throughout (`BrandMark`), consistent with the masthead.

## 2026-08-01 — Field Pulse reweighted to the movement (since 2012)

- **Orbital-atlas Field Pulse** (`FieldStatsHud`) now opens with a clearly-tagged **movement-wide estimate** of global subvertising since 2012 — ~5K+ subverters, ~50K+ interventions, 40+ collectives, 25+ countries, 14 yrs. Every figure carries an `EST` tag and sits under a `MOVEMENT · EST · SINCE 2012` divider, visually separated from our own numbers.
- **Platform honesty preserved** — our live counts still come from the audited `fieldStats` (confirmed-only, no inflation), now under an `OOH EARTH · LIVE PLATFORM` divider followed by an `EARLY ACCESS · FOUNDING BACKERS SOUGHT` status chip, so day-one platform scale is never mistaken for movement scale.
- **`movementEstimate.js`** — single documented source of truth for the estimate (method + provenance in-file: Brandalism 2012, Subvertisers Intl, Adfree Cities, Les Déboulonneurs, Adbusters, independents). Tune the numbers in one place.
- **Operative Network** section gained an honest movement-context caption beneath the live tally (“day-one platform … the wider resistance is not new”).
- **Estimate tuned & sourced** — figures dialled to conservative, verifiable numbers after checking anchors (Brandalism 2012 first drop 30+ boards/5 cities; COP21 2015 = 82 artists, 19 countries, ~600 subverts; Adfree Cities founded 2017). Now ~3K+ subverters, ~25K+ interventions, 30+ collectives, 20+ countries. Added `MOVEMENT_ANCHORS` (sourced milestones).
- **Investor + Campaign context** — `MovementContext` (Tailwind) added to `/campaign`; a matching `inv-`styled “Not starting from zero” section added to `/investor`. Both restate the day-one / founding-backers status beside the sourced movement estimate, driven by the one shared module.

## 2026-08-01 — Y2K logo system wired in (live)

- **New brandmark** — `BrandMark.jsx` reworked from the abstract orbit into the Y2K wireframe globe + tilted orbital ring + satellite node (Orbital Perspective). Same `{ className }` / 32-viewBox API, so all four consumers (Nav, Field-ID cards, NFC card, UI kit) render unchanged; keeps the rotating-orbit animation via an `animate` prop (default on).
- **Header now carries the logo** — the top-left home link was a generic `Gauge` icon; swapped for `<BrandMark/>`. First time the actual mark appears in the masthead.
- **Favicon + apple-touch** upgraded (inline data-URI, no network cost) from the crosshair-globe to the wireframe globe + orange orbit node; apple-touch gets a rounded tile.
- **PWA manifest** — added `public/manifest.json` (the `/manifest.json` link was 404ing); icon → `/brand/oohearth-mark.svg` (`any maskable`). `public/` confirmed copied into `dist/`.
- **Brand component library** (additive) — `src/components/ooh/brand/`: `OohEmblem`, `OohWordmark`, `AdFreeStreetsBadge` — theme-aware (ozone/flare tokens) for hero, share cards, and the `/kit` brand guide.
- **Orbitron** display face added to the Google-Fonts link (wordmark type).
- Proven on BACKUP first (vite build exit 0), then promoted to main (vite build exit 0). Full downloadable kit (SVG/PNG/favicon/.ico) is delivered outside the repo.

## 2026-07-28 — OOH Radio Ops (scaffolding, shipped dark)

- **Radio Ops architecture decided** — self-hosted AzuraCast (open-source) on our own VPS as the broadcast engine; the app stays a thin client that points at one Icecast stream URL. Not a rented service; not a from-scratch streaming server. Full runbook: `RADIO-SELF-HOST-RUNBOOK.md`; strategy: `OOH-Radio-Ops-Plan.md`.
- **`src/lib/radioOps.js`** — single control file. Empty `AZURACAST_BASE` + `OOH_STREAM_URL` keep `RADIO_OPS_ENABLED=false`, so the whole feature is inert until configured (nothing appears, no polling). Includes `fetchNowPlaying()` normaliser for the AzuraCast now-playing API.
- **`radioContext.jsx`** — merges the OOH broadcast channel into the *player list only* (RADIO_STATIONS untouched, so map/globe are unaffected); polls now-playing every 15s while OOH Radio is on air.
- **`RadioMiniPlayer.jsx`** — shows current track under the station name + ● LIVE badge during live DJ sets.
- **`RadioOps.jsx` + `/radio-ops` route (protected)** — read-only ops dashboard (on-air, listeners, up-next, recent history, progress, "Manage in AzuraCast"), Orbital Perspective styling. Shows a clean "not connected" state until configured.
- Build verified green (vite build exit 0). Ships dark — no live UI change until the two URLs are pasted.

## 2026-07-27 — Pre-launch sweep

- **Page-top migration** — all top-level pages migrated from `pt-24/pt-28` → `.page-top` utility (Support, Plans, Careers, Report, Campaign, TrueCost, TrashId, BusStops, LocationDetail, BusStopDetail, Dashboard, Zora). Safe-area-inset-top now clears notched/dynamic-island devices everywhere.
- **Sub-nav safe-area fix** — Guides, FieldId, UiKit fixed sub-navs + content padding now use `calc(Npx + env(safe-area-inset-top))` so they don't slip under the nav on notched devices. UiKit sticky sidebar height also adjusted.
- **SuperCard stats** — stale "50 Sites logged" corrected to "755+" (post-London import).
- **SEO / index.html** — added canonical URL, `og:url`, apple-touch-icon, apple-mobile-web-app-capable + status-bar-style meta tags.
- **Radio visualizer (mobile)** — refactored to two-element architecture (playback + muted analysis) so real FFT data renders on iOS without silencing non-CORS streams; AudioContext created lazily inside first user gesture per mobile autoplay policy.
- **Stripe checkout** — verified: iframe blocking on `StripeDonate`, `metadata.base44_app_id` on both `createDonationCheckout` and `createProductCheckout`, allowed-origin whitelist, server-authoritative price lookup on product checkout.
- **Hero video** — confirmed `autoPlay muted loop playsInline` (no click-to-play facade needed for ambient bg video).
- **Mobile bottom tabs** — confirmed `env(safe-area-inset-bottom)` on nav + body padding.
- **Accessibility** — focus-visible rings, `prefers-reduced-motion` disables parallax/CRT/matrix, TypeEnhancer + ReadAloudToggle all confirmed.

## Pre-launch checklist — needs to verify

### Layout / mobile
- [x] Migrate every top-level page `<main>` from `pt-24/pt-28` → `.page-top` — done Jul 27 (all pages + sub-nav safe-area fixes).
- [x] Confirm bottom content clears the mobile tab bar (`pb-24`+ on scrollable pages).
- [x] Verify `env(safe-area-inset-bottom)` on body + tab bar for home-indicator devices.
- [x] Map page: bottom tabs visible above map on both Leaflet + Globe views (isolate fix).
- [x] NavMenu full-screen launcher fills viewport on small + large phones (portal fix).

### Payments / treasury
- [x] Stripe checkout: block inside preview iframe; gate to published app only.
- [x] Stripe `metadata.base44_app_id` set on every checkout session.
- [ ] Resolve USDC.e vs native USDC on the crypto funding panel.
- [x] Treasury balance read-only display accurate; no private-key paste surfaces.

### Data / security
- [x] RLS: Location & DigitalBust — create/read open for public field reports; update/delete admin-only. Confirmed no open writes.
- [x] LeadClaim / FundingLead create open; admin-only mutations.
- [x] `SendEmail` only reaches registered app users — external addresses rejected. Use invitations for non-registered recipients.

### Native / HTTPS-gated features
- [ ] TrueCost + Trash ID camera scan — requires full HTTPS deployment; blocked in preview iframe. Test after publish. _(cannot verify in preview)_
- [ ] NFC Field Card — verify on real device post-publish. _(cannot verify in preview)_
- [x] Geolocation prompt + user-loc marker on Map (ArLens + Map both use `navigator.geolocation`).

### Accessibility
- [x] TypeEnhancer (text-size) works across pages.
- [x] Read-aloud toggle off by default; triggers only on demand.
- [x] Focus-visible rings on all interactive elements.
- [x] `prefers-reduced-motion` disables parallax / CRT flicker / matrix scanlines.

### Performance / SEO
- [x] Hero video: muted, loop, `playsInline`, no autoplay of content video (click-to-play facades).
- [x] index.html: title, meta description, Open Graph, favicon, canonical URL, apple-touch-icon set before publish.
- [x] Map clustering handles 500+ markers smoothly.

### Polish
- [x] Theme toggle persists (dark / light / matrix) across reloads.
- [ ] Cognitive toggles (haptics/sound/read-aloud) desktop-only — confirm intended mobile hide.
- [x] Pull-to-refresh on Dashboard (Map is canvas-based, not scrollable).
- [x] Walkthrough tours registered on Home + Map.

## Notes
- Keep this file updated with each shipped change so the launch changelog is ready.
- Dead-ends (do not retry): backend fetch of oohearth.app (bot-blocked), full-screen overlay menu, Enter-the-Void title sequence, predator-rune logo, private-key paste.
