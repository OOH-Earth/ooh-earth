# 363 tasks
| # | Task | Covers | Files | Acceptance check | Depends on | Status / evidence |
|---|---|---|---|---|---|---|
| T1 | Inspect #363's real command, files and current `main` script | R2 R4 | read-only | command + 9 files + diff recorded in spec | — | done (spec baseline) |
| T2 | Rebase #363 onto current `main` | R4 | ci.yml, package.json | diff = the two edits only; applies next to guard step | T1 | done — `6bf5a98` |
| T3 | Run suite locally on refreshed head | R2 R5 | — | 0 failed | T2 | done — 72 passed |
| T4 | Exact-head `pull_request` CI | R1 R3 R5 | — | all jobs green | T2 | done — run 40084355664 |
| T5 | Negative control on a throwaway branch (not a PR): add a deliberately failing server test, dispatch CI | R1 | throwaway only | step fails, job fails, nothing merged | T2 | done — run 40084379517 |
