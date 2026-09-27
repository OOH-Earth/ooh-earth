# HANDOFF — read this first

LAST_UPDATED: 2026-09-27 (SOCIAL-3 Missions — shipped, stopped by design)

The repo runs a **real-world social-network programme in short bursts**
under the owner's autonomous GREEN-release rule (see `PRODUCT.md`
"AUTONOMY"). Read `brain/PRODUCT.md` before any feature work.

Everything prior (React 19, TEST-001, SEC-001/002, UX-001/002/003,
SOCIAL-1, SOCIAL-2) remains CLOSED.

## What this burst did
1. Discovery of the real quest engine: `QUESTS`, `claimQuest`,
   `QuestCompletion`, the client hook, the board UI, period logic.
2. Found and fixed a three-way period disagreement (offset-less Base44
   timestamps parsed as local time in browsers; server week rolling over
   Saturday in runtime-local time; client progress in local day/Monday).
   One UTC definition shared by server and client, parity-tested.
3. Mission Board = the Quest Board, reframed: explicit states, UTC reset
   countdown, honest claim feedback, safety copy, own-rows-only fetch.
4. "Field Mission" was user-facing on the public Map → public copy now
   says "route"; operator tooling unchanged.
5. Found production `claimQuest` lagging main (no server-side
   eligibility); this release reconciled it. BACKUP then production,
   `claimQuest` only, fresh-pull verified; frontends target-proven and
   QA'd desktop + mobile.
6. Prepared CHECKPOINT-QC-READ and SOCIAL-4 discovery (QUEUE).

## Next
SOCIAL-4 Progress — autonomous private part first; public-profile part is
a human checkpoint. PERF-OBS-1 is a separate performance burst.

## Blockers
None.

## Sandbox note
Both `functions deploy getPublicProfile` calls (BACKUP + production) and
both `site deploy` calls ran directly this burst — no classifier denial.
If a future deploy is denied, do not bypass via the browser; hand the
exact command to the owner, e.g.
`npx --yes base44@0.1.14 --app-id <APP_ID> functions deploy <name>`
(never `--force`).

## DO_NOT_TOUCH
- `feat/weather-context-v1` (user's dirty branch) — never touch.
- UX-004 Carto key, `fix/production-app-binding`, AdObservation, Founding
  directory — separate owner decisions.
- framer-motion 13 / react-resizable-panels 4 / TypeScript 7 —
  deprioritised for this programme unless a direct blocker.
- Never fabricate users, activity, completions, or friendships.
- Lockfile conflicts: reset to the target base's lockfile and diff the
  full dependency graph (see `docs/ops/ooh-earth/01-PRIORITY-QUEUE.md`).
