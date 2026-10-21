# 14 — Credibility release candidate (R1M2) and PageMeta change set

Status: CANDIDATE — see the PR for gate results. Frontend only. Target branch `maintenance/production-2026-10-02` (production baseline `f6d053b`).

## Scope (exact)
- `ee02d4a` funding total never shown as raised/confirmed (`src/lib/fundingTotal.js`, Campaign, Home funding strip, MetroKit ring, portal labels)
- `7841aa9` Klima LLM figure removed from Home
- `346f506` footer/"audited" claims
- `3a4525a` report/map review-status copy
- docs `eff3f48`, `68492f7` (no runtime effect)
- `0f79dfe` no funding prompt on `/report`; photo privacy guidance; "(recommended)" photo label

Not included: placeholder team page and its flag, R2 (#356/#360/#362), schema/observation-date, policy/licence wording, backend/payment/function changes, main backlog. Funding verification uses **no** Stripe-id prefix: with no provider-verified object from the backend the Campaign shows "Verified funding total unavailable" (never $0).

## Dependencies and R2 reconciliation notes
- Supersedes draft PR #367 (same commits plus `0f79dfe`); close #367 after this merges.
- `ReportStep1Document.jsx` (photo label + guidance) and `FieldReport.jsx` (success copy) are also edited by held R2 (#356, #362). On R2 merge: keep R2's location-source/confirmation logic, keep this release's "(recommended)" label unless the product decides to enforce a photo, and keep the guidance paragraph; reconcile the success-card wording (R2's "Submitted for review" text supersedes this release's).
- Port the same changes to `main` separately (rule: no direct PRs against main without instruction).

## Metadata: five-row PageMeta change set (NOT part of this code deployment)
Production data edit; needs an admin and separate authorization. Browser descriptions come from these rows (they outrank repo `routeMeta` in `seoContext.resolveMeta`). Crawler regeneration after the edit is **unverified**; re-run browser and crawler checks separately. Titles stay unchanged. Apply in Lab Admin -> SEO panel (`/lab/admin`); rollback = re-enter the current values below.

| id | path | current description (rollback value) | proposed description |
| --- | --- | --- | --- |
| `6a75a3b5114f3f9bb7c09e90` | `/` | An open-source, community-funded app reclaiming the visual commons. Mapping every corporate advertis | OOH Earth is an open-source, community-funded adbusting platform that documents outdoor advertising and supports community-led creative resistance. |
| `6a75a45d5efd2848335c83de` | `/about` | OOH Earth is an open-source, community-funded platform reclaiming the visual commons through mapping | OOH Earth documents outdoor advertising and supports community-led adbusting, research, photography, and creative remixes. |
| `6a75a501e42b7f999298e379` | `/campaign` | Community-funded treasury for adbusting, mapping, and creative resistance. Support the offensive. | Support OOH Earth’s community-funded work documenting outdoor advertising and developing creative adbusting tools. |
| `6a75a33399b1a15fe61fc135` | `/map` | Interactive global map of every billboard, digital screen, and advertising surface. | An interactive atlas of documented outdoor advertising and public-space records, with moderation status shown where available. |
| `6a75a4fc1d78e358e4b7d169` | `/report` | Log a billboard, digital screen, or advertising offense. Photo, location, access key, and notes — on the public record. | Document a billboard, digital screen, or advertising surface with a photo, location, and notes. A submission is a record for review, not proof of ownership or permission. |
