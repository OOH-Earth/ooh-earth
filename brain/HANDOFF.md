# HANDOFF — read this first

LAST_UPDATED: 2026-09-26 (loop #4 — React 19 migration, CLOSED)

**REACT-19 is now CLOSED** — production and BACKUP both running React
19.3.0 + react-leaflet 5.0.0, live-verified on real data. TEST-001,
SEC-001/SEC-002, UX-001/002/003, and prior GIT-001 items remain CLOSED,
unchanged this pass. Treat all of these as historical.

CURRENT_MAIN: verify fresh with `git fetch origin main` — `7700ed6` at
last check, includes PR #281.

CURRENT_TASK complete this pass — full arc from discovery to production:
1. **Discovery** found the mission's own phase plan (React 19 and
   react-leaflet 5 as fully separate releases) wasn't achievable at the
   npm dependency-resolution level — react-leaflet v4 hard-blocks React
   19 (real `ERESOLVE` install failure, not a soft warning), react-leaflet
   v5 requires React 19, no version bridges them. **Asked the user how to
   proceed; they confirmed combining into one migration.**
2. Searched the whole `src/` tree for every React 19 breaking-change
   pattern before writing code — found none in use. Fetched react-leaflet
   v5's own official release notes to confirm its only breaking change
   (`LeafletProvider` removal) wasn't used here, rather than assuming.
   Checked peer-dependency declarations for every other React-adjacent
   package individually.
3. Applied the combined bump (react/react-dom/react-is/react-leaflet →
   19.3.0/19.3.0/19.3.0/5.0.0, plus two small forced companion bumps) in
   a fresh worktree/branch/PR (#281). No application source code changed.
4. **Lockfile safety**: snapshotted the full dependency graph before and
   after, diffed it, confirmed every one of the 13 changed entries traced
   to an intended bump or its own legitimate transitive dependency — zero
   unrelated packages touched, learning correctly applied from a prior
   pass's mistake.
5. Full static + unit + Playwright qualification (both projects), all
   clean.
6. **BACKUP live QA**: proved the target, deployed, did real hands-on
   browser verification at desktop + 3 mobile viewports + landscape —
   Home globe, Map Flat (react-leaflet 5's actual rendering — clusters,
   hover-emphasis ring, marker click, `Popup`), Map Globe, Location
   Detail (incl. embedded react-leaflet mini-map). Checked P0 dedupe and
   anonymous realtime gating directly via the network panel.
7. Opened PR #281 with the full writeup. **All CI green**: Dependency
   Review, Dependency audit, Build, Lint & Typecheck, Prettier, CodeQL,
   Playwright (both projects).
8. **Production build target proof, deploy (succeeded first attempt, no
   sandbox denial this time), and live production QA on real data** (786
   locations) — Home, Map Flat/Globe, mobile, hover-emphasis all
   confirmed working. Investigated a `rrweb`/QUIC console-error pattern
   before dismissing it — confirmed it's an unrelated vanilla-JS
   analytics beacon hitting an already-rate-limited endpoint, not a
   migration regression (all 288 tracked app/data/image/map-tile requests
   returned successful statuses).
9. Merged PR #281. Confirmed `origin/main`'s `package.json` reflects the
   new versions and that the already-deployed production source matches
   the merged tree exactly — no redeploy needed.
10. Closed PRs #88, #39, #20 as superseded, each with a comment explaining
    the npm-level coupling (not closed silently).

CURRENT_STATUS: fully closed, safe queue exhausted for this loop.

NEXT_STEP: none mechanical. When there's appetite, pick ONE of
framer-motion 12→13 / react-resizable-panels 2→4 / TypeScript 7
investigation as the next dependency item (see
`docs/ops/ooh-earth/01-PRIORITY-QUEUE.md`'s matrix) — none is urgent, none
blocks anything.

BLOCKERS: none active.

PRODUCTION_WRITES_PENDING: none.

HUMAN_AUTHORIZATION_PENDING:
1. UX-004's fix direction (Carto API key) — untouched, unrelated to this
   pass.
2. `fix/production-app-binding` — untouched, unrelated.
3. Priority on the next dependency item (framer-motion/
   react-resizable-panels/TypeScript-7) — not urgent.

DO_NOT_TOUCH:
- `feat/weather-context-v1` — dirty, user-owned, unrelated work. Never
  reset/switch/clean/delete/commit into it.
- `LabAdmin.jsx`/`CareersAdmin.jsx`/`Plans.jsx`/`PortalOps.jsx` — evidence-
  deferred react-query migration candidates, see `DECISIONS.md`.
- Do not obtain/commit/configure a Carto API key (UX-004 stays a pending
  owner decision).
- **Lockfile conflicts**: never resolve with a naive `--ours`/`--theirs`
  + `npm install --package-lock-only`. Reset to the target base's own
  lockfile, apply only the intended change on top, and diff the full
  resolved dependency graph before/after to prove nothing unrelated
  moved. See `docs/ops/ooh-earth/01-PRIORITY-QUEUE.md` for the incident
  this rule comes from — correctly avoided this pass by following it.

READ_NEXT_IF_NEEDED:
- `QUEUE.md`'s REACT-19 entry — the full closed record for this pass.
- PR #281 itself (merged) — the fullest version of the discovery and
  qualification writeup, plus the explanatory comments on #88/#39/#20.
- `docs/ops/ooh-earth/01-PRIORITY-QUEUE.md` — the dependency compatibility
  matrix and lockfile-safety lesson, still relevant for the next
  dependency item.
