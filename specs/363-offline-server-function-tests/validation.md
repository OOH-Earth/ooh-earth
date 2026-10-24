# 363 validation
Candidate: PR #363 head `6bf5a982712d10582e79cc3c481720b182228314`, tree `a3070b81061a7354425c2ff3372bb1c271bd5b73` (one commit on `main` @ `b65dde8`). Date: 2026-10-24. Nothing merged or deployed.

| Req | Check | Environment | Actual evidence | Result |
|---|---|---|---|---|
| R4 | `git diff origin/main` on the refreshed head touches only `ci.yml` (+2 lines) and `package.json` (1 line); rebase onto `main` was conflict-free; a trial merge earlier (before `main` moved) was also clean | local | diff stat 2 files, 3+/1−; rebase "Successfully rebased" | pass |
| R2 R5 | `npm run test:server-functions` = `deno test --no-check --allow-read=base44/entities base44/functions/tests/` | local (offline) | 72 passed / 0 failed (8 s); 9 files in the directory; the "failed: Error" lines in the output are expected error-path logging inside passing tests | pass |
| R1 R3 R5 | Real `pull_request` CI run on the exact head | CI (`pull_request`) | https://github.com/OOH-Earth/ooh-earth/actions/runs/40084355664 — all 8 jobs success (job names unchanged) | pass |
| R1 | Negative control: throwaway branch (head `fc21ec3` = `6bf5a98` + one intentionally failing `*.test.ts`), `workflow_dispatch` (not a PR) | CI (dispatch) | https://github.com/OOH-Earth/ooh-earth/actions/runs/40084379517 — *Lint & Typecheck* **failed at step "Server function tests (offline, no credentials)"**; Typecheck/Lint skipped; other jobs green. Branch deleted afterwards; never a PR | pass (failure propagates) |
| guard | `npm run test:ci-workflow-guard` on the refreshed head (next to the merged guard step) | local | 11/11 | pass |

Limits: tests are mocks — they prove offline logic, not live Base44 behaviour; `--no-check` skips type-checking; the broader scope (whole `tests/` directory) is as originally authored (spec Q1 open); wall-time impact measured locally only (8–14 s), not from CI timings. No branch-protection change; no deploy.
Review state: **not reviewed**; owner decision on Q1 + normal review required before merge. Release state: CI-only change, no app deploy needed.
