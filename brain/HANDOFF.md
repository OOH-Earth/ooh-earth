# HANDOFF — read this first

LAST_UPDATED: 2026-09-27 (SOCIAL-2 Field Record — shipped, stopped by
design)

The repo runs a **real-world social-network programme in short bursts**.
Read `brain/PRODUCT.md` before any feature work — it holds the north star,
the master roadmap SOCIAL-1..10, the permanent rules A–H, and the privacy
hard rules.

Everything prior (React 19 + react-leaflet 5, TEST-001, SEC-001/002,
UX-001/002/003, SOCIAL-1) remains CLOSED.

## What this burst did
1. Re-verified SOCIAL-1 reconciled (PR #283 merged, prod == main).
2. Proved `getPublicProfile` identical on main / BACKUP / production
   before touching it; re-audited its privacy boundary (uniform
   `{found:false}` for private/missing, explicit allowlist, check mode
   returns only `taken`/`mine`).
3. Added `recent_verified_places` (max 5, verified-only, own places,
   `{id,title,type,created_date(day)}`) from the query the count already
   ran; refactored into `handler.ts` with 12 Deno tests.
4. Field Record section on `FounderProfile.jsx`, honest empty state,
   pure normaliser + unit tests, 6 Playwright cases.
5. BACKUP then production: function deploy (only `getPublicProfile`),
   fresh-pull byte-identical, raw-response privacy QA; frontend builds
   target-proven via the entry's runtime init object, deployed, desktop +
   mobile QA. Nothing written to any entity.
6. SOCIAL-3 discovery only (see `QUEUE.md`), roadmap + rules recorded.

## Next
SOCIAL-3 Missions. Recommendation: Missions = the existing Quest system
(`QUESTS` + `claimQuest` + `QuestCompletion`) rebranded and pointed at
real places — no parallel engine. Resolve the "Field Mission" naming
collision first. Human checkpoint in `NOW.md`.

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
