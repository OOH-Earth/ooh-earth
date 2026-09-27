# HANDOFF — read this first

LAST_UPDATED: 2026-09-27 (qualification burst + SOCIAL-4 Progress —
shipped, stopped by design)

The repo runs a **real-world social-network programme in short bursts**
under the owner's autonomous GREEN-release rule (see `PRODUCT.md`
"AUTONOMY"). Read `brain/PRODUCT.md` before any feature work.

Everything prior (React 19, TEST-001, SEC-001/002, UX-001/002/003,
SOCIAL-1/2/3) remains CLOSED.

## What this burst did
1. Hard-qualified SOCIAL-1/2/3 with real Chromium/DevTools against
   BACKUP + production: live activity feed (0 events possible without a
   real signed-in session receiving one — honestly recorded as untestable
   beyond the deterministic unit test, nothing fabricated), Field Record
   raw-response privacy, Mission Board states/UTC copy/no-overflow. Found
   zero new regressions. Re-confirmed `claimQuest` drift from the prior
   burst is closed (byte-identical to main in both environments).
2. Core regression pass: Home/Map Flat/Map Globe/Location Detail/Store,
   desktop 1440, mobile 390 + 412 landscape — all clean, P0 dedupe intact,
   0 anonymous WebSockets, 0 entity writes. PERF-OBS-1 (HeroConsole
   polling) re-observed, still correctly left alone.
3. Investigated and fully qualified narrowing `QuestCompletion`'s public
   read RLS — proven safe, whole-folder-diffed against a fresh
   authoritative pull, but the actual push was denied by the sandbox
   classifier. Not bypassed. See "Blockers" below.
4. Along the way found a small, pre-existing, non-exploitable schema
   drift on production (`DigitalBust`/`LocationPhoto` missing a
   defence-in-depth field lock) — recorded, not touched.
5. Shipped SOCIAL-4 Progress: frontend-only (no function/schema change).
   Private `/operative` renamed to "Progress" language; public Founder
   profile gets a Progress section showing only badges truthfully
   derivable from already-public counts, provably never a false
   positive. See `QUEUE.md` SOCIAL-4 for the full writeup.

## Next
A human runs the CHECKPOINT-QC-READ push (see Blockers). Then SOCIAL-5
Trails — a human privacy checkpoint, decision package in `QUEUE.md`, do
not build until the owner answers the open questions there. PERF-OBS-1 is
a separate performance burst.

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
