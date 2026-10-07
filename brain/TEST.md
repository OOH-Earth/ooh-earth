# TEST — reusable matrix

## Viewports
- Desktop: 1440×900 (or comparable), 1920×1080 where practical
- Mobile: 360×800, 390×844, 412×915
- Landscape: 915×412 (known non-blocking issue — globe container ~150px tall)

## Surfaces
Home · Map (Flat) · Map (Globe) · Location Detail

## Map layout states to cross with the above
Split / Map / List × Flat / Globe, and the transitions between them
(flat→globe, globe→flat) — lifecycle/reinit regressions live here.

## Map assertions (in order of what actually catches real bugs)
1. Real location count matches the known dataset, not a fallback/seed value.
2. **Markers are actually visibly painted** — canvas presence, a 200 on the
   Location fetch, and a nonzero HUD count are all **insufficient** on their
   own (proven: the maplibre-gl-worker-404 bug passed all three). Assert
   `source.loaded() === true` and `queryRenderedFeatures().length > 0` via a
   React-fiber walk to the live `maplibregl.Map` instance when a real browser
   is available; screenshot as corroborating evidence, not primary proof.
3. Clusters render at correct positions/counts.
4. Hover state and selected state are visually distinct from each other and
   from the default state (not just "does something highlight").
5. Result-row ↔ marker correspondence: hovering/selecting a row visibly
   affects the corresponding marker, and vice versa where applicable.
6. List/results panel doesn't disappear across Split/Map/List × Flat/Globe
   transitions.
7. Loading state resolves (no permanent "reading evidence"/spinner).
8. No duplicate request storm (`Location?...limit=500` bounded, not 8-16+
   per load — P0 dedupe invariant).
9. No new console error types beyond documented noise (anonymous `User/me`
   401, session-recording 429 quota — both platform-level, not app bugs).
10. No unexpected writes (check network tab for anything beyond the
    expected reads/analytics-tracking calls).

## Known noise (not a finding, don't re-report)
- `entities/User/me` → 401 for anonymous sessions — expected.
- `POST .../session-recordings/ingest` → 429 — Base44 platform telemetry
  quota, zero code footprint in this repo, not fixable here.
- A "software WebGL fallback" console warning in headless/SwiftShader test
  environments only — not expected on real hardware-accelerated browsers.

## Security tests
Do not duplicate detail here — reference
`docs/ops/ooh-earth/04-SECURITY-QUEUE.md` and `05-TEST-MATRIX.md` for the
full historical security test record (Phase 2, LeadClaim, Public Space,
realtime gating, etc.).

## Browser QA method (when rendering itself is the question)
Prefer a real Chromium instance (see `ENVIRONMENTS.md`) over curl-only
checks. Use direct JS instrumentation (`evaluate_script` against the live
component/library instance) over screenshot-only or network-only evidence
when the actual claim is "does X render/behave correctly," not just "does
the request succeed."
