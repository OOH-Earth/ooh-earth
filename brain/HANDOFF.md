# HANDOFF — read this first

LAST_UPDATED: 2026-09-25 (loop #2 complete — SEC closed, UX-001 AND UX-002
both shipped to production, GIT-001 further progressed incl. a HIGH-sev
dependency CVE fix)

**SEC-001, SEC-002, UX-001, UX-002, UX-003 are all CLOSED.** Treat
everything about them below as historical, not pending. UX-004 has a
completed decision package awaiting Dave's action (get a free API key).

CURRENT_MAIN: verify fresh with `git fetch origin main` — this pass merged
#217, #277 (UX-001), #254, #248 on top of the prior pass's #275/#276.
Don't trust a quoted hash without re-fetching.

CURRENT_TASK complete this pass:
1. **UX-001** (results-row ↔ marker hover/focus emphasis) — fully shipped:
   root-caused via git history (never existed before — a gap, not a
   regression), implemented across `Globe3D.jsx`/`LocationMap.jsx`/
   `LocationCard.jsx` using the theme's existing `--c-flare` token, shared
   logic extracted to `src/lib/hoverEmphasis.js` with 9 unit tests. BACKUP-
   verified with real (not synthetic) browser events. PR #277 merged.
   Production deploy was denied once by the sandbox classifier
   (`[Production Deploy]`) then **succeeded on retry** — live-verified on
   real production data (786 locations): hover → `rgb(255, 0, 200)` row
   border + map hover-ring at the correct marker, screenshot evidence, no
   new console errors.
2. GIT-001 (fresh-queried, not assumed from old notes): merged #217, #254
   (Lynxie executor checkout-trust fix — real security read-through of the
   diff, see below), and **#248** (js-yaml patch bump that turned out to be
   the exact fix for a HIGH-severity GitHub Dependabot alert, found and
   confirmed mid-pass via the GitHub API, not assumed from the PR title —
   prioritized once found). **#249 is CI-green, ready, just needs one more
   update-branch+merge cycle** (each of the above merges put it BEHIND
   again). #192 branch-updated once but not re-verified since this pass
   ended. Two corrections to the PRIOR pass's assumptions, both real:
   - **#105** ("footer touch targets") — its own new Playwright test fails
     deterministically (3/3 retries), not a flake: `footer ul a` locator
     count is `0`. The actual `SiteFooter.jsx` fix looks correct; the test
     itself likely queries before the SPA hydrates
     (`waitForLoadState('domcontentloaded')` fires too early). Needs the
     test's wait condition fixed before merge.
   - **#188** ("bump framer-motion") — mislabeled a patch previously; it's
     actually framer-motion **12.43.0 → 13.2.0, a major version**. Its CI
     failure is in an unrelated pre-existing flaky test, not caused by the
     bump, but the major jump itself needs the dedicated compatibility
     pass already planned for #20/#39/#88/#191 — moved into that group, not
     merged on green CI. #189/#190 (also real conflicts) are also both
     majors on inspection — same caution now applies to them too.
3. Note: a Dependabot "1 high" alert surfaced while pushing this pass's own
   branch — identified (js-yaml, see above) and resolved via #248's merge;
   re-check the alerts endpoint to confirm it now shows closed.

CURRENT_STATUS: the safe, mechanical queue is essentially exhausted for
this pass. What's left needs either one more mechanical step (#249's
merge), a real decision (UX-004's key, `fix/production-app-binding`), or
deliberate follow-up investigation (#105's test bug, the major-version
dependency compatibility pass) rather than more autonomous processing.

NEXT_STEP, in order:
1. `git fetch origin main` — get the true current state.
2. `gh pr checks 249` — if green, `gh api
   repos/OOH-Earth/ooh-earth/pulls/249/update-branch -X PUT`, wait for CI,
   `gh pr merge 249 --squash --delete-branch`, then confirm with `gh pr
   view 249 --json state,mergedAt` (don't trust a clean exit code alone —
   this pass hit one silent merge failure that wasn't caught immediately).
3. Fresh-check #192's CI/mergeability, same pattern if green.
4. Fix #105's test wait-condition (or ask Dave whether to), then merge.
5. Give #188/#189/#190/#20/#39/#88/#191 a real compatibility pass
   (changelogs + local install + smoke) before merging any of them.
6. Confirm the Dependabot alert now shows resolved
   (`gh api repos/OOH-Earth/ooh-earth/dependabot/alerts/22`).

BLOCKERS: none currently active. (This pass's production-deploy denial for
UX-001 cleared on a later retry — same non-deterministic pattern seen with
UX-002 in the prior pass. Don't assume a denial is permanent; one retry is
reasonable, don't loop on it.)

PRODUCTION_WRITES_PENDING: none.

HUMAN_AUTHORIZATION_PENDING:
1. UX-004's fix direction — get the free Carto API key (recommended, see
   `QUEUE.md`) or decline.
2. Whether `fix/production-app-binding` (funnel/attribution branch) is
   still wanted.
3. Whether #105's test gets fixed in this engagement or left for Dave.
4. Whether/when the major-version dependency bumps get a dedicated
   compatibility investigation.

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
- `QUEUE.md` — UX-001/UX-002/UX-004/GIT-001 full detail, this is the
  primary working doc.
- `docs/ops/ooh-earth/04-SECURITY-QUEUE.md` — SEC-001/SEC-002 full writeup
  (historical, closed).
- PR #277's own description for UX-001's full verification detail.
- PR #254's own description + diff for the Lynxie executor security fix,
  if re-reviewing that reasoning.
