# NOW — current truth only

Last verified: 2026-09-27 (PR #287 final closure — mobile black square +
Field Attention/ticker collision). Re-verify anything more than a few
days old before acting on it.

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
- **Landscape is NOT clean**: `/map` at 844×412 and 915×412 collapses to
  ~130–155px tall on both BACKUP and production. Confirmed pre-existing
  (present before and after #287, not caused by it). See `QUEUE.md`.
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
SOCIAL-1..4 CLOSED. **SOCIAL-5 Trails — NEXT, human privacy checkpoint**
(decision package in `QUEUE.md`; do not build until the owner answers the
open questions there).

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
No single blocking task. Candidates, owner's call:
1. Fix the landscape map collapse (own root-cause pass first).
2. Find a working authenticated-QA path (fix the display issue, or the
   owner accepts qualitative manual QA in their own browser next time).
3. SOCIAL-5 Trails — needs the owner's privacy decisions first.
4. PERF-OBS-1 — bounded performance burst.

## NEXT_PRODUCTION_WRITE
None pending.

## HUMAN_CHECKPOINT
1. Decide priority among the NEXT_TASK candidates above.
2. SOCIAL-5's open questions (public/private default, per-entry hiding,
   global kill switch, retention/deletion) before any Trails work starts.
