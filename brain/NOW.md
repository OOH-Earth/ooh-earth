# NOW — current truth only

Last verified: 2026-09-27 (SOCIAL-2 — Field Record). Re-verify anything
more than a few days old before acting on it.

## PRODUCT DIRECTION
OOH Earth is a **real-world social-network programme run in short
bursts** — see `brain/PRODUCT.md` (north star, master roadmap
SOCIAL-1..10, permanent rules A–H, privacy hard rules, visual direction).
Read it before any feature work.

## CURRENT_ORIGIN_MAIN
`e3e832f` (SOCIAL-1, PR #283) at the start of this burst, plus the
SOCIAL-2 PR once merged (`feat/social-2-field-record`). Always
`git fetch origin main` first.

## PRODUCTION
- Frontend: `oohearth.app` → app id `6a62213cff3ccbca88c04ff5` → entry
  `index-DU26cBQ_.js` (SOCIAL-2 build).
- `getPublicProfile`: SOCIAL-2 source (`entry.ts` + `handler.ts`),
  fresh-pull byte-identical to the SOCIAL-2 branch.
- QA passed: Home (Location limit=500 once + one skip=500 continuation),
  Map Globe (MapLibre worker) + Flat (Leaflet markers, hover ring),
  Location Detail, Founder Profile not-found path, 0 anonymous
  WebSockets, no entity writes, desktop 1440×900 + mobile 390×844.

## BACKUP
`ooh-earth-backup.base44.app` → app id `6a6748e009b947cb29591871` →
entry `index-CEFuWLzB.js`; `getPublicProfile` = same SOCIAL-2 source.

## OPEN_P0 / SECURITY
None open. SOCIAL-2 wrote exactly one function (`getPublicProfile`) per
environment. No schema, entity, migration, or data write.

## SOCIAL PROGRAMME
- SOCIAL-1 Discovery Linking — CLOSED.
- SOCIAL-2 Field Record — CLOSED (production-verified; see QUEUE).
- **SOCIAL-3 Missions — NEXT** (design notes in QUEUE; not built).

## OBSERVED, NOT ACTED ON
PERF-OBS-1: HeroConsole re-fetches the full Location set every 20s on
Home (pre-existing). Owner priority call.

## DEPRIORITISED FOR THIS PROGRAMME
framer-motion 13, react-resizable-panels 4, TypeScript 7 — unless one
becomes a direct blocker.

## STILL SEPARATE / DEFERRED (not re-litigated)
UX-004 Carto key · `fix/production-app-binding` · AdObservation · Founding
directory.

## NEXT_TASK
SOCIAL-3 burst: decide Mission = branded Quest (recommended) vs distinct
object, resolve the "Field Mission" naming collision, then ship the
smallest frontend-first Mission board slice.

## NEXT_PRODUCTION_WRITE
None pending.

## HUMAN_CHECKPOINT
Owner confirms SOCIAL-3 direction: "Missions = the existing Quest system,
rebranded and linked to real places" (recommended), and what happens to
the existing local "Field Mission" route planner name.
