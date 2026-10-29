# devops-reference-adoption — spec
Owner: unassigned · Status: draft · Date: 2026-10-28 · Evidence baseline: `origin/main` 065ecf8; #384 head 5c81a80 (open, not merged); production identity **not re-verified in this task** (see U1)

## Problem and intended outcome
An external "OOH Earth DevOps Operating Guide" was supplied as a research reference. The guide (v1.1 PDF) was supplied later the same day; its reconciliation is in `docs/engineering/DEVOPS-REFERENCE.md`. This spec keeps the repo-evidenced practice map and priority gaps. The guide is PROPOSED reference only; none of its recommendations are treated as implemented.

## In scope / explicit non-goals
In: a practice mapping, prioritised gaps, bounded follow-up specs. Out: new infrastructure, vendors, dependencies, migrations, tracking, scheduled jobs; billing or security-setting changes; any change to the active #384 frontend release; the Agent OS freeze (preserved, untouched). No uptime, compliance, savings or ROI claims.

## Labels
VERIFIED = observed this session or recorded with a re-checkable artifact · REPORTED = stated in a repo record or by a person, not re-checked · PROPOSED = not implemented · UNKNOWN = no evidence available.

## Practice mapping
| # | Practice | Existing implementation / evidence | Label | Gap | Priority | Owner | Acceptance check |
|---|---|---|---|---|---|---|---|
| 1 | Required CI before merge | `main`: Lint/Typecheck, Build, Playwright ×2, audit, Dependency Review, CodeQL, Prettier; strict, linear, 0 approvals (`SPEC.md` line 32); #384 shows all green on 5c81a80 | VERIFIED (CI on #384) / REPORTED (branch protection read 2026-10-23) | `maintenance/**` unprotected; 0 required approvals | P2 | engineering (GitHub admin) | Protection settings re-read and recorded with date |
| 2 | Deployed identity independent of branch tips | `brain/ENVIRONMENTS.md` gives app ids and entry-file app-id check; prior releases recorded live-asset reconciliation | REPORTED | No current-session proof that production serves `f63fdb1`; frontend verification scripts are not in version control (`SPEC.md` line 31) | P1 | engineering | Fetch HTML-referenced entry asset, hash it, compare to the reviewed build; record hash and time |
| 3 | Production deploy and recovery ownership | None recorded; deploys have needed fresh human authorization | UNKNOWN | Who can deploy, who can restore, who holds Base44 account/billing/recovery | **P0** | David (to confirm) | Names/roles listed in `brain/ENVIRONMENTS.md` (no secrets), each confirmed by that person |
| 4 | Anonymous high-cost AI endpoint control | #384 PR body: `InvokeLLM` still accepts anonymous calls; removing call sites is not protection; provider limits unknown | REPORTED | No platform-side control known | **P0** | David + engineering | Separate spec: confirm available Base44 controls/limits; anonymous call from a fresh context is rejected or bounded, recorded |
| 5 | Recoverability beyond frontend mirrors | Frontend rollback artifacts per release in `~/ooh-release-records` (local); entity/function source in git | REPORTED | Data (entity records), secrets inventory, and Base44 account recovery have no recorded restore test; release records are on one machine | P1 | David | A dated restore/export procedure exists for data and is tested read-only on BACKUP |
| 6 | Core contribution permission/persistence evidence | Prior security tests on BACKUP (user RLS, moderation bypass) recorded in decision log; no test identity exists on production | REPORTED | Anonymous/authenticated submit→persist→review-status not evidenced end-to-end on current production | P1 | engineering | Controlled BACKUP journey with synthetic data recorded; production check only with owner approval |
| 7 | Comparable Base44 credit samples | Earlier dated samples exist in the usage ledger (guide cites production 319.31 at 2026-10-25 18:56 UTC: AI 240, functions 79.31); #384 itself has request counts only | REPORTED | **Correction (2026-10-28):** earlier samples exist; missing is a comparable post-release sample | P1 | David (dashboard access) | Samples per the #384 measurement plan, with lag and test-traffic caveats stated |
| 8 | Isolated founder experimentation | None; BACKUP is the shared qualification preview | PROPOSED | See `specs/founder-experiment-process/` | P2 | David | That spec approved; app not created until then |
| 9 | Spec-driven change records | `SPEC.md`, `specs/`, `docs/engineering/*` (merged via #382) | VERIFIED (on `main`) | Adopted by use, not formally approved | P3 | David | Owner approval recorded |

## States: loading · empty · invalid · denied · failed · recovery
Not applicable (documentation). Denials from merge/deploy classifiers are stops, not routed around.

## Privacy / security / data implications
No secrets, tokens or credentials in any record. Ownership rows name roles until confirmed.

## Dependencies · assumptions · open questions
- U1: closed 2026-10-28 — production served `1dbddda` (#384) after release; see DEVOPS-REFERENCE.md.
- Q1: closed — guide supplied; see `docs/engineering/DEVOPS-REFERENCE.md`.
- Q2: Who are the deploy/recovery owners? Blocks row 3.

## Success measures · what cannot currently be measured
Gap count by label over time. Cannot be measured today: uptime, compliance, credit cost, savings.

## Approval gates
Owner review of this spec. Follow-up specs for rows 3–7 each need their own owner gate; row 4 and 5 touch security/data and need an explicit approval before any change.
