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
**QuestCompletion read-rule hardening — sandbox denied the push, needs a
human to run it.** Fully investigated and qualified this burst (see
`QUEUE.md` CHECKPOINT-QC-READ): both BACKUP and production authoritative
schemas confirmed identical (`"read": {}` — fully public), every repo
consumer audited (only `useGamification.js` reads QuestCompletion via the
client SDK, already scoped to `created_by_id: me.id`; everything else is
`asServiceRole` or tests), so narrowing is safe. The whole 24-entity
folder was diffed fresh against BACKUP's live schema — only
`QuestCompletion.rls.read` differs, nothing else.

Target rule (proven syntax, already live on `Location`/`FieldCheck`/
`DigitalBust` for their own read rules):
```json
"read": {
  "$or": [
    { "created_by_id": "{{user.id}}" },
    { "user_condition": { "role": "admin" } }
  ]
}
```
`create`/`update`/`delete` stay exactly as-is (admin-only, unchanged).

To apply: from a clean worktree on this branch, in `base44/entities/`,
apply that one edit to `QuestCompletion.jsonc`'s `rls.read`, then run
(BACKUP first):
```
npx --yes base44@0.1.14 --app-id 6a6748e009b947cb29591871 entities push --yes
```
Then fresh-pull authoritative schema (`GET .../entity-schemas` via the
CLI's stored token — see `INVARIANTS.md`) to prove exactly that one field
changed on BACKUP, run the behavior checks in `QUEUE.md`
CHECKPOINT-QC-READ, then repeat for production
(`--app-id 6a62213cff3ccbca88c04ff5`) **built from a fresh production
pull, not the BACKUP folder** — production currently has 2 unrelated,
pre-existing drifted entities (`DigitalBust`, `LocationPhoto` — see
QUEUE, not a QuestCompletion issue) that must NOT be touched by this push.

Separately noticed, not fixed (own-scope, not bundled in): production's
`DigitalBust`/`LocationPhoto` are missing a field-level write lock on
`status` that the repo already declares and that BACKUP already has.
Not currently exploitable — the entity-level `update` rule on both is
already admin-only on production, confirmed live — but worth a future
one-line schema sync once someone reviews it deliberately.

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
