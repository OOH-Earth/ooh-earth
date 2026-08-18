# Dave Completion Checklist

Status values only: DONE / VERIFIED EXISTING / PARTIAL / BLOCKED / NOT STARTED.
No item is marked DONE without a merged PR + passing test + independent
post-merge verification. Full detail for every row is in
`02_DAVE_REQUIREMENTS_MATRIX.md` and the numbered files it references.

| # | Requirement | Status |
|---|---|---|
| 1 | Core adbusting experience (discover→understand→start→capture→identify→classify→submit→see contribution→see on map→impact→related locations→related brands→corporate footprint) | **VERIFIED EXISTING + DONE** (search/AR-summary gaps closed this pass) |
| 2 | Brand Intelligence layer (brand/campaign/parent corp/agency/sector/related locations/footprint/evidence/reports/map presence) | **DONE** (on existing architecture, no migration) |
| 3 | Corporate Footprint Map (search brand/parent corp, related locations, sibling brands, footprint, map↔location↔footprint navigation) | **DONE** |
| 4 | Activity/Heat Intelligence (density, hotspot interaction, filtering, navigation into evidence) | **DONE** for what was asked; verified-only filter **PARTIAL** (small, deferred pending Decision B) |
| 5 | AR (camera/GPS/capture/AI identification/brand/parent corp/agency/operator/location/report/map handoff/confirmation, honest UI) | **VERIFIED EXISTING + DONE** (parent-corp summary gap closed this pass); real object detection **NOT STARTED** (correctly, per Decision C) |
| 6 | NFT/Web3 (wallet/signing/market data/metadata/mint prep/on-chain mint/ownership/display/trophies/physical readiness) | **PARTIAL** — see `11_NFT_WEB3_STATUS.md` for the exact per-capability breakdown; on-chain minting **BLOCKED** (Decision D) |
| 7 | User trophies/contribution identity, connected to the journey | **VERIFIED EXISTING** (gamification system, real) **+ DONE** — connection to NFT shipped and merged (PR #98: earned badge deep-links into the NFT studio with title/grade/colour prefilled from its real tier) |
| 8 | Agency/freelance workflow (signed docs, onboarding, timesheets, clock in/out, tracking, contacts, jobs, dashboard) | **NOT STARTED** beyond an honest scaffold — see `13_AGENCY_WORKFLOW_STATUS.md`; **BLOCKED** on Decision F |
| 9 | Hermes / advanced operations | **BLOCKED** — zero repository evidence found; see `12_HERMES_STATUS.md` and Decision G |
| 10 | Fundraising / business intelligence | **PARTIAL** — real data already exposed via existing features; dedicated BI view **NOT STARTED** absent a named use case (Decision H) |
| 11 | CI/engineering quality (job/test/file/line/reason/artifact reporting) | **DONE** — Playwright (PR #85) and Lint/Typecheck/Prettier/Build (PR #99) all now have structured job-summary failure triage |
| 12 | Release/deployment (PR #63 / release 1.3.0) | **BLOCKED** — human GitHub Settings access required; see `14_RELEASE_STATUS.md` |
| 13 | Commercial licensing | **VERIFIED EXISTING**, unchanged (AGPL-3.0 code / CC BY-SA 4.0 content); relicensing decision **BLOCKED** on Dave (Decision I) |

## Tally

- **DONE:** 6 (1, 2, 3, 4-primary, 7, 11)
- **VERIFIED EXISTING:** 3 (1, 5-primary, 7, 13) — note some rows carry two statuses (a DONE/VERIFIED EXISTING core + a PARTIAL/NOT STARTED sub-item), reflected precisely above rather than flattened to one word
- **PARTIAL:** 3 (4-subitem, 6, 10)
- **BLOCKED:** 4 (6-subitem, 8, 9, 12, 13-subitem)
- **NOT STARTED:** 2 (5-subitem, 8-detail)

(Totals overlap by design — several requirement rows genuinely have both a
completed core and an explicitly scoped-out extension; collapsing them to one
status each would misrepresent either the real progress or the real gap.
Updated 2026-08-18 post-merge: PR #98 shipped the trophy→NFT connection
(item 7), PR #99 shipped CI observability for lint/typecheck/build/format
(item 11) — both moved from PARTIAL to DONE.)
