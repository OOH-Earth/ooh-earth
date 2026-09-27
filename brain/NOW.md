# NOW — current truth only

Last verified: 2026-09-27 (SOCIAL-3 — Missions). Re-verify anything more
than a few days old before acting on it.

## PRODUCT DIRECTION
Real-world social-network programme in short bursts — `brain/PRODUCT.md`
(north star, roadmap SOCIAL-1..10, rules A–H, privacy rules, visual
direction, autonomy rule). Read it before any feature work.

## CURRENT_ORIGIN_MAIN
`b9df074` (SOCIAL-2, PR #284) at the start of this burst, plus the
SOCIAL-3 PR once merged (`feat/social-3-missions`). Always
`git fetch origin main` first.

## PRODUCTION
- Frontend: `oohearth.app` → app id `6a62213cff3ccbca88c04ff5` → entry
  `index-C5h9-uGg.js` (SOCIAL-3 build).
- Functions changed by the programme: `getPublicProfile` (SOCIAL-2),
  `claimQuest` (SOCIAL-3 — now matches main, incl. server-side
  eligibility + UTC periods). Both fresh-pull byte-identical to source.
- QA passed: Home (Location limit=500 once + one skip=500), Map Globe
  (worker) + Flat (markers, real-hover ring), Location Detail, Founder
  not-found path, `/operative` anonymous, 0 anonymous WebSockets, no
  entity writes; desktop 1440 + mobile 390.

## BACKUP
`ooh-earth-backup.base44.app` → `6a6748e009b947cb29591871` → entry
`index-DDhlcKue.js`; same `claimQuest` / `getPublicProfile` source.

## OPEN_P0 / SECURITY
None open. CHECKPOINT-QC-READ (narrow QuestCompletion read access) awaits
the owner — see QUEUE.

## SOCIAL PROGRAMME
SOCIAL-1 CLOSED · SOCIAL-2 CLOSED · SOCIAL-3 CLOSED · **SOCIAL-4 Progress
NEXT** (discovery in QUEUE; public-profile exposure part is a checkpoint).

## OBSERVED, NOT ACTED ON
PERF-OBS-1: HeroConsole re-fetches the full Location set every 20s on
Home. Separate performance burst.

## DEPRIORITISED / DEFERRED
framer-motion 13, react-resizable-panels 4, TypeScript 7 · UX-004 Carto
key · `fix/production-app-binding` · AdObservation · Founding directory.

## NEXT_TASK
SOCIAL-4, autonomous part: a clearer private progress surface on
`/operative` (own data only, no `Operative` roster entity).

## NEXT_PRODUCTION_WRITE
None pending.

## HUMAN_CHECKPOINT
1. CHECKPOINT-QC-READ — approve narrowing QuestCompletion read to
   owner/admin (recommended).
2. SOCIAL-4 public part — may level/badges appear on the public Founder
   profile, and if so, derived only from already-public verified counts?
