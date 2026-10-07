# Resumption instructions

1. Read `AGENTS.md`, `brain/PRODUCT.md`, `brain/INVARIANTS.md`, `brain/QUEUE.md`, available release/operations documents, and all files in `docs/harness/`. Check actual file presence; old reports of missing files are historical.
2. Check worktrees, processes, git status, `origin/main`, PR #336, and exact-head CI. Do not touch `/home/hiker123/oohearth` dirty weather work.
3. Inspect the current branch and main before further reconciliation. Main `fe319072f47c756e4e6d936b7b621baafb045feb` merged cleanly in the isolated 2026-10-07 pass; do not repeat a merge or overwrite newer work blindly. Preserve pilot privacy/evidence/request controls and qualified dependency fixes. The owner's two unpublished documentation commits remain uninspected.
4. Run local adapter, typecheck, lint, build, security, and focused browser checks. Push the final exact head and dispatch/wait for CI and CodeQL.
5. If source or built artifact differs from `7b0dbda`, deploy frontend only to BACKUP with explicit app ID `6a6748e009b947cb29591871`, verify target and live hash, then repeat responsive focused QA. Never deploy production.

Human action is not currently required. If a classifier blocks a deploy or merge action, stop and report that exact action; do not route around it.

Keep the frozen production candidate `a1868f122aa965fd96ab023492bed62470fb1106` separate from current main. Do not reuse the older #322-only script for a different candidate. Authentication failure, DNS/timeout, merge conflict, CI failure and missing deploy evidence are distinct states. Use a working authorised GitHub connector when available; never copy credentials between tools.
