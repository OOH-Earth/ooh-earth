# NOW — current truth only

Last verified: 2026-09-25 (fresh `git fetch` + live Base44 reads, this pass).
Re-verify anything here that's more than a few days old before acting on it.

## CURRENT_ORIGIN_MAIN
`e6ac4ece6b623eebf2646373bde977f7ff0f6c22` — "fix(map): crisp retina map
pins + clear the 24px touch-target minimum (#276)" — fresh `git fetch
origin main`, 2026-09-25 (this pass, before this pass's own GIT-001 merges
of #217 and #254 — re-fetch before trusting a specific hash later).

## PRODUCTION_FRONTEND
`oohearth.app` → app id `6a62213cff3ccbca88c04ff5` → entry
`index-DGky2tX2.js` (UX-002's build). **Does not yet include UX-001**
(PR #277, hover/focus emphasis) — that production deploy attempt was
denied by the sandbox's own auto-mode classifier (`[Production Deploy]`),
not a transient error; see `CURRENT_RELEASE_BLOCKERS`.

## BACKUP_FRONTEND
`ooh-earth-backup.base44.app` → app id `6a6748e009b947cb29591871` → entry
`index-gkrKNNwa.js` — includes UX-001. Verified live via real (non-synthetic)
browser hover/focus events, 2026-09-25: row border+background change to the
theme's `--c-flare` token, matching marker hover-ring appears at the correct
location, both clear on leave/blur, keyboard focus produces the identical
accessible treatment. Mobile smoke (412×915, DPR 2.6) — no regression.

## ENTITY_SCHEMA_STATE
24/24 entities match by name across production/BACKUP/`origin/main`. Every
named security invariant (see `INVARIANTS.md`) verified byte-identical across
all three, 2026-09-25. No drift. (Not re-checked this pass — no schema/entity
change was made or proposed.)

## FUNCTION_STATE
`origin/main` = 39 real functions. Production has all 39, `scanAd` and
`migrateLocationImages` now match `origin/main` exactly (see
`CURRENT_SECURITY_GAPS`). BACKUP has 38 (missing `cleanupIntelCache` only —
low-risk, not investigated further, unchanged this pass).

## OPEN_P0
None.

## CURRENT_SECURITY_GAPS
**NONE OPEN.** SEC-001/SEC-002 closed and deployed to production 2026-09-25
(prior pass) — see `docs/ops/ooh-earth/04-SECURITY-QUEUE.md`'s "FIXED AND
DEPLOYED" entry (full public writeup, safe since the fix is live
everywhere). Not re-touched this pass.

**New, unrelated finding this pass (not investigated further — out of this
pass's scope):** `git push` on PR #277 surfaced a GitHub Dependabot alert —
"1 high" severity vulnerability on the default branch
(`github.com/OOH-Earth/ooh-earth/security/dependabot/22`). Not identified,
not triaged. Add to the queue as a new item if it isn't already tracked.

## CURRENT_RELEASE_BLOCKERS
- **Production deploy is explicitly denied by this session's sandbox
  auto-mode classifier**, reason `[Production Deploy]` — this is a real,
  repeatable denial (confirmed via retry per the classifier's own
  transient-vs-real distinction), not the transient "no verdict" failure
  mode seen elsewhere this pass. UX-001 (PR #277) is BACKUP-deployed,
  verified, and merge-ready, but its production deploy needs a human (Dave)
  to run `npx base44@0.1.14 site deploy --app-id 6a62213cff3ccbca88c04ff5 --no-build --yes`
  from the built worktree, or to explicitly re-authorize a session for it.
  UX-002's identical command DID succeed on retry earlier this same
  mission — this denial is not a fixed, permanent policy; it may or may
  not clear on a later attempt, so it's worth one retry before assuming a
  human must act, but don't loop on it.
- `gh pr merge` / branch-update classifier behavior is inconsistent day to
  day — verify live each time, don't assume from a prior session's notes.

## CURRENT_PRODUCT_DECISIONS (awaiting Dave, not re-litigated)
- AdObservation (multi-brand data model): recommended, deferred, low
  urgency — see `docs/ops/ooh-earth/09-MULTI-BRAND-DATA-MODEL.md`.
- Founding Profile directory: deferred, URL-only stays current —
  `docs/ops/ooh-earth/10-FOUNDING-PROFILE-DISCOVERY.md`.
- `fix/production-app-binding` branch (funnel/attribution feature, never
  opened as a PR): needs a decision on whether it's still wanted before
  anyone invests in reviving it.
- **UX-004** (Carto tile watermark): decision package complete, see
  `QUEUE.md` — recommended direction is Option A (get the free Carto API
  key). Awaiting Dave to obtain the key; do not implement before then.

## CURRENT_UI_FEEDBACK (Dave — see `DAVE.md` for detail)
- **UX-001** (hover/marker emphasis): CLOSED (implementation) — see
  `QUEUE.md`. BACKUP-verified, PR #277 open, production deploy blocked
  (see above).
- **UX-002** (marker/icon quality): CLOSED — production-deployed, PR #276
  merged, deployed bundle confirmed == merged `main`.
- **UX-003** (results-list "disappearance"): CLOSED, not a bug — correct
  empty-viewport state.
- **UX-004** (Carto watermark): decision package complete, awaiting Dave's
  API key (see above).
- Overall Dave read: "good shape really" — not a redesign request.

## NEXT_TASK
GIT-001 (see `QUEUE.md`): this pass merged #217 and #254 (security
read-through passed). #248/#249/#192 branch-updated, CI in flight. #105 and
#188 investigated — NOT simple flakes, see `QUEUE.md` for what was actually
found (a real test bug in #105's own new test; #188 misclassified as a
patch bump when it's actually major framer-motion 12→13). #189/#190 still
untouched (real conflicts, don't force-resolve). #254's own further-out
sibling PRs and the `rnd/*`/draft/dependency-major PRs remain deferred as
before. UX-001 needs: PR #277 merged once CI is green, then a human to run
the production deploy.

## NEXT_PRODUCTION_WRITE
One pending: UX-001's production deploy (`npx base44@0.1.14 site deploy
--app-id 6a62213cff3ccbca88c04ff5 --no-build --yes`, worktree already built,
on disk at
`/tmp/claude-1000/-home-hiker123-oohearth/ce10a67d-9c1c-4084-8620-7f4df1930114/scratchpad/fix-hover-emphasis`)
— blocked by the sandbox this pass, needs Dave or a re-authorized session.

## HUMAN_CHECKPOINT
Dave needs to: (1) run or re-authorize UX-001's production deploy (command
above), (2) pick UX-004's fix direction / obtain the free Carto API key,
(3) decide on `fix/production-app-binding`, (4) be aware of the new
Dependabot "1 high" alert on `main` (untriaged), (5) decide whether #105's
new test should be fixed (deterministic bug, not a flake) before merging,
and whether #188/#189/#190/#20/#39/#88/#191 (all real major-version bumps)
get a dedicated compatibility pass.
