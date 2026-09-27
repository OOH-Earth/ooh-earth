# NOW — current truth only

Last verified: 2026-09-27 (qualification burst + SOCIAL-4 Progress). Re-verify
anything more than a few days old before acting on it.

## PRODUCT DIRECTION
Real-world social-network programme in short bursts, now under the
owner's **autonomous GREEN-release rule** — `brain/PRODUCT.md` (north
star, roadmap SOCIAL-1..10, rules A–H, privacy rules, AUTONOMY section).
Read it before any feature work.

## CURRENT_ORIGIN_MAIN
`130650b` (SOCIAL-3, PR #285) at the start of this burst, plus the
SOCIAL-4 PR once merged (`feat/social-4-progress`, #286). Always
`git fetch origin main` first.

## PRODUCTION
- Frontend: `oohearth.app` → `6a62213cff3ccbca88c04ff5` → entry
  `index-D6rfqz_E.js` (SOCIAL-4 build; frontend-only, no function change).
- Functions unchanged this burst: `claimQuest`/`getPublicProfile` fresh-
  pull-reconfirmed byte-identical to main in both environments (no drift).
- QA passed: Home (Location limit=500 once + skip=500), Map Flat +
  Globe (worker, real-pointer hover ring), Location Detail, Founder
  Profile (Field Record + new Progress section, zero XP/Level leakage),
  `/operative` Progress (private), Mission Board — desktop 1440 + mobile
  390/412 + landscape 915x412. 0 anonymous WebSockets throughout, 0
  entity writes.

## BACKUP
`ooh-earth-backup.base44.app` → `6a6748e009b947cb29591871` → entry
`index-BavNZINI.js`; functions unchanged.

## OPEN_P0 / SECURITY
None open. **CHECKPOINT-QC-READ CLOSED** this burst (QuestCompletion read
RLS narrowed to owner-or-admin on both BACKUP and production, fresh-pull
verified before/after; see `QUEUE.md`).
Separately observed (not fixed, not urgent): production `DigitalBust`/
`LocationPhoto` missing a defence-in-depth field lock the repo already
has — not exploitable, entity-level admin-only rule already covers it.

## SOCIAL PROGRAMME
SOCIAL-1..4 CLOSED. **SOCIAL-5 Trails — NEXT, human privacy checkpoint**
(decision package in `QUEUE.md`; do not build until the owner answers the
open questions there).

## OBSERVED, NOT ACTED ON
PERF-OBS-1: HeroConsole re-fetches the full Location set every ~11–20s on
Home (re-confirmed still present this burst). Separate performance burst.

## DEPRIORITISED / DEFERRED
framer-motion 13, react-resizable-panels 4, TypeScript 7 · UX-004 Carto
key · `fix/production-app-binding` · AdObservation · Founding directory.

## NEXT_TASK
Two independent items, either can go first:
1. A human runs the CHECKPOINT-QC-READ push (BACKUP then production) —
   command + full context in `brain/HANDOFF.md`.
2. Owner answers the SOCIAL-5 Trails open questions in `QUEUE.md`, then a
   burst can scope the smallest safe slice.

## NEXT_PRODUCTION_WRITE
None pending from this session. CHECKPOINT-QC-READ is qualified and
waiting on a human, not on more investigation.

## HUMAN_CHECKPOINT
1. Run (or approve running) the CHECKPOINT-QC-READ schema push.
2. Answer SOCIAL-5's open questions (public/private default, per-entry
   hiding, global kill switch, retention/deletion) before any Trails work
   starts.
