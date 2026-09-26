# HANDOFF — read this first

LAST_UPDATED: 2026-09-26 (loop #3 — CI reliability / TEST-001 closed,
GIT-001 further progressed, major dependency programme matrixed)

**TEST-001 is CLOSED** (see `QUEUE.md` and `docs/ops/ooh-earth/
05-TEST-MATRIX.md` for full detail) — a real, root-caused, fixed, and
CI-verified test bug, not application code, not CI infra. Treat it as
historical, not pending.

CURRENT_MAIN: verify fresh with `git fetch origin main` — this pass
merged #249, #192, #105, #279, and (pending its final CI check as this
was written) #190. Don't trust a quoted hash without re-fetching.

CURRENT_TASK complete this pass:
1. **TEST-001**: fresh-fetched origin/main and confirmed all 6 of the
   prior pass's reported merges (#217/#277/#254/#248/#249/#278) were
   really there before trusting the report. Investigated the CI
   architecture first (Playwright config, GitHub Actions job graph) and
   ruled out worker/resource contention as a factor before touching any
   test code. Root-caused via direct code instrumentation +
   `page.on('console')` capture on the REAL test (not just static
   reading) — confirmed the mechanism, then confirmed the fix with 60/60
   local repeats and real GitHub CI (including an explicit rerun of the
   historically-unstable job). Merged PR #279. No application code
   touched.
2. **#105** (deferred from the prior pass's "isolated CI rerun" plan,
   which was wrong): fresh-inspected, found a real, deterministic test
   bug distinct from TEST-001 (querying the DOM before SPA hydration
   completes). Fixed the test's wait condition only — the CSS fix itself
   was already correct and unchanged. Verified 10/10 locally + real CI,
   merged.
3. **#192**: fresh-classified as SAFE (GitHub Actions CodeQL action
   version bump, CI-config-only, no app/lockfile surface). Merged.
4. **#249**: carried over from the prior pass as CI-green; confirmed
   fresh and merged.
5. **Major dependency programme**: built a real compatibility matrix
   (npm registry peer-dependency queries, actual usage-count greps,
   fresh mergeable-state checks) for #188/#189/#20/#39/#88/#191 — see
   `docs/ops/ooh-earth/01-PRIORITY-QUEUE.md`. Key finding: #20
   (react-leaflet 5) is hard-blocked on React 19 (#88+#39), which are
   themselves a linked, highest-blast-radius pair — deferred as its own
   dedicated project, correctly NOT attempted in this general pass.
   #188/#189/#191 are real, independent majors, also deferred pending
   dedicated one-at-a-time investigation.
6. **#190** (rollup-plugin-visualizer): attempted as the one dependency
   PR judged worth pursuing this pass (dev-only, build-time-only, narrow
   single-file usage, not React-gated). Hit and **caught a real mistake**
   mid-pass: an initial lockfile-conflict resolution accidentally
   reverted an unrelated transitive dependency
   (`postcss-selector-parser`) to an old vulnerable version — caught by
   GitHub's own `Dependency Review` check failing on the real PR, not by
   local testing. Corrected by resetting to `origin/main`'s own lockfile
   and applying only the targeted bump on top, verified the diff was
   properly scoped, then confirmed clean on real CI including the one
   soft open question (the package's `engines.node >= 22` vs this repo's
   Node 20 CI — confirmed harmless via real CI, not just a local guess).

CURRENT_STATUS: the safe, evidence-supported queue is exhausted for this
pass. What's left needs either a genuine human/product decision (when to
do the React 19 migration) or dedicated investigation time (framer-
motion, react-resizable-panels, TypeScript 7) — not more autonomous
processing.

NEXT_STEP, in order:
1. `git fetch origin main` — get the true current state; confirm #190
   landed (it was CI-green, pending the final merge as this was written).
2. No other mechanical PR work remains in the safe queue.
3. When ready: scope the React 18→19 migration (#88+#39+#20) as its own
   dedicated task — full regression pass across every page, not a
   dependency-sweep afterthought. Read `docs/ops/ooh-earth/
   01-PRIORITY-QUEUE.md`'s matrix first.
4. Separately, when there's appetite: give framer-motion (#188),
   react-resizable-panels (#189), and TypeScript 7 (#191) each their own
   one-at-a-time compatibility pass. Do not batch them.

BLOCKERS: none active.

PRODUCTION_WRITES_PENDING: none — this pass touched only CI/tests/
tooling, no application runtime code, no deploy needed.

HUMAN_AUTHORIZATION_PENDING:
1. UX-004's fix direction — get the free Carto API key (recommended, see
   `QUEUE.md`) or decline. (Untouched this pass, per explicit
   instruction — do not obtain/configure a key autonomously.)
2. Whether `fix/production-app-binding` (funnel/attribution branch) is
   still wanted.
3. When to schedule the React 18→19 migration project (gates
   react-leaflet 5 too) — a real, scoped decision now, not a vague
   "majors pending" note.
4. Priority/timing on the framer-motion/react-resizable-panels/
   TypeScript-7 investigations.

DO_NOT_TOUCH:
- `feat/weather-context-v1` (the working directory's own checked-out
  branch) — dirty, user-owned, unrelated TrueCost/UPC-scanner work in
  progress. Never reset/switch/clean/delete it. All real work happens in
  fresh worktrees off `origin/main`.
- `LabAdmin.jsx`/`CareersAdmin.jsx`/`Plans.jsx`/`PortalOps.jsx` — evidence-
  deferred from react-query migration for specific, real reasons (see
  `DECISIONS.md`). Don't touch without new architectural evidence.
- Do not implement UX-004 before Dave has the Carto API key in hand.
- Do not merge #188/#189/#20/#39/#88/#191 on green CI alone — real
  majors, need dedicated compatibility passes per the matrix in
  `docs/ops/ooh-earth/01-PRIORITY-QUEUE.md`. #20 will actively break the
  build if merged before #88+#39.
- When resolving a real `package-lock.json` conflict, do not take one
  side (`--ours`/`--theirs`) and regenerate via `npm install
  --package-lock-only` — this can silently revert unrelated transitive
  dependencies' resolved versions (it did, once, this pass — see #190's
  own writeup). Reset to the target base's own lockfile, apply only the
  PR's own targeted change on top, and check the resulting diff is
  properly scoped before pushing.

READ_NEXT_IF_NEEDED:
- `QUEUE.md` — TEST-001 and GIT-001 full detail, this is the primary
  working doc.
- `docs/ops/ooh-earth/05-TEST-MATRIX.md` — TEST-001's full root-cause
  writeup and occurrence table.
- `docs/ops/ooh-earth/01-PRIORITY-QUEUE.md` — the major dependency
  compatibility matrix and the lockfile-conflict lesson from #190.
- `docs/ops/ooh-earth/04-SECURITY-QUEUE.md` — SEC-001/SEC-002 (historical,
  closed, unrelated to this pass).
