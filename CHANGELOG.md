# OOH Earth — Changelog & Pre-Launch Checklist

_Last updated: 2026-08-01_

## Recent fixes

- **Map page bottom nav** — Leaflet/MapLibre panes (z-index 200–700) escaped the map container and painted over the `z-50` mobile bottom tabs. Added `isolate` to the map wrapper so its internal stacking context can no longer cover the nav.
- **Mobile menu clipping** — `NavMenu` now portals to `document.body`, escaping the backdrop-blur containing block so the full-screen launcher fills the viewport on mobile.
- **Header hidden under nav on notched devices** — the fixed nav inflates by `env(safe-area-inset-top)` on iPhones with notches/dynamic islands, but page top padding was a fixed `pt-24/pt-28`, causing masthead H1s to slip underneath. Added a `.page-top` utility (`calc(6rem + env(safe-area-inset-top))`, `7rem` on md) and applied it to `Channel.jsx`.

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