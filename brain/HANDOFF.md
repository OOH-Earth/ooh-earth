# HANDOFF — read this first

LAST_UPDATED: 2026-09-25 (loop #2, second half — SEC closed, UX-002 shipped
to production, UX-001 shipped to BACKUP, GIT-001 further progressed)

**SEC-001 and SEC-002 remain CLOSED** (deployed to production, source-
verified, prior pass — not touched this pass). **UX-002 is now fully
CLOSED** — production-deployed, PR #276 merged, deployed bundle confirmed
== merged `main`. Treat both as historical, not pending.

CURRENT_MAIN: verify fresh with `git fetch origin main` — this pass merged
#217 and #254 on top of the prior pass's #275/#276. Don't trust a quoted
hash without re-fetching.

CURRENT_TASK complete this pass:
1. **UX-001** (results-row ↔ marker hover/focus emphasis): root-caused via
   git history (this specific visual sync never existed in these files —
   not a regression, a gap), implemented across `Globe3D.jsx` (MapLibre
   filter-driven ring layer), `LocationMap.jsx` (Leaflet CircleMarker
   ring), and `LocationCard.jsx` (row emphasis on hover AND keyboard
   focus). Extracted the shared logic into `src/lib/hoverEmphasis.js`
   with 9 `node --test` unit tests (this repo has no React-rendering test
   harness — matched the existing convention of testing pure logic, not
   pixels). Deployed to BACKUP, verified with **real** browser hover/focus
   events (a synthetic `dispatchEvent('mouseenter'/'mouseover')` did NOT
   reliably trigger React's handlers in the CDP context used — switched to
   the dedicated `hover` MCP tool and native `.focus()/.blur()` calls,
   which did). Mobile smoke clean. **PR #277 opened**, rebased clean onto
   post-#276 `main`. **Production deploy denied by the sandbox classifier**
   (`[Production Deploy]`, confirmed via retry, not the transient
   "no verdict" failure mode) — not routed around.
2. GIT-001 (fresh-queried, not assumed from old notes): merged #217
   (fflate patch bump, CLEAN) and #254 (Lynxie executor checkout-trust fix
   — did a real security read-through of the diff, not just the PR body;
   confirmed workflow_dispatch-only trigger, no fork-triggerable event,
   minimal `permissions:` block, the trusted/target checkout split is real
   in the diff, injection-risk inputs genuinely moved to `env:`, no
   `--force` push, dry-run gates the only write step, and the 24-assertion
   regression suite matches the claimed threat model — merged). Branch-
   updated #248/#249/#192 (CI was in flight when this pass ended — check
   and merge if green, per NEXT_STEP below). **Two findings that correct
   the prior pass's assumptions:**
   - **#105** ("fix(a11y): expand footer link touch targets") is NOT a CI
     flake — its own new Playwright test fails deterministically (3/3
     retries) with `footer ul a` count `0`, i.e. the footer isn't found at
     the point the test queries it. The actual `SiteFooter.jsx` change
     (adding `inline-block py-1.5 -my-1.5` to existing links) looks
     correct and safe; the bug is in the new test's wait strategy
     (`waitForLoadState('domcontentloaded')` likely fires before this SPA
     hydrates the footer). Needs the test fixed, not a rerun, before merge.
   - **#188** ("chore(deps): Bump framer-motion...") is mislabeled a
     dev-dependency patch in the prior pass's notes — it's actually
     **framer-motion 12.43.0 → 13.2.0, a major version bump**
     (`package.json` confirms current is `^12.43.0`). Its own CI failure
     is in an unrelated pre-existing flaky test (`route-metadata.spec.ts`,
     also seen flaking-but-passing on #105's run) — not caused by this
     bump — but the major-version jump itself needs the same "dedicated
     compatibility investigation" the mission asked for on #20/#39/#88/
     #191, not a blind merge-on-green. Added to that list.
   - #189/#190: still real lockfile conflicts, untouched, not force-
     resolved (react-resizable-panels 2→4 and rollup-plugin-visualizer 6→7
     are also both majors, not just conflicted — same caution applies).
3. **New finding, not investigated**: pushing PR #277 surfaced a GitHub
   Dependabot alert, "1 high" severity, on the default branch
   (`.../security/dependabot/22`). Out of this pass's scope — flag for
   Dave / a future security pass.

CURRENT_STATUS: safe, sequential queue work is exhausted for this pass.
What's left needs either a human action (production deploy authorization/
retry) or a deliberate follow-up investigation (the #105 test bug, the
#188/#189/#190/#20/#39/#88/#191 major-version compatibility pass, the new
Dependabot alert) rather than more mechanical PR-merging.

NEXT_STEP, in order:
1. `git fetch origin main` — get the true current state.
2. Check `gh pr checks 248/249/192` — if green, `gh pr merge <n> --squash
   --delete-branch` each individually (sequentially, not batched).
3. Try UX-001's production deploy once more (command below) — the
   classifier's denials are non-deterministic (UX-002 hit the identical
   denial earlier this mission and succeeded on a later retry); if denied
   again, stop and let Dave run it or re-authorize.
4. Once deployed, live-verify production the same way BACKUP was verified,
   merge PR #277, confirm deployed bundle == merged `main`.
5. Fix #105's test wait-condition (or ask Dave whether to), then merge.
6. Give #188/#189/#190/#20/#39/#88/#191 a real compatibility pass (changelogs,
   local install + smoke) before merging any of them — do not merge on
   green CI alone for a major bump.
7. Triage the new Dependabot "1 high" alert.

BLOCKERS:
- **Production deploy denied by the sandbox classifier this pass**,
  reason `[Production Deploy]` — real and repeatable this pass (not the
  transient "no verdict" error also seen and successfully retried
  elsewhere). UX-001's deploy command is ready to run, just blocked.
- Same standing rule as before: production function/schema/security
  writes need explicit human authorization — not applicable to anything
  new this pass (SEC-001/SEC-002 untouched, no schema change proposed).

PRODUCTION_WRITES_PENDING:
1. UX-001's production deploy —
   `npx base44@0.1.14 site deploy --app-id 6a62213cff3ccbca88c04ff5 --no-build --yes`
   from the worktree at
   `/tmp/claude-1000/-home-hiker123-oohearth/ce10a67d-9c1c-4084-8620-7f4df1930114/scratchpad/fix-hover-emphasis`
   (already built for production, app-id confirmed baked into the entry
   file). Blocked this pass — see BLOCKERS.

HUMAN_AUTHORIZATION_PENDING:
1. UX-001's production deploy (frontend-only, BACKUP-verified, blocked by
   sandbox not by any remaining engineering question).
2. UX-004's fix direction — get the free Carto API key (recommended, see
   `QUEUE.md`) or decline.
3. Whether `fix/production-app-binding` (funnel/attribution branch) is
   still wanted.
4. Whether #105's test gets fixed in this engagement or left for Dave.
5. Whether the #188/#189/#190/#20/#39/#88/#191 major-version dependency
   bumps get a dedicated compatibility investigation pass, and when.
6. Triage of the new Dependabot "1 high" alert.

DO_NOT_TOUCH:
- `feat/weather-context-v1` (the working directory's own checked-out
  branch) — dirty, user-owned, unrelated TrueCost/UPC-scanner work in
  progress. Never reset/switch/clean/delete it. All real work happens in
  fresh worktrees off `origin/main`.
- `LabAdmin.jsx`/`CareersAdmin.jsx`/`Plans.jsx`/`PortalOps.jsx` — evidence-
  deferred from react-query migration for specific, real reasons (see
  `DECISIONS.md`). Don't touch without new architectural evidence.
- Do not implement UX-004 before Dave has the Carto API key in hand.
- Don't merge #188/#189/#190/#20/#39/#88/#191 on green CI alone — they are
  real major-version bumps, not patches; they need a compatibility pass.

READ_NEXT_IF_NEEDED:
- `docs/ops/ooh-earth/04-SECURITY-QUEUE.md` — SEC-001/SEC-002 full writeup
  (historical, closed).
- `QUEUE.md` — UX-001/UX-002/UX-004/GIT-001 full detail, this is the
  primary working doc.
- PR #277's own description for UX-001's full verification detail.
- PR #254's own description + diff for the Lynxie executor security fix,
  if re-reviewing that reasoning.
