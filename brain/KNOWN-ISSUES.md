# KNOWN-ISSUES — active only

Closed issues live in `delivery/dave-completion/KNOWN_ISSUES.md` (37-item
historical log) and `docs/ops/ooh-earth/`. This table is active items only —
see `QUEUE.md` for full task detail on each.

| ID | Title | Status | Evidence |
|---|---|---|---|
| SEC-001 | Production `scanAd` missing host-allowlist validation | CLOSED — deployed + source-verified 2026-09-25 | `docs/ops/ooh-earth/04-SECURITY-QUEUE.md` |
| SEC-002 | Production `migrateLocationImages` error/stack leak | CLOSED — deployed + source-verified 2026-09-25 | same |
| GIT-001 | Dependency/small-fix PR backlog | In progress — 5 merged this pass (incl. a HIGH-sev js-yaml CVE fix, #248), #249 green and ready, several majors need a compat pass | `QUEUE.md` |
| UX-001 | Desktop results-row hover/active highlight weakened | CLOSED — deployed to production, PR #277 merged, live-verified | `QUEUE.md` |
| UX-002 | Marker/icon size and quality | CLOSED — deployed to production, PR #276 merged | `QUEUE.md` |
| UX-003 | Possible results-list disappearance | CLOSED — not a bug, correct viewport filtering | Reproduced 2026-09-25, `QUEUE.md` |
| UX-004 | Carto "API KEY REQUIRED" tile watermark | Decision package complete — recommended: get the free Carto API key | `QUEUE.md` |
| UX-005 | Landscape globe container ~150px tall | P3, non-blocking | `docs/ops/ooh-earth/02-INCIDENT-MOBILE-LOCATIONS.md` |
| UX-006 | 5 full-res image URLs 404 (resized siblings 200) | P3 | same |
| UX-007 | Lazy-chunk preload has no retry | P3, not reproduced under real conditions | same |
| RQ-001 | Remaining react-query candidates | P3, scope individually | `delivery/dave-completion/KNOWN_ISSUES.md` #16 |
| TEST-001 | `route-metadata.spec.ts` flakes to "Sign In" on `/lab/nft` | Confirmed on 3 unrelated PRs (incl. a docs-only one) — real test-isolation bug, not investigated | `QUEUE.md` |
