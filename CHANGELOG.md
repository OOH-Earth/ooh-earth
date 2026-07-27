# OOH Earth — Changelog & Pre-Launch Checklist

_Last updated: 2026-07-27_

## Recent fixes

- **Map page bottom nav** — Leaflet/MapLibre panes (z-index 200–700) escaped the map container and painted over the `z-50` mobile bottom tabs. Added `isolate` to the map wrapper so its internal stacking context can no longer cover the nav.
- **Mobile menu clipping** — `NavMenu` now portals to `document.body`, escaping the backdrop-blur containing block so the full-screen launcher fills the viewport on mobile.
- **Header hidden under nav on notched devices** — the fixed nav inflates by `env(safe-area-inset-top)` on iPhones with notches/dynamic islands, but page top padding was a fixed `pt-24/pt-28`, causing masthead H1s to slip underneath. Added a `.page-top` utility (`calc(6rem + env(safe-area-inset-top))`, `7rem` on md) and applied it to `Channel.jsx`.

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