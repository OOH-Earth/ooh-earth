# Engineering history — chronology and retrospective decision records

Index only. Each record separates the **decision date** (when the decision was made, or UNKNOWN) from the **documentation date** (when this entry was written). Original release/incident evidence is kept in access-controlled records outside this repository (not linked, to avoid publishing private detail); earlier incident history is in `docs/ops/ooh-earth/`. Nothing here is invented: anything not traceable is marked **UNKNOWN**. Retrospective entries record what the evidence shows, not an agreement that was never made.

## Chronology (verified from GitHub, 2026-10-24)

| Date (UTC) | Event | Evidence |
|---|---|---|
| 2026-10-21 | R1M2 credibility/demo-readiness (frontend only) merged to `maintenance/production-2026-10-02` | #368 → `6ce2010` |
| 2026-10-22 | R1M3: unsupported claims removed, GIF uploads rejected, price strip dropped | #369 → `94c79fa` |
| 2026-10-23 | Live-feed overlap fix + DOMPurify 3.4.17 (maintenance); production frontend deploy of `f062e0d` | #371, #372 → `f062e0d` |
| 2026-10-23 | CI + guard on maintenance; main dependency fixes; CI + guard on main | #374 `0ec2ced`, #376 `ee75604`, #378 `61a7be5`, #375 `b65dde8` |

## Decision record template (use for new significant decisions; then add the active ones to `brain/DECISIONS.md`)

`ID · Title · Status (proposed/accepted/superseded/rejected) · Decided (date or UNKNOWN) · Documented · Authority · Context/evidence · Options · Decision & tradeoffs · Validation/rollback · Links`

## Retrospective decision records (RDR)

**RDR-0001 · Base44 is the runtime; GitHub is the engineering mirror.** Accepted (in force). Decided: UNKNOWN. Documented 2026-10-24. Authority: owner (as written in `AGENTS.md` rule 1 and `ENGINEERING-WORKFLOW.md`). Evidence: those two files. Options/rationale beyond the files: UNKNOWN. Consequence: deploys go through the Base44 CLI/platform; no competing deploy target.

**RDR-0002 · Production runs from a maintenance branch, not from `main`.** Accepted (in use). Decided: UNKNOWN (first maintenance release train recorded in private notes, October 2026). Authority: owner instruction per release. Evidence: `maintenance/production-2026-10-02`; PRs #365 #368 #369 #371 #372 #374 #376. Rationale: `main` carries unreleased backlog that must not ship by accident. Consequence: fixes are cut from the maintenance tip; `main` receives equivalent changes separately (e.g. #378, #375). Risk: the two branches drift (see RDR-0005).

**RDR-0003 · Qualify the exact artifact on BACKUP, prove the runtime target, keep a rollback artifact.** Accepted as practice; tooling partly **PROPOSED**. Evidence: `brain/INVARIANTS.md`, `brain/ENVIRONMENTS.md`, `docs/RELEASE_RELIABILITY_SYSTEM.md`; applied in #368/#369/#371+#372 (tree equality to the qualified tree, app-id in the HTML-referenced entry bundle, checksum reconciliation of live assets, previous production build saved). Gap: the frontend-only verification scripts are not in version control; the in-repo release state machine targets backend/function certification. Follow-up (not started): bring a read-only verifier + fixtures into `scripts/`.

**RDR-0004 · Run full CI on PRs into `maintenance/**`.** Accepted (owner authorized and merged via the normal path). Decided 2026-10-23. Context: `ci.yml` filtered `pull_request` to `main`, so maintenance PRs got only CodeQL and CI had to be dispatched by hand. Options: keep manual dispatch; add `maintenance/**` to the filter (chosen); run on every branch (rejected as costly/noisy — reasoning, not a recorded owner vote). Validation: PR-triggered green run on the PR itself (39981161710), a negative control (39980738618), and later PR-triggered runs (40000945603, 40004571175). Rollback: revert the one-line filter. Links: #374 #376 #375.

**RDR-0005 · The workflow guard is a limited text tripwire, not structural validation.** Accepted (owner reviewed and merged). Decided 2026-10-23. Options: `actionlint`/YAML parser (not adopted — no new dependency/service; not formally rejected by the owner); text scan of `ci.yml` only (chosen). Limits are stated in `scripts/ci-workflow-guard.mjs`; it enforces the agreed CI policy only (no privileged triggers, no repo secrets, pinned actions, write-scope allowlist, maintenance trigger, no `write-all`) and is not proof of least privilege. Authoritative evidence remains a real PR-triggered run. Links: #374 #376.

**RDR-0006 · Non-atomic duplicate risk is not accepted; R2 stays held.** Status: held. Decided: UNKNOWN (owner clarification restated 2026-10-24). Documented 2026-10-24. Authority: owner, in this engagement (private session instruction). Clarification: there is **no blanket acceptance** of non-atomic duplicate-creation risk, and "R2" (the held first-user contribution-reliability release; related open PRs #360 and #362) remains held unless later evidence proves otherwise. Repository evidence found: only the inbound-email ledger limitation documented on the unmerged branch `feat/inbound-email-forward` (a read-then-send daily cap is best-effort, not strict). A broader written "non-atomic mutation" policy: **UNKNOWN — not found in the repository**.

**RDR-0007 · Infrastructure migration is deferred; Agent OS / provider / scheduler freeze.** Status: deferred / in force. Decided: UNKNOWN. Documented 2026-10-24. Authority: owner instruction from this engagement (restated 2026-10-24). Evidence: `BASE44_MIGRATION_PLAN.md` and the `docs/RELIABILITY_CONSTITUTION.md` infrastructure test (need a demonstrated problem). **Repository provenance of the freeze is unverified:** a search of `AGENTS.md`, `brain/`, `docs/`, `plan.md` and `CLAUDE_CONVERGENCE_STATE.md` on `main` (2026-10-24) found no document that records it. Treat it as an owner instruction until the owner points to or adds a source.

**RDR-0008 · UI simplification preserving colours, design identity and mission.** Status: authorized in principle; implementation pending. Decided 2026-10-24 or earlier (exact date UNKNOWN). Documented 2026-10-24. Authority: David (product owner) authorized UI simplification while preserving colours, design identity and mission, as relayed by the engineering owner. Scope limit: **exact content removals remain subject to evidence and scope** — the authorization is not a blanket licence to delete. Evidence in repo: none yet — a UI-audit branch exists locally and is unpushed; `docs/design/UI-STANDARDS.md` is not on `main`.

**RDR-0009 · Inbound email integration stays inactive until prerequisites are met.** Accepted as a hold (owner instruction, October 2026; exact date UNKNOWN). Evidence: unmerged branch `feat/inbound-email-forward` (design docs and an inert function with tests); function not deployed on production or BACKUP when checked 2026-10-22. Prerequisites: schema reconciliation of the existing `ForwardedEmail` entity, secret provisioning, webhook creation, an authorized test, and a sender-policy decision. Not activated; allowlist not removed.
