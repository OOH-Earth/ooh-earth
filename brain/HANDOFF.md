# HANDOFF — read this first

LAST_UPDATED: 2026-09-25

CURRENT_MAIN: `0ed56883257f2ba684891b6380d21d70000e0adb` (verify with
`git fetch origin main` — don't trust a hash quoted in a prompt without
checking).

CURRENT_TASK: built `brain/` (this system) + landed it and the full
`docs/ops/ooh-earth/` archive on `origin/main` for the first time (neither
existed there before — see DO_NOT_TOUCH below for why). Then working
GIT-001 (fresh PR re-audit) and starting UX-003/UX-004 reproduction.

CURRENT_STATUS: in progress — see `QUEUE.md` for exact per-item state.

LAST_COMPLETED:
- `brain/` created (this file + README/NOW/QUEUE/INVARIANTS/ENVIRONMENTS/
  RELEASE/TEST/DECISIONS/KNOWN-ISSUES/DAVE).
- `docs/ops/ooh-earth/` (11 files) copied into a fresh worktree off
  `origin/main` alongside `brain/`, committed, PR opened.

NEXT_COMMAND/STEP: check whether the `docs/brain-and-ops-sync` PR merged or
was blocked by the sandbox classifier (same "Merge Without Review" pattern
seen on the earlier 12-PR batch); if blocked, it needs a human merge like
the others. Then continue GIT-001's fresh per-PR audit, then UX-003/UX-004.

BLOCKERS:
- Production function deploys (SEC-001/SEC-002) need Dave's explicit
  authorization — prepared, not executable autonomously here.
- `gh pr merge` was denied by this session's sandbox classifier for a
  batch merge; unknown yet whether a single-PR merge (the brain/docs PR)
  will be denied too — check the actual result, don't assume either way.

PRODUCTION_WRITES_PENDING: `scanAd` + `migrateLocationImages` redeploy
(SEC-001/SEC-002) — commands prepared in
`docs/ops/ooh-earth/04-SECURITY-QUEUE.md`, not run.

HUMAN_AUTHORIZATION_PENDING:
1. SEC-001/SEC-002 production function redeploy — highest priority.
2. GIT-001's PR merges, if the sandbox blocks them again.
3. Whether `fix/production-app-binding` (funnel/attribution branch) is
   still wanted.

DO_NOT_TOUCH:
- `feat/weather-context-v1` (the working directory's own checked-out
  branch) — dirty, user-owned, unrelated TrueCost/UPC-scanner work in
  progress. Never reset/switch/clean/delete it. All real work happens in
  fresh worktrees off `origin/main`.
- `LabAdmin.jsx`/`CareersAdmin.jsx`/`Plans.jsx`/`PortalOps.jsx` — evidence-
  deferred from react-query migration for specific, real reasons (see
  `DECISIONS.md`). Don't touch without new architectural evidence.
- Do not deploy `scanAd`/`migrateLocationImages` to production without
  Dave's explicit go-ahead, however well-qualified the fix looks.

READ_NEXT_IF_NEEDED:
- `docs/ops/ooh-earth/04-SECURITY-QUEUE.md` before touching SEC-001/SEC-002.
- `docs/ops/ooh-earth/01-PRIORITY-QUEUE.md` "LANE A" before touching GIT-001
  — re-verify each PR fresh, don't blindly trust the old list.
- `docs/ops/ooh-earth/06-EVIDENCE-LOG.md` for the exact method used on any
  of the above, if you need to redo or extend it.
