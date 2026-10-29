# founder-experiment-process — spec
Owner: David (sponsor) · Status: draft proposal · Date: 2026-10-28 · Evidence baseline: `origin/main` 065ecf8

## Problem and intended outcome
David wants to experiment with a gamification/interaction idea on Base44 without risking production or the shared qualification BACKUP. Outcome: a reviewed process for one bounded experiment. **No experiment app is created or activated by this spec.**

## In scope / explicit non-goals
In: isolation rules, budget and stop conditions, promotion path. Out: building the experiment, any change to production or BACKUP, new vendors or infrastructure, Supabase or any migration.

## Requirements
| ID | Requirement (observable) | Status |
|---|---|---|
| R1 | Experiment runs in its own Base44 app, never production and never the shared release BACKUP | proposed |
| R2 | Before first use, verify and record isolation: separate entities/data, no copied secrets or API keys, no shared functions, no automations/schedules pointing at production, no GitHub sync to the production repo or branches | proposed |
| R3 | Synthetic data only; no production records, user data or real identities | proposed |
| R4 | One interaction hypothesis with written acceptance criteria before building (ASSUMPTION: concrete example pending from David) | proposed |
| R5 | Agreed builder-credit and runtime-credit budget; stop conditions: budget reached, any paid AI call not explicitly enabled, any isolation check failing, or a production reference found | proposed |
| R6 | No public unsupported claims and no automatic spending; AI generation off by default | proposed |
| R7 | Promotion only by source review: export to a git branch, normal PR, CI, BACKUP qualification, then the production release controls | proposed |

## Privacy / security / data implications
Anonymous AI endpoint exposure exists on production (see `specs/devops-reference-adoption/`); an experiment app must be assumed to have the same exposure, so R6 is a hard rule.

## Dependencies · assumptions · open questions
- Q1 (blocks R4): David's concrete interaction example.
- Q2: reference to David's DevOps guide.
- Q3 (blocks R5): who sets the credit budget and who can read the dashboard.
- Deploy/recovery access owners: **unconfirmed**; record only after each person verifies.

## Success measures · what cannot currently be measured
Isolation checklist complete and dated; credits used vs budget. Value of the idea is not measurable until a hypothesis exists.

## Approval gates
David approves this spec and the budget before an app is created. Any promotion to production follows the normal gates.
