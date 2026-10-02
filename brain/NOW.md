# NOW — current truth only

## WORK VERIFICATION — 2026-10-02
- Current main: `31617284a289c62d8a8cb312fc4d70c079c5a746` (#319).
- #319 merged after exact-head CI + CodeQL and owner-run BACKUP Chromium 16/16 pass (one worker, retries disabled). Initial six-worker run failed 11/14; do not erase that evidence or assert its cause as proven.
- Production is last reconciled to #308, `assets/index-BN4u-e3V.js`. No production deployment occurred in Work.
- Fresh merged-main production build: `assets/index-D7jCRmhl.js`, SHA256 `d8aca1f8dd214ca9c71293287a4a94192c2c55c8526cb55c2107d17615fa59e7`. Runtime SDK targets production; zero BACKUP references.
- SHIP: owner-terminal frontend deploy + live production qualification remain pending. Work's Base44 API network denial remains in force; no bypass attempted.
- BUILD: isolated manual-coordinate capture recovery. Keep manually typed inputs editable and name them accessibly. Candidate not yet BACKUP-qualified.
- AUDIT: Map → Capture → manual location recovery reproduced on BACKUP; completing both coordinates removes inputs and focus. No submission, upload or entity mutation initiated.
- DESIGN: Live Canvas decision package #320 remains draft; Trails/public creative publishing remain separate checkpoints.
- Active execution plan: `plan.md`. Detailed evidence: `docs/ops/ooh-earth/13-CAPTURE-RECOVERY-2026-10-02.md`.

## SOCIAL EARTH ACTIVITY ON MOBILE — IN PROGRESS
- OBJECTIVE: make the existing public-place activity layer reachable on
  mobile, where the current Live Activity surface is desktop-only.
- WHY: Activity → Place is currently invisible on the primary field device;
  exposing the existing verified-place links strengthens discovery without
  inventing a feed or social graph.
- USER LOOP: verified public activity appears → open the place → choose an
  existing field action.
- SCOPE: responsive presentation of the existing `LiveActivityFeed`; keep
  existing auth-gated realtime subscriptions and place-link helper unchanged.
- NON-GOALS: no new entity/schema, feed storage, private reads, identity
  exposure, Trails, messaging, presence, or data writes.
- PRIVACY BOUNDARY: only existing public event fields and existing public
  Location Detail links are shown; realtime remains authenticated-only.
- SUCCESS EVIDENCE: mobile activity cards avoid the bottom navigation area,
  remain keyboard/focus accessible, desktop layout is unchanged, and existing
  activity/location regression tests remain green.

## SOCIAL VERIFIED ACTIVITY → PLACE — CLOSED 2026-09-30
- OBJECTIVE: make verified public FieldCheck activity open the public place
  where the contribution happened.
- WHY: connect CONTRIBUTION → FIELD RECORD → DISCOVERY without introducing a
  social graph or generic feed.
- USER LOOP: a verified field event appears → understand what was verified →
  open the place → choose an existing action.
- SCOPE: reuse the existing authenticated Live Activity subscription,
  public FieldCheck status/location_id, existing activity target helper, and
  Location Detail route; add pure helper/component regression coverage.
- NON-GOALS: no new entity/schema, private reads, public identity fields,
  Trails, messaging, people-nearby, movement history, or writes.
- PRIVACY BOUNDARY: link only when status is `verified` and the existing
  public `location_id` is present; never expose the contributor identity.
- SUCCESS EVIDENCE: verified activity has an accessible place link, pending
  checks remain non-interactive, existing activity tests stay green, and no
  data mutation occurs.
- RELEASE: PR #310 merged as `a29e577d3034057ba9c55a257a0ee9535f22873b`.
  Production was built from that SHA and the live entry plus Home,
  LocationDetail, and LiveActivityFeed chunks matched the expected hashes.
- QA: BACKUP and production deployed frontend-only; fresh Chromium passed
  the required five production viewports with no page errors or horizontal
  overflow. Location Detail route CTA regression passed. Existing
  `fieldNews`/`fieldStats` POSTs were read/aggregate probes, not entity or
  resource mutations. Authenticated browser QA remains unavailable.

## SECURITY MAINTENANCE — CLOSED 2026-09-30
- Root main baseline had transitive `@base44/sdk@0.8.48 → axios@1.18.1`
  high advisories. The surgical lockfile update to `axios@1.20.0` cleared
  high/critical audit findings without source or package.json changes.
- PR #311 merged as `e95a9acba3d4084fc8e9ce29a4e4da7fb5b250fc`; audit,
  security tests, build, lint/typecheck, CodeQL, and Playwright gates passed.

## SOCIAL PLACE DISCOVERY LINKS — CLOSED 2026-09-29
- OBJECTIVE: make Home’s existing real-place “terrain, now” surface lead to
  truthful Location Detail instead of dead-ending at the generic map.
- WHY / USER LOOP: discover a place → open its record → add it to a field
  route or choose an existing field action.
- SCOPE: MiniMapStack numbered place cards and map popups now link to
  `/location/:id`; deterministic Home regression coverage shipped in PR #307.
- PRIVACY BOUNDARY: only already-public Location IDs and fields are linked;
  no person identity, precise presence, schema, permission, or backend data
  change was introduced.
- RELEASE: PR #307 merged as `62829b5d273c50f9c6cd3fa35a25a37b485113f8`.
  BACKUP entry `assets/index-hM8GfUB2.js` and
  `MiniMapStack-3xgst_Eo.js` matched the built hashes. Production entry
  `assets/index-DaErEz-B.js` and `MiniMapStack-C3wP2l79.js` matched the
  production build; live chunk contains `Open location detail`.
- QA: deterministic functional test passed; production fresh Chromium passed
  387x805, 430x932, 1024x768, 1440x900, 667x375, 844x412, and 932x430 with
  no horizontal overflow, no page errors, and no true entity/resource
  writes. Platform telemetry, media aborts, and a 429 were understood.
- LIMITATION: anonymous live production exposed no natural public Location
  links, so live CTA clicking was not fabricated; fixture navigation plus
  source/build/live-chunk reconciliation are the functional evidence.
- NEXT SAFE BURST: audit the next existing place/mission/activity handoff;
  keep Trails as a human privacy checkpoint.

## SELECTED MARKER OVERLAY RELEASE — 2026-09-29
- PR #303 merged as `82d5ed82145506d7a7e7d041921b46a4ff816989`.
- Root cause: shared MapLibre location popups used the default zero offset, so the selected information popup intruded into the selected ~61px glyph. `Globe3D.jsx` and `MediaCorpGlobe.jsx` now use a 44px dynamic popup offset; Flat Leaflet marker anchors were already safe.
- Deterministic Playwright geometry coverage passes at 1440x900, 1024x768, 387x805, 844x390, and 915x412 with marker/popup intersection area zero and an 8px minimum gap. CI mobile and smoke/accessibility suites passed.
- Fresh merged-main production build was `assets/index-DDdeMp_o.js`; runtime app ID was `6a62213cff3ccbca88c04ff5`, backup ID was not active. Live production HTML and `Globe3D-CPna4LJ_.js` match the build and contain the fixed offset.
- Final anonymous production responsive smoke had no horizontal overflow. Natural live selected-marker fixture data was unavailable, so live popup geometry remains covered by the deterministic fixture test; authenticated browser QA remains unavailable.

Last verified: 2026-09-28 (landscape and place-to-mission releases shipped).

## LANDSCAPE RELEASE CHECKPOINT
- Starting main `f0d5f36a5d931b7b6b6a0dad1bb09e6433bacb45`; production entry before fix `assets/index-CQGmvaxy.js`.
- Production reproduced: map heights 132px (667x375), 131px (844x390), 153px (844x412/915x412), 171px (932x430). Cause: 55px compact bar in flex flow plus 16px excess `md` landscape top padding.
- Candidate only changes `src/pages/Map.jsx` and `e2e/map-landscape-layout.spec.ts`: bar overlays in mobile landscape, controls move beneath it, landscape uses 7rem top reservation. Targeted test passes 844x390 and 915x412 (>=200px, controls, nav clearance, no overflow).
- PR #298 merged as `7c0acd2167b24c7608b1a30710f539276575604f`. Fresh production build head matched that SHA; production entry `assets/index-Dv146f8m.js` contains the active production app ID. Live cache-busting proof: 667x375=187px, 844x390=202px, 844x412=224px, 915x412=224px, 932x430=242px; representative portrait/tablet/desktop widths had no horizontal overflow. The first post-deploy check saw old geometry before CDN propagation; direct live chunk/CSS hashes then matched the build and fresh checks passed. Landscape release is CLOSED.
- Baseline-only: `LocationRelationship` missing from both approved entity manifests; `moderate/entry.ts:119` inferred `verified_date` error. Identical on main/candidate; do not fix in this release.

## PRODUCT DIRECTION
Real-world social-network programme in short bursts, under the owner's
**autonomous GREEN-release rule** and **PRE-DAVE RELEASE STANDARD** —
`brain/PRODUCT.md`. Read it before any feature work.

## CURRENT_ORIGIN_MAIN
`b62fecf` (PR #287 merged — mobile black square fix). Always
`git fetch origin main` first.

## PRODUCTION
- Frontend: `oohearth.app` → `6a62213cff3ccbca88c04ff5` → entry
  `index-tNipbom3.js`.
- Functions: `claimQuest`/`getPublicProfile` unchanged this burst, still
  byte-identical to main. `QuestCompletion`'s read RLS was narrowed to
  owner-or-admin in the prior burst (CHECKPOINT-QC-READ, closed).
- Mobile black square: CLOSED — root-cause verified live against a real
  affected record (`6a633da7fd5deca1dd6a57f4`: old stripped-suffix URL
  404s, new unstripped URL 200s). Field Attention/ticker overlap: CLOSED
  (confirmed no bounding-box overlap in both toggle states).
- QA passed: full portrait mobile matrix (320–430px) + tablet (768) +
  desktop (1440) on Map, Home, Location Detail, `/operative` — all clean,
  0 anonymous WebSockets, 0 entity writes, console/network understood.
- Authenticated browser QA remains unavailable in this environment. Anonymous production QA observed expected platform telemetry (rrweb 429), anonymous auth 401, and a blocked external Wikimedia image; no page errors or core request failures. Function POSTs were read/aggregate probes, not user-data writes.
- Social place-to-mission CTA shipped in PR #299, merge `bcebc81fb3463959fde3b66ec3bd5de9bfc8d9e7`; production artifact `assets/index-CdunO6Ul.js` and `OperativeProfile-CRP5WLE4.js` are live. Mission Board focused suite passed 8/8; live production responsive matrix remained green (667x375=187px, 844x390=202px, 844x412=224px, 915x412=224px, 932x430=242px; 387x805=562px; no overflow).
- **Authenticated QA was not completed this burst** — see ENVIRONMENT
  LIMITATION below. Owner explicitly authorized proceeding on the
  anonymous-QA path instead.

## BACKUP
`ooh-earth-backup.base44.app` → `6a6748e009b947cb29591871` → entry
`index-DuvKH6jw.js`. Has only 3 real Location records, none with an
image — the black-square fix could not be exercised against real BACKUP
data; verified instead via source review + 3 dedicated Playwright tests
(mocked 404) + live production data (see above).

## ENVIRONMENT LIMITATION — no authenticated-browser QA path exists yet
This session's Chromium (chrome-devtools MCP) is headless-only. Relaunching
it non-headless does not produce a window the owner can see — confirmed by
inspecting the real X11 window tree directly (WSLg's display socket is
real; Chrome just never maps a window onto it). No manual-login handoff is
currently possible into the browser I can inspect. Full detail + what NOT
to re-attempt in `brain/INVARIANTS.md` "Browser QA". Until this is fixed
(or another approach is found), authenticated Mission Board / Progress /
QuestCompletion-owner-read behavior can only be verified via: deterministic
tests, code review, and anonymous-path live QA — same as every burst so far.

## OPEN_P0 / SECURITY
None open. CHECKPOINT-QC-READ closed (prior burst). Mobile black square
closed (this burst). Still separately observed, not fixed, not urgent:
production `DigitalBust`/`LocationPhoto` missing a defence-in-depth field
lock the repo already has (not exploitable).

## SOCIAL PROGRAMME
SOCIAL-1..4 CLOSED. SOCIAL-5 Trails remains a human privacy checkpoint. The
next safe burst is place-centric: the Mission Board now links directly to
the field map so a mission leads to a real-world action surface.

## OBSERVED, NOT ACTED ON
- PERF-OBS-1: HeroConsole re-fetches the full Location set every ~20s on
  Home. Separate performance burst.
- Landscape map collapse (844×412 / 915×412) — see PRODUCTION above.
  Needs its own root-cause pass.
- Header "Atlas" breadcrumb link hidden behind the fixed toolbar on
  Location Detail — low severity, two working alternate paths exist.

## DEPRIORITISED / DEFERRED
framer-motion 13, react-resizable-panels 4, TypeScript 7 · UX-004 Carto
key · `fix/production-app-binding` · AdObservation · Founding directory.

## NEXT_TASK
Next safe product work: audit place-centric discovery and mission context
without adding new schema or private-data access. Keep PERF-OBS-1, the two
baseline maintenance findings, and SOCIAL-5 separate.

## NEXT_PRODUCTION_WRITE
None pending.

## HUMAN_CHECKPOINT
1. Decide priority among the NEXT_TASK candidates above.
2. SOCIAL-5's open questions (public/private default, per-entry hiding,
   global kill switch, retention/deletion) before any Trails work starts.

## FINAL RECONCILIATION — 2026-09-30
- Current merged main: `a29e577d3034057ba9c55a257a0ee9535f22873b` (PR #310;
  includes security merge #311).
- Fresh BACKUP and production builds used explicit app IDs and deployed only
  the frontend. Production live entry and feature chunks matched the build;
  no backend/resource/data deployment occurred.
- `SAFE_TO_REPORT_TO_DAVE: YES`; no open P0 or release blocker.

## PRIOR RECONCILIATION — 2026-09-29
- Current merged main: `d3bd32db1797b1ba640a4aa8893a6ce3f9a6b737` (PR #301 docs merge; includes PR #300 Home Globe fix and PR #299 social CTA).
- Fresh production build from that SHA: `assets/index-T3tZAZek.js`; runtime `appId` is `6a62213cff3ccbca88c04ff5`; backup ID is not active configuration.
- Production frontend redeployed from the fresh merged-main build with Base44 CLI 0.1.14. Live HTML and entry now match `assets/index-T3tZAZek.js`.
- Final live production map geometry: 667x375=187px, 844x390=202px, 844x412=224px, 915x412=224px, 932x430=242px; 387x805=562px; representative portrait/tablet/desktop widths had no horizontal overflow and zero page errors.
- Live Mission Board chunk `OperativeProfile-CdoEmAUT.js` contains the place-to-map CTA. No user/data writes were made; observed telemetry and aggregate probes remain expected.
