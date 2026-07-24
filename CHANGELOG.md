# OOH Earth — Changelog & Pre-Launch Checklist

_Last updated: 2026-07-24_

## Recent fixes

- **Map page bottom nav** — Leaflet/MapLibre panes (z-index 200–700) escaped the map container and painted over the `z-50` mobile bottom tabs. Added `isolate` to the map wrapper so its internal stacking context can no longer cover the nav.
- **Mobile menu clipping** — `NavMenu` now portals to `document.body`, escaping the backdrop-blur containing block so the full-screen launcher fills the viewport on mobile.
- **Header hidden under nav on notched devices** — the fixed nav inflates by `env(safe-area-inset-top)` on iPhones with notches/dynamic islands, but page top padding was a fixed `pt-24/pt-28`, causing masthead H1s to slip underneath. Added a `.page-top` utility (`calc(6rem + env(safe-area-inset-top))`, `7rem` on md) and applied it to `Channel.jsx`.

## Pre-launch checklist — needs to verify

### Layout / mobile
- [ ] Migrate every top-level page `<main>` from `pt-24/pt-28` → `.page-top` (About, Support, Plans, Guides, Careers, Report, Campaign, Zora, TrueCost, TrashId, InHome, ArLens, BusStops, FieldId, SuperCard, UiKit, Dashboard, LocationDetail, BusStopDetail, auth pages). _Channel done._
- [ ] Confirm bottom content clears the mobile tab bar (`pb-24`+ on scrollable pages).
- [ ] Verify `env(safe-area-inset-bottom)` on body + tab bar for home-indicator devices.
- [ ] Map page: bottom tabs visible above map on both Leaflet + Globe views.
- [ ] NavMenu full-screen launcher fills viewport on small + large phones.

### Payments / treasury
- [ ] Stripe checkout: block inside preview iframe; gate to published app only.
- [ ] Stripe `metadata.base44_app_id` set on every checkout session.
- [ ] Resolve USDC.e vs native USDC on the crypto funding panel.
- [ ] Treasury balance read-only display accurate; no private-key paste surfaces.

### Data / security
- [ ] RLS: Location & DigitalBust — create/read open for public field reports; update/delete admin-only. Confirm no open writes.
- [ ] LeadClaim / FundingLead create open; admin-only mutations.
- [ ] `SendEmail` only reaches registered app users — external addresses (e.g. hello@oohearth.app) rejected. Use invitations for non-registered recipients.

### Native / HTTPS-gated features
- [ ] TrueCost + Trash ID camera scan — requires full HTTPS deployment; blocked in preview iframe. Test after publish.
- [ ] NFC Field Card — verify on real device post-publish.
- [ ] Geolocation prompt + user-loc marker on Map.

### Accessibility
- [ ] TypeEnhancer (text-size) works across pages.
- [ ] Read-aloud toggle off by default; triggers only on demand.
- [ ] Focus-visible rings on all interactive elements.
- [ ] `prefers-reduced-motion` disables parallax / CRT flicker / matrix scanlines.

### Performance / SEO
- [ ] Hero video: muted, loop, `playsInline`, no autoplay of content video (click-to-play facades).
- [ ] index.html: title, meta description, Open Graph, favicon set before publish.
- [ ] Map clustering handles 500+ markers smoothly.

### Polish
- [ ] Theme toggle persists (dark / light / matrix) across reloads.
- [ ] Cognitive toggles (haptics/sound/read-aloud) desktop-only — confirm intended mobile hide.
- [ ] Pull-to-refresh on Map + Dashboard.
- [ ] Walkthrough tours registered on Home + Map.

## Notes
- Keep this file updated with each shipped change so the launch changelog is ready.
- Dead-ends (do not retry): backend fetch of oohearth.app (bot-blocked), full-screen overlay menu, Enter-the-Void title sequence, predator-rune logo, private-key paste.