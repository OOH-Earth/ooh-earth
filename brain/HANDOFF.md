# HANDOFF — read this first

LAST_UPDATED: 2026-09-28 (landscape release checkpoint; BACKUP deployed, QA incomplete)

## Active landscape release
Candidate: `src/pages/Map.jsx` + `e2e/map-landscape-layout.spec.ts` only. Real production collapse measured 132/131/153/153/171px across 667x375..932x430. Root cause: compact bar flex consumption (55px) and md landscape top padding (16px). BACKUP frontend-only deployment is reconciled at `assets/index-wlx-ltLf.js`, runtime app `6a6748e009b947cb29591871`; 932x430 is 242px, no overflow/errors. Resume remaining BACKUP QA; no PR/merge/production work yet.

Baseline exceptions, not release changes: `LocationRelationship` missing from approved manifests and `moderate/entry.ts:119` inferred `verified_date` type error. Both match untouched starting main. Do not alter entities/functions/manifests in this release.

The repo runs a **real-world social-network programme in short bursts**
under the owner's autonomous GREEN-release rule and PRE-DAVE RELEASE
STANDARD (see `PRODUCT.md`). Read `brain/PRODUCT.md` before any feature
work.

Everything prior (React 19, TEST-001, SEC-001/002, UX-001/002/003,
SOCIAL-1/2/3/4, CHECKPOINT-QC-READ) remains CLOSED.

## What this burst did
1. A peer session ("debug-mobile-map-black-square") and this session were
   both independently authorized by the owner to close PR #287 —
   discovered mid-way via cross-session messages, surfaced to the owner
   (never resolved by guessing between two live authorizations), owner
   picked this session, peer stood down cleanly. Worth remembering: two
   sessions can receive what reads as the same direct authorization; ask
   before assuming either should proceed.
2. Reconciled PR #287 (branched from stale `130650b`) onto current main
   (`2f1337e`) myself — clean merge, then inspected the FULL resulting
   diff to prove it only touched `LocationMap.jsx`/`LocationThumb.jsx`/
   `Map.jsx` + 1 new e2e spec + 2 docs files, nothing else (no revert of
   QuestCompletion RLS, SOCIAL-1..4, dedupe, realtime gating).
3. Closed the mobile black-square bug + a Field Attention/ticker overlap
   found in the same investigation. Verified the root cause live against
   a real affected production record, not just via passing tests — see
   `QUEUE.md` "MOBILE BLACK SQUARE".
4. Found and confirmed (independently, not just trusted) a real,
   separate, pre-existing landscape-map-collapse bug — NOT fixed here,
   recorded in `QUEUE.md`.
5. Attempted an authenticated-QA handoff (owner logs into a real browser,
   automation resumes on that session) — hit a real environment
   limitation: this session's Chromium cannot show a window the owner can
   click into, in either headless or non-headless mode. Diagnosed
   precisely (not guessed) via a direct X11 window-tree inspection.
   Recorded in `INVARIANTS.md` "Browser QA" so it isn't re-attempted
   blindly. Owner explicitly authorized falling back to the anonymous-QA
   path already used successfully in every prior burst.

## Next
Owner's call among: fix the landscape collapse, find/fix an authenticated
QA path, SOCIAL-5 Trails (needs the owner's privacy decisions), or
PERF-OBS-1. None are blocking.

## Blockers
None release-blocking. Two carried-forward, non-urgent items:
1. `PortalOps.jsx`'s 3 documentation strings describing QuestCompletion's
   old "READ/CREATE OPEN" access are stale (the rule was narrowed to
   owner-or-admin in a prior burst) — small, safe, frontend-only text fix
   for a future pass.
2. No working authenticated-browser QA path exists in this environment —
   see `INVARIANTS.md` "Browser QA" before attempting one again.

Separately noticed, not fixed (own-scope, not bundled into the push
above): production's `DigitalBust`/`LocationPhoto` are missing a
field-level write lock on `status` that the repo already declares and
that BACKUP already has. Not currently exploitable — the entity-level
`update` rule on both is already admin-only on production, confirmed live
— but worth a future one-line schema sync once someone reviews it
deliberately.

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
