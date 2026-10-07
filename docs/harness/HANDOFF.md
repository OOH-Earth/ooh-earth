# Resumption instructions

1. Read `AGENTS.md`, the available release/operations documents, and all files in `docs/harness/`; note that `plan.md`, `brain/PRODUCT.md`, and `brain/INVARIANTS.md` are absent.
2. Check worktrees, processes, git status, `origin/main`, PR #336, and exact-head CI. Do not touch `/home/hiker123/oohearth` dirty weather work.
3. Merge `origin/main` into this isolated branch only after inspecting each conflict. Preserve pilot privacy/evidence/request controls and the qualified dependency fixes; review newer main changes individually.
4. Run local adapter, typecheck, lint, build, security, and focused browser checks. Push the final exact head and dispatch/wait for CI and CodeQL.
5. If source or built artifact differs from `7b0dbda`, deploy frontend only to BACKUP with explicit app ID `6a6748e009b947cb29591871`, verify target and live hash, then repeat responsive focused QA. Never deploy production.

Human action is not currently required. If a classifier blocks a deploy or merge action, stop and report that exact action; do not route around it.
