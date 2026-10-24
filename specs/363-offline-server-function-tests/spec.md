# 363 Offline server-function tests in CI — spec
Owner: engineering owner (AdilQuantum) · Status: pilot, **draft** · Date: 2026-10-24 · Evidence baseline: `main` @ `b65dde8` (CI + guard merged); PR #363 head `60b6d01` (based on older `main` `e1b979d`), local run on that head: 72 passed / 0 failed / 14 s.

## Problem and outcome
`npm run test:server-functions` runs only `base44/functions/tests/security.test.ts` and is **not run in CI**, so the other offline server-function tests (8 more files today) can regress unnoticed on any PR. Outcome: the same offline Deno suite #363 proposes runs on every PR, with no credentials and no network.

## In scope
- One CI step, inside the existing *Lint & Typecheck* job (no new job, so required-check names do not change), running `npm run test:server-functions`.
- The command exactly as #363 authored it: `deno test --no-check --allow-read=base44/entities base44/functions/tests/` (every `*.test.ts` in that directory).
- Bringing #363 up to date with current `main` as a reviewable PR.

## Non-goals
- Adding, editing or rewriting any test; adding other directories; running anything against Base44, BACKUP or production; adding `--allow-net`/`--allow-env`/secrets.
- Changing branch protection or required checks; merging #363; deploying anything.
- Type-checking the functions (`typecheck:functions` is separate; `--no-check` stays as authored).

## Requirements
| ID | Requirement (observable) | Status |
|---|---|---|
| R1 | A PR into `main` runs `npm run test:server-functions` in CI, and a failing server test fails the *Lint & Typecheck* job | proposed |
| R2 | The suite runs with read access limited to `base44/entities` and no network/env permissions | proposed (as authored in #363) |
| R3 | Job and required-check names are unchanged | proposed |
| R4 | The refreshed PR contains only the `ci.yml` step and the one `package.json` script line; it applies cleanly on current `main` next to the workflow-guard step | proposed |
| R5 | The suite passes on the refreshed head (offline) | proposed |

## States
Pass → job continues to typecheck. Fail → job fails at the step with the Deno output (no retry). Missing Deno binary → `npm ci` provides it (devDependency); a failure there is a visible job failure, not a skip.

## Privacy / security / data
No secrets, no live backend, no production data. Tests use mocks. `--allow-read` is scoped to the entities directory.

## Assumptions and open questions
- ASSUMPTION: the owner wants the whole `tests/` directory (what #363 authored), not only `security.test.ts`. **Q1 (owner):** keep the directory, or narrow to `security.test.ts` (today's `main` behaviour)? Blocks only the *merge decision*, not this validation.
- ASSUMPTION: ~14 s extra CI time inside an existing job is acceptable.

## Success measures · not measurable
Measurable: green/red of the step per PR; wall time of the step. Not measurable now: how many real regressions it will catch.

## Approval gates
Owner review of #363 + answer to Q1 before merge. No deploy, no schema, no cost. Branch protection unchanged.
