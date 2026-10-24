# Engineering workflow — lightweight, evidence-backed

Status: **PROPOSED process** (written 2026-10-24; adopted by use, not yet formally approved by the owner). It adds no tooling and no new rules of its own: it links the canonical documents below and describes the order of work. If anything here conflicts with `AGENTS.md`, `brain/INVARIANTS.md` or a recorded owner decision, those win.

## Where things already live (read these, do not duplicate them)

| Need | Canonical file | Notes |
|---|---|---|
| Agent/session rules | `AGENTS.md` (`CLAUDE.md` points to it) | rules 1–4 are enforced by convention/CI |
| Product direction | `brain/PRODUCT.md` | owner-set north star and social principles |
| Hard invariants (IDs, schema truth, deploys) | `brain/INVARIANTS.md` | "never regress" list |
| Current active decisions | `brain/DECISIONS.md` | closed/historical rationale: `docs/ops/ooh-earth/07-DECISION-LOG.md` |
| Environments | `brain/ENVIRONMENTS.md` | production vs BACKUP |
| Reliability principles / infra test | `docs/RELIABILITY_CONSTITUTION.md` | |
| CI jobs and decision register | `CI_PIPELINE.md` | |
| Release state machine | `docs/RELEASE_RELIABILITY_SYSTEM.md`, `RELEASE_PROCESS.md` | backend + function certification |
| Current work / queue | `plan.md`, `brain/NOW.md`, `brain/QUEUE.md` | |
| Evidence log | `docs/ops/ooh-earth/06-EVIDENCE-LOG.md` | append-only |
| UI standards | `docs/design/UI-STANDARDS.md` | **pending**: lives on the UI-audit branch, not on `main` yet |

New in this change: `docs/engineering/{CONSTITUTION,WORKFLOW,REVIEW-CHECKLIST,HISTORY}.md`, `specs/`, root `SPEC.md`.

## Lifecycle

requirements → design decisions → tasks → implementation → validation → reviewed release → maintenance

Scale the paperwork to the change:

| Change | Record needed |
|---|---|
| Typo, bounded copy fix, dependency lockfile bump | PR description with evidence only |
| Small behavioural fix (one component, one test) | `spec.md` (compact) + `validation.md` |
| Feature, new data/permission surface, multi-file UI flow | all four: `spec.md`, `plan.md`, `tasks.md`, `validation.md` under `specs/<id>-<short-name>/` |
| Anything touching production data, schema/RLS, secrets, billing | all four **plus** an owner approval gate recorded in the spec |

`<id>` is the GitHub issue/PR number when there is one. Copy `specs/_TEMPLATE/` and delete what the change does not need. Write a regression test first when it clarifies the fix; do not force TDD on trivial, reversible edits.

## Rules of use

1. **Spec before code for non-trivial work.** Assumptions stay labelled `ASSUMPTION`; they are not requirements. Critical ambiguity blocks only the tasks that depend on it.
2. **Requirement IDs are stable** (`R1`, `R2`, …). `tasks.md` and `validation.md` cite them.
3. **Validation records actual evidence**: exact SHA and tree, command, environment (local / mock / CI / BACKUP / production kept separate), result. Do not trust an agent's claim; inspect the diff, test output and rendered behaviour.
4. **At completion compare code to spec and plan.** A gap becomes a task or an approved scope change — never a silently edited expectation. Stop when acceptance is met.
5. **Decisions** go in the existing logs (`brain/DECISIONS.md` for active, `docs/ops/ooh-earth/07-DECISION-LOG.md` for closed). No separate ADR tree exists because those two are the equivalent. Retrospective, evidence-traced entries are indexed in `HISTORY.md`.
6. **Never publish** secrets, personal data, email contents or exploit details. Private release records are kept outside the repo; link by description, not path.

## Review (no new subscription, no bot)

Use what already exists: Prettier, ESLint, `npm run typecheck`, the relevant Playwright/server/unit tests, CodeQL, dependency audit + review, the PR template and `REVIEW-CHECKLIST.md`.

Optionally run an **independent reviewer session** with already-authorized tooling: give it `spec.md`, the diff and the test evidence and ask for prioritized findings with file references (not a general approval). Record reviewer identity and the exact SHA reviewed. **AI review is advisory**: it does not impersonate the owner and does not satisfy formal human review unless repository policy says so. No paid review bot, new provider, extra token scopes or automated merge/publish; review automation beyond existing CI needs its own security-reviewed proposal (and never runs untrusted PR instructions or exposes secrets to forked workflows).

## How a future session finds these instructions (and what is NOT verified)

- **Verified (this session's start):** Claude Code injected `CLAUDE.md` (text: "See AGENTS.md / Follow the instructions in AGENTS.md") and the auto-memory index. It did **not** inject `AGENTS.md`, `brain/*` or anything under `docs/`; the model has to open them. Creating files is therefore not proof of automatic loading.
- **Mechanism used here:** `AGENTS.md` carries a short "Engineering workflow" section that names the canonical files; `CLAUDE.md` already redirects to `AGENTS.md`, so it is unchanged.
- **UNVERIFIED:** whether other harnesses (Codex, Gemini CLI, Cursor, etc.) load `AGENTS.md` automatically, and whether Claude Code would auto-import `AGENTS.md` with an `@AGENTS.md` line in `CLAUDE.md` (not tested; not changed under this task).

## Toolkit decision

No spec toolkit (e.g. GitHub Spec Kit) is installed. Plain Markdown covers the need and a toolkit would add generated files and a maintained dependency. Re-evaluate only with an owner request; a proposal must list verified version and official commands, files created/overwritten, compatibility with `AGENTS.md`, maintenance burden and rollback.
