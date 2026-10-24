# Engineering constitution — an index, not a rulebook

Every line links its source. Labels: **[ENFORCED]** a control (CI/branch protection/code) makes it true; **[OWNER]** a recorded owner instruction or decision; **[PROPOSED]** suggested here, not yet agreed. If this file conflicts with `AGENTS.md`, `brain/INVARIANTS.md` or `brain/PRODUCT.md`, those win — fix this file.

## Mission and scope
- Real places, real contributions, real people; no fabricated users, activity or funding. [OWNER] `brain/PRODUCT.md` ("No fake social proof")
- Current first-user goal: a person can understand the app, join where needed, document an observation, submit it and see its review status. [OWNER] (session brief, 2026-10-22; not yet in `brain/`)
- Small, reversible, shippable slices; no big-bang redesigns. [OWNER] `brain/PRODUCT.md`

## Stack and ownership
- Base44 is the runtime source of truth; GitHub mirrors engineering work. [OWNER] `AGENTS.md` rule 1, `ENGINEERING-WORKFLOW.md`
- No direct commits/pushes/PRs against `main` without explicit instruction in that session. [OWNER] `AGENTS.md` rule 3
- Reuse the existing SDK client, Vite plugin and Base44 CLI workflow before adding new paths. [OWNER] `AGENTS.md`
- New infrastructure needs a demonstrated reason (measured problem, security, scale, toil, user capability, provider limit). [OWNER] `docs/RELIABILITY_CONSTITUTION.md`

## Privacy, provenance, claims
- Secrets only in the environment; none committed; CI never uses repository secrets or live backend credentials. [OWNER + ENFORCED in `ci.yml` by `scripts/ci-workflow-guard.test.mjs`] `AGENTS.md` rules 2, 4
- Public copy makes no verified-funding, adoption, investment or membership claim without evidence. [OWNER] release briefs (R1M2/R1M3); [PROPOSED] add a durable entry to `brain/DECISIONS.md`
- Uploaded photos: validate type, re-encode to drop embedded metadata, never promise location removal for formats that pass through. [ENFORCED] `e2e/image-privacy.spec.ts`
- No private data, faces, precise private locations or unapproved content in public logs, docs or evaluation sets. [PROPOSED]

## Permissions and data
- Moderation/permission checks are server-side; `entities push` pushes the whole folder — never from a stale or partial snapshot; schema/RLS changes need owner approval. [OWNER] `brain/INVARIANTS.md`
- Mutations: no blind retries; retry only plausibly transient failures; idempotency/de-duplication for anything repeatable; account isolation tested. [OWNER-precedent] `docs/ops/ooh-earth/07-DECISION-LOG.md` (2026-09-22 `withRetry`), [PROPOSED] as a general rule
- Production data is never edited as a substitute for understanding a bug. [OWNER] `07-DECISION-LOG.md`

## UI
- Accessible names, visible keyboard focus, ≥44px touch targets for primary controls, no horizontal scroll at 320px, layouts verified by measured DOM bounds not screenshots alone. [PROPOSED] (exercised in `e2e/live-feed-nudge-overlap.spec.ts`); fuller standards: `docs/design/UI-STANDARDS.md` **pending on the UI-audit branch**.

## Environments, testing, release
- Production vs BACKUP are distinct; verify the runtime app-id in the HTML-referenced entry before deploy; qualify the exact artifact on BACKUP; keep a verified rollback artifact. [OWNER] `brain/INVARIANTS.md`, `brain/ENVIRONMENTS.md`; the frontend-only verification scripts are **not yet in version control** [PROPOSED follow-up]
- Required CI on `main`: Lint & Typecheck, Build, Playwright (×2), Dependency audit, Dependency Review, CodeQL, Prettier; strict, linear history, admins enforced, 0 required approvals. [ENFORCED] branch protection (read 2026-10-23); `maintenance/**` is unprotected but now gets the same CI on PRs. [ENFORCED] `ci.yml`
- Merge/deploy only through existing review controls; recorded permission denials are not bypassed by another tool or route. [OWNER]
- No new recurring cost, paid service, scheduler or unattended agent without approval. [OWNER]
- Agent OS infrastructure/provider/scheduler freeze is in force. [OWNER instruction in session; **no repo document found — UNKNOWN source**]
