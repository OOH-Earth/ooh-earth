# Dave Completion Checklist

**Main SHA at time of writing: `43bfe9d`.** Every claim below is backed by a
route you can open, a PR you can read, or a test you can run — no item is
marked SHIPPED without a merged PR + passing test + independent post-merge
verification (fresh `npm ci`, clean environment). No optimistic language.

Status values: **SHIPPED** / **VERIFIED EXISTING** / **PARTIAL** / **BLOCKED**
/ **NOT STARTED**.

---

### 1. Adbusting capture + AI identification — **VERIFIED EXISTING**
- **Dave wanted**: fast, obvious capture of a billboard with real identification, not a form nobody fills in.
- **What exists**: `/report` (4-step wizard) and `/ar` (camera capture) both run the same real AI scan (`scanAd`) and save a `Location` record. No login required for `/report`.
- **Verified**: real browser walkthrough at desktop (1280px) and mobile (390px); AI call is a real network request, not simulated.
- **Route**: `/report`, `/ar`. **Test**: `e2e/report-scan-dedup.spec.ts`, `e2e/ar-lens-brand-scan.spec.ts`.
- **Gap / decision**: none.

### 2. Brand intelligence — **VERIFIED EXISTING**
- **Dave wanted**: see the brand behind an ad, not just a photo.
- **What exists**: `AdvertiserInfo.jsx` shows brand/campaign/agency/parent-corp/operator/sector, with a real logo-icon lookup (`BrandBadge.jsx`, 60+ real marks) on map pins, edit panel, and AI-scan results.
- **Route**: `/location/:id`. **PR**: #75 (structured sector source, earlier convergence). **Test**: `e2e/advertiser-sector-inference.spec.ts`.
- **Gap / decision**: none for what's asked; a real relational `Brand` entity is possible but not required (Decision A).

### 3. Parent corporation intelligence — **SHIPPED**
- **Dave wanted**: see the holding company behind a brand.
- **What we shipped**: `parent_corp` is now cross-referenced, not just displayed — a location page shows other locations under the same parent corporation.
- **Route**: `/location/:id` → "Connected Locations". **PR**: #91. **Test**: `e2e/related-locations-parent-corp.spec.ts` (2/2, fail-before/pass-after).
- **Gap / decision**: none.

### 4. Corporate footprint discovery — **SHIPPED**
- **Dave wanted**: "map all corporate relationships."
- **What we shipped**: same as #3 — a location page surfaces nearby locations, same-brand locations, and same-parent-corp locations, in one connected view.
- **Route**: `/location/:id`. **PR**: #91. **Test**: `e2e/related-locations-parent-corp.spec.ts`.
- **Gap / decision**: none for the current scope.

### 5. Brand/parent-corporation map search — **SHIPPED**
- **What we shipped**: map search previously matched only title/address; now matches brand and parent corporation too.
- **Route**: `/map` (search box). **PR**: #93. **Test**: `e2e/map-brand-search.spec.ts` (2/2, fail-before/pass-after).
- **Gap / decision**: none.

### 6. Activity Heat intelligence — **SHIPPED**
- **Dave wanted**: see where activity concentrates, not just a marker list.
- **What we shipped**: a real report-density heat layer (`leaflet.heat`), toggleable, non-destructive to markers.
- **Route**: `/map` → Intelligence → Activity Heat. **PR**: #92. **Test**: `e2e/heat-layer.spec.ts` (2/2). Two real bugs found and fixed via testing before shipping (CSS sizing collision; a marker-filtering starvation edge case) — see `07_TEST_EVIDENCE.md`.
- **Gap / decision**: a verified-only intensity filter is possible but not built (Decision B) — small, deferred pending your yes/no.

### 7. Heat hotspot → report interaction — **SHIPPED**
- **What we shipped**: the heat layer was previously a pure visualization with no interaction. A click near a hotspot now opens the actual report, the same way tapping its pin does.
- **Route**: `/map` (with Activity Heat on). **PR**: #96. **Test**: `e2e/heat-layer-click-handoff.spec.ts` (2/2).
- **Gap / decision**: none.

### 8. AR capture + AI brand identification — **VERIFIED EXISTING**
- **What exists**: real camera (`getUserMedia`), real GPS, real capture, and the same real AI scan `/report` uses — not a separate, lesser pipeline.
- **Verified**: the "lock on" reticle is confirmed a manual UI gesture (`onClick`), not object detection — and never claims otherwise anywhere in the UI copy.
- **Route**: `/ar` (requires camera + HTTPS/real browser — will not work in a preview iframe). **Test**: `e2e/ar-lens-brand-scan.spec.ts`.
- **Gap / decision**: real object detection is a genuine, separate CV feature — not started, correctly (Decision C).

### 9. AR parent-corporation context — **SHIPPED**
- **What we shipped**: AR's result summary showed brand + operator but silently dropped the already-detected, already-saved parent corporation. Now shown.
- **Route**: `/ar`, done-state. **PR**: #95. **Test**: `e2e/ar-lens-brand-scan.spec.ts` (precise assertion added, not just a loose substring match).
- **Gap / decision**: none.

### 10. Contribution/trophy identity — **VERIFIED EXISTING**
- **What exists**: a real XP/level/badge/quest system driven by actual contribution counts (reports, verified reports, photos, streaks) — not decorative.
- **Route**: `/operative` (requires login + at least one real contribution to show earned badges).
- **Gap / decision**: none for what exists.

### 11. Trophy → NFT Studio connection — **SHIPPED**
- **Dave wanted**: trophies displayable, with an eye toward NFT/collectibles.
- **What we shipped**: an earned badge now offers "Mint as NFT," deep-linking into the NFT studio with title/grade/colour pre-filled from that badge's real tier.
- **Route**: `/operative` → hover an earned badge → `/lab/nft?badge=<id>`. **PR**: #98. **Test**: `e2e/nft-badge-mint-prefill.spec.ts` (3/3, fail-before/pass-after).
- **Gap / decision**: none for this connection. On-chain minting itself remains external (item 12).

### 12. NFT/Web3 reality — **PARTIAL**
- **What's real**: wallet connect (MetaMask/Phantom), server-verified ownership signature, real metadata build/upload, `Mint` entity tracking.
- **What's not real**: on-chain minting happens externally on Zora, not in-app; "marked minted" is self-reported, not chain-verified. No code anywhere claims otherwise.
- **Route**: `/location/:id` (Mint panel), `/lab/nft`. **Evidence**: `11_NFT_WEB3_STATUS.md` (full per-capability audit).
- **Gap / decision**: real in-app minting needs a chain decision + funded deployer wallet (Decision D) — **BLOCKED** on that sub-scope specifically.

### 13. CI/engineering quality — **SHIPPED**
- **What we shipped**: every CI gate (Playwright, Lint, Typecheck, Prettier, Build) now produces a structured failure summary (job/file/line/error) instead of requiring a raw-log read.
- **PR**: #85 (Playwright), #99 (Lint/Typecheck/Prettier/Build). **Evidence**: `07_TEST_EVIDENCE.md`.
- **Gap / decision**: none.

### 14. Business intelligence — **PARTIAL**
- **What exists**: brand/corp/agency/operator/sector data is already real and browsable per-location and per-search — the raw material for BI already flows through the product.
- **What's missing**: a dedicated aggregate/dashboard view.
- **Gap / decision**: needs a named use case from you (Decision H) — building a dashboard with no specified question risks the "giant CRM" nobody asked for.

### 15. Fundraising intelligence — **PARTIAL**
- Same underlying reality as #14 — no dedicated fundraising-specific view exists; the data (locations, brands, corporations, activity) is real and already exposed elsewhere.
- **Gap / decision**: needs a named use case.

### 16. Agency workflow — **NOT STARTED** (beyond an honest scaffold)
- **What exists**: `ClientPortal.jsx` — explicitly, honestly sample-labeled UI shell. Every row tagged `'sample'` in its own source.
- **What's missing**: timesheets, clock in/out, signed documents, contacts/jobs backend — confirmed via repo-wide search, zero real infrastructure.
- **Gap / decision**: worker classification, e-signature vendor (or none), internal-vs-client-facing scope (Decision F) — **BLOCKED** on scope, not effort.

### 17. Hermes — **BLOCKED**
- **What exists**: zero references anywhere in the repository (`grep -rli "hermes"` across every source/config/doc file — zero matches).
- **Gap / decision**: a concrete specification of what Hermes is and does (Decision G). Nothing to build against without one.

### 18. Commercial licensing — **VERIFIED EXISTING**
- **What exists**: AGPL-3.0 (code), CC BY-SA 4.0 (content) — unchanged this pass, audit only.
- **Gap / decision**: relicensing only matters if commercialization requires different terms (Decision I) — a legal decision, not engineering's to make.

### 19. Release/deployment — **BLOCKED**
- **What exists**: v1.2.0 is live; v1.3.0 (PR #63) is stuck on a diagnosed, specific GitHub branch-protection rollup gap — check-runs pass on the commit but don't link into the PR's own status rollup.
- **Gap / decision**: a human with GitHub org **Settings** access needs to fix the rollup linkage. Not re-investigated this pass (already diagnosed).

---

## Tally (19 items)
- **SHIPPED**: 8 (3, 4, 5, 6, 7, 9, 11, 13)
- **VERIFIED EXISTING**: 5 (1, 2, 8, 10, 18)
- **PARTIAL**: 3 (12, 14, 15)
- **BLOCKED**: 3 (16, 17, 19)
- **NOT STARTED**: 0 as a standalone top-level item (item 16's detail is
  effectively not-started, folded into its BLOCKED status since the blocker
  *is* "no scope to start from")

Full detail, evidence, and screenshots for every item: see `EVIDENCE_INDEX.md`
and `README_FOR_DAVE.md`.
