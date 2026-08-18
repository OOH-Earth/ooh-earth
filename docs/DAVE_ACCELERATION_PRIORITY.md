# Dave Acceleration — Priority Board

Ranked from this pass's actual findings. Every item has value/effort/dependency/evidence/owner — nothing here is a guess.

## P0 — NOW

| Item | Value | Effort | Dependency | Evidence | Owner |
|---|---|---|---|---|---|
| Confirm what's actually live at `oohearth.app` and why it doesn't match `main` | Everything else (SEO fix, future features) is unverifiable in production until this is resolved | Zero engineering effort — a question, not code | Base44 dashboard access | `docs/PRODUCTION_TRUTH.md` — live content mismatch confirmed via direct `curl` | **Dave / external**  |
| Merge PR #102 (crawler-visible metadata) | Fixes a real, confirmed defect: every route shared the same generic social preview | None — CI green, ready | None | 17/17 tests pass, before/after `curl` evidence in the PR | **Engineering — awaiting Dave's merge authorization** |

## P1 — NEXT

| Item | Value | Effort | Dependency | Evidence | Owner |
|---|---|---|---|---|---|
| Add `rollup-plugin-visualizer` (dev-only) and get real bundle-composition data | Turns "816 KB entry bundle, cause unknown" into an actionable, evidence-backed fix | Small (one dev dependency, one report) | None | `docs/PERFORMANCE_AUDIT.md` | Engineering |
| Per-page `loading="lazy"` pass on below-the-fold images | Real mobile performance gain | Small–medium (needs per-image judgment, not a sweep) | None | 7/26 files currently use it | Engineering |
| Confirm whether the production host resolves clean URLs to PR #102's generated static files | Determines whether the metadata fix has any real-world effect at all | Zero engineering effort once access exists | Render/Base44 access (see P0) | `docs/BASE44_ARCHITECTURE_AND_ACCESS.md` | Dave / external, then Engineering to verify |

## P2 — LATER

| Item | Value | Effort | Dependency | Evidence | Owner |
|---|---|---|---|---|---|
| Mobile-first journey QA (Phase F) | Real UX defects likely exist but none identified with evidence yet | Medium | None | Not audited this pass — explicitly deferred, not silently skipped | Engineering |
| Protocol One storyline audit (Phase G) | Could strengthen the demo narrative | Medium | Needs to know what Dave specifically wants demonstrated | Not audited this pass | Engineering + Dave input |
| Route-specific OG images, sitemap, robots.txt, structured data beyond what PR #102 covers (Phase I) | Broader technical SEO | Medium | Builds on P0 (need to know what's actually live first) | Not audited this pass | Engineering |
| City-card imagery system | Real feature, no urgency established | Medium | Image licensing/sourcing decision | Not audited this pass | Dave (content) + Engineering |

## WAIT FOR DAVE

- Final copy/positioning — live site and repo currently disagree on the product's own tagline
- Framer/product-story content map (Phase H) — this is Dave's content/product strategy, not a code task; engineering can support once Dave defines what each surface (Field Card, AdCam, StreetSocial, OOH Bank, etc.) needs to demonstrate
- Everything already listed in `delivery/dave-completion/06_DECISIONS_REQUIRED.md` and `docs/DAVE_ACCESS_AND_DECISIONS.md` (agency workflow, Hermes, NFT chain, BI dashboards)

## WAIT FOR ACCESS

See `docs/DAVE_PRODUCTION_ACCESS_CHECKLIST.md` in full. Summary: Base44 dashboard access is the single highest-leverage item — it likely answers the production-truth question, the deploy-trigger question, and the "does the metadata fix actually work live" question all at once.

---

## Engineering — our side (buildable without Dave, in order)

1. Add `rollup-plugin-visualizer`, get real bundle data (P1)
2. Per-page `loading="lazy"` audit on images (P1)
3. Mobile-first journey QA pass (P2, once time allows)

## Dave / external access — his side

1. Explain the live/main content mismatch (P0)
2. Grant or arrange Base44 dashboard visibility (P0)
3. Confirm deploy trigger mechanism (P0)
4. Everything in `docs/DAVE_PRODUCTION_ACCESS_CHECKLIST.md`
