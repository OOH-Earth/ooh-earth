# OOH Earth — Changelog & Pre-Launch Checklist

_Last updated: 2026-08-01_

## Recent fixes

- **Map page bottom nav** — Leaflet/MapLibre panes (z-index 200–700) escaped the map container and painted over the `z-50` mobile bottom tabs. Added `isolate` to the map wrapper so its internal stacking context can no longer cover the nav.
- **Mobile menu clipping** — `NavMenu` now portals to `document.body`, escaping the backdrop-blur containing block so the full-screen launcher fills the viewport on mobile.
- **Header hidden under nav on notched devices** — the fixed nav inflates by `env(safe-area-inset-top)` on iPhones with notches/dynamic islands, but page top padding was a fixed `pt-24/pt-28`, causing masthead H1s to slip underneath. Added a `.page-top` utility (`calc(6rem + env(safe-area-inset-top))`, `7rem` on md) and applied it to `Channel.jsx`.

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
