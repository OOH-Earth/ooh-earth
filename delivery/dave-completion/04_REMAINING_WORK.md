# Remaining Work

Ordered by what's actually buildable next without a blocking decision, then
what needs one.

## Buildable now, no decision needed (small)

1. **CI observability for lint/typecheck/build/format jobs.** Extend the
   existing `ci-test-summary.mjs` pattern (or a small sibling script) so a
   lint/typecheck/build/format failure gets the same triage-in-seconds
   treatment Playwright already has. Small, safe, same pattern as PR #85.
2. **Mobile layer-toggle UI.** `MapLayerToggle` (the bar with Activity Heat,
   Adbusting, etc.) is desktop-only (`hidden lg:block` in `Map.jsx`) — mobile
   has no UI to toggle any map layer, found incidentally while testing PR #96.
   Needs a mobile-appropriate control (e.g. a sheet/drawer), not a large
   redesign.

## Buildable now, needs a small decision first

3. **Badge → NFT-studio prefill link** (item 7 in the requirements matrix). A
   working prototype exists (built and verified in an earlier loop this
   session, then shelved as out of that pass's priority order — not pushed,
   recoverable from local history). Ship it once Dave confirms NFT-adjacent
   work is worth the small effort right now.
4. **Verified-only heat filter.** Small addition to `HeatLayer.jsx`'s point
   source; needs Dave to confirm it's wanted (see Decision B).

## Requires a real product/business decision before any code

5. **Agency/freelance operations** — genuinely not started beyond
   `ClientPortal.jsx`'s honest sample scaffold. See `13_AGENCY_WORKFLOW_STATUS.md`
   and Decision F.
6. **NFT on-chain minting** — requires external contract/wallet
   infrastructure decisions and credentials. See `11_NFT_WEB3_STATUS.md` and
   Decision D.
7. **Hermes integration** — zero specification exists anywhere in this
   repository. See `12_HERMES_STATUS.md` and Decision G.
8. **Commercial relicensing** — audit-only this pass, correctly untouched.
   See `15_LICENSING_STATUS.md` and Decision I.

## Requires external/human access (not a product decision, an access gap)

9. **PR #63 / release 1.3.0** — blocked on GitHub org Settings access, not
   engineering. See `14_RELEASE_STATUS.md`.
