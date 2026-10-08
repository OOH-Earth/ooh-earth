# Resumption instructions (reconciled 2026-10-08)

1. Read `AGENTS.md`, `brain/PRODUCT.md`, `brain/INVARIANTS.md`, `brain/QUEUE.md`, `brain/NOW.md`, `plan.md`, all of `docs/harness/`, and docs 22-25 under `docs/ops/ooh-earth/`.
2. Re-verify against GitHub before acting: `git fetch`, current `origin/main`, the open PRs (#345, #348), and exact-head CI/CodeQL. Do not trust any SHA here over the live repository.
3. Never touch `/home/hiker123/oohearth` (dirty weather work) or the owner's unpublished commits; use isolated worktrees.
4. BACKUP qualification is run by the pinned script (`scripts/release/place-research-backup.sh`, doc 23): `validate` first, then `deploy` only through an authorized working context. Frontend-only, BACKUP app id `6a6748e009b947cb29591871`. Production app id `6a62213cff3ccbca88c04ff5` must never appear in a BACKUP build.
5. If a classifier denies an action, stop and report the exact action and reason. Do not re-read the denied evidence through another tool, host or encoding; give the owner the smallest review command instead.
6. Any change to the candidate's source needs a new pinned SHA, ancestry list, exact-head CI references and a fresh qualification. Old green runs and the existing BACKUP deployment never certify a new combination.

Production stays frozen at `a1868f122aa965fd96ab023492bed62470fb1106`. No production deployment, backend/schema/permission/data change, paid-service decision or publishing-policy change is authorized by this handoff.
