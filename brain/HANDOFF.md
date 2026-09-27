# HANDOFF — read this first

LAST_UPDATED: 2026-09-27 (Social Burst #1 — shipped, stopped by design)

The repo is now running a **social-network programme in short bursts**.
Read `brain/PRODUCT.md` before any feature work — it holds the north star
and the privacy/safety hard rules.

Everything prior (React 19 + react-leaflet 5, TEST-001, SEC-001/002,
UX-001/002/003) remains CLOSED.

## What this burst did
1. Discovery (read-only): inventoried entities and social/gamification
   primitives. Found far more already exists than the brief assumed — a
   real XP/level/badge engine, `QuestCompletion`, public opt-in Founding
   Profiles with real contribution counts, `MiniMapStack` (recent real
   places on Home), and a real auth-gated `LiveActivityFeed`. See
   `PRODUCT.md` "Existing primitives".
2. Chose the smallest real gap: live activity cards weren't actionable.
   Made new-place / adopted-landmark cards link to the public Location
   Detail page. Frontend-only, no schema/function change.
3. Tested (unit 137/137, lint, prettier, typecheck, build, Home smoke),
   BACKUP target-proven + deployed + rendered QA, production target-proven
   + deployed + rendered QA on real data. P0 dedupe, realtime gating,
   globe/map, Location Detail all verified intact.
4. Recorded the durable product direction in `brain/PRODUCT.md`.

## Next
Owner picks Social Burst #2. Recommendation: SOCIAL-2 (real-world history
on public profiles) — needs an additive `getPublicProfile` response change,
so BACKUP-first + explicit owner approval before the production function
deploy. Full proposal in `QUEUE.md`.

## Blockers
None.

## DO_NOT_TOUCH
- `feat/weather-context-v1` (user's dirty branch) — never touch.
- UX-004 Carto key, `fix/production-app-binding`, AdObservation, Founding
  directory — separate owner decisions.
- framer-motion 13 / react-resizable-panels 4 / TypeScript 7 —
  deprioritised for this programme unless a direct blocker.
- Never fabricate users, activity, completions, or friendships.
- Lockfile conflicts: reset to the target base's lockfile and diff the
  full dependency graph (see `docs/ops/ooh-earth/01-PRIORITY-QUEUE.md`).
