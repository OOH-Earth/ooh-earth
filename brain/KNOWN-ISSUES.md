# KNOWN-ISSUES — active only

Closed issues live in `delivery/dave-completion/KNOWN_ISSUES.md` (37-item
historical log) and `docs/ops/ooh-earth/`. This table is active items only —
see `QUEUE.md` for full task detail on each.

| ID | Title | Status | Evidence |
|---|---|---|---|
| SEC-001 | Production `scanAd` missing host-allowlist validation | CLOSED — deployed + source-verified 2026-09-25 | `docs/ops/ooh-earth/04-SECURITY-QUEUE.md` |
| SEC-002 | Production `migrateLocationImages` error/stack leak | CLOSED — deployed + source-verified 2026-09-25 | same |
| GIT-001 | Dependency/small-fix PR backlog | 14 merged across 3 passes; remaining 6 are majors with a documented compatibility matrix, deferred pending dedicated investigation or a human decision on React 19 | `QUEUE.md`, `docs/ops/ooh-earth/01-PRIORITY-QUEUE.md` |
| UX-001 | Desktop results-row hover/active highlight weakened | CLOSED — deployed to production, PR #277 merged, live-verified | `QUEUE.md` |
| UX-002 | Marker/icon size and quality | CLOSED — deployed to production, PR #276 merged | `QUEUE.md` |
| UX-003 | Possible results-list disappearance | CLOSED — not a bug, correct viewport filtering | Reproduced 2026-09-25, `QUEUE.md` |
| UX-004 | Carto "API KEY REQUIRED" tile watermark | Decision package complete — recommended: get the free Carto API key | `QUEUE.md` |
| UX-005 | Landscape globe container ~150px tall | P3, non-blocking | `docs/ops/ooh-earth/02-INCIDENT-MOBILE-LOCATIONS.md` |
| UX-006 | 5 full-res image URLs 404 (resized siblings 200) | P3 | same |
| UX-007 | Lazy-chunk preload has no retry | P3, not reproduced under real conditions | same |
| RQ-001 | Remaining react-query candidates | P3, scope individually | `delivery/dave-completion/KNOWN_ISSUES.md` #16 |
| TEST-001 | `route-metadata.spec.ts` flakes to "Sign In" on `/lab/nft` | CLOSED — root-caused (missing `?access_token=`), fixed, PR #279 merged, 60/60 local + real CI green | `docs/ops/ooh-earth/05-TEST-MATRIX.md` |
| TEST-EXTRA | `heat-layer.spec.ts`/`multi-photo-upload.spec.ts` flaked-but-passed on retry in a full-suite run | New finding, not investigated — different signature from TEST-001, not blocking | `docs/ops/ooh-earth/05-TEST-MATRIX.md` |
