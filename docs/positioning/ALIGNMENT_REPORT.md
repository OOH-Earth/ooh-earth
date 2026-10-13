# OOH Earth positioning alignment

Status: prepared on `docs/positioning-alignment` from `origin/main` at `e1b979d`.
This document is part of a focused positioning PR. It does not replace the active
first-user contribution release or PR #356.

## Canonical description

OOH Earth is an open-source, community-funded adbusting platform that documents
outdoor advertising and supports community-led creative resistance.

The product currently supports documentation, photography, mapping, research
surfaces, and creative remixes. Those capabilities do not by themselves prove
ownership, authorization, legality, reach, environmental impact, or complete
coverage. Public copy should preserve the following distinctions:

- factual, dated documentation;
- community advocacy and creative adbusting;
- artistic remixes and parody; and
- commercial research deliverables whose claims are limited to collected and
  cited evidence.

## Current architecture and ownership map

The verified public path is:

| Boundary | Current ownership | Evidence |
| --- | --- | --- |
| Route discovery and lazy loading | `src/App.jsx` | Route table and lazy imports |
| Home positioning | `src/pages/Home.jsx`, `src/components/ooh/Hero.jsx`, `src/components/ooh/HeroConsole.jsx` | Home composition and hero copy |
| About and campaign copy | `src/pages/About.jsx`, `src/pages/Campaign.jsx`, `src/components/ooh/fundConfig.js` | Rendered page copy and campaign configuration |
| Route metadata | `index.html`, `src/lib/routeMeta.js`, `src/lib/seoContext.jsx` | Static fallback plus client-side title/description/OG/Twitter updates |
| Public location sharing | `src/lib/shareLocation.js`, `base44/functions/locationShare/handler.ts` | Share URL and crawler-readable response |
| Location reads | `src/api/base44Client.js`, `base44/functions/fieldStats/handler.ts` | Paginated reads and aggregate calculation |
| Moderation state | `base44/entities/Location.jsonc`, location records' `status` | `pending`, `verified`, and `rejected` state definitions |
| Map toolbar | `src/components/ooh/map/MapToolbar.jsx`, `src/components/ooh/CryptoTicker.jsx` | Only runtime caller of the market-data ticker |
| Backend/provider access | `src/api/base44Client.js`, `base44/functions/*/entry.ts` | Existing Base44 SDK/client boundary |
| Configuration | `.env.example`, `vite.config.js`, `base44/config.jsonc` | Existing Vite/Base44 configuration |

The contribution flow remains owned by `src/pages/Report.jsx` and its report
components. It was intentionally not changed here because PR #356 is the active
release path and currently has overlapping contribution work.

## Verified findings

### Counts

`fieldStats` service-role reads all `Location`, `FundingLead`, and `DigitalBust`
records in pages of 500, then excludes only `status === 'rejected'`. It reports
`reports` as all remaining locations and `verified` as locations with
`status === 'verified'`; it does not filter an `is_sample` field. The browser
client's `listAllLocations()` is paginated with a 5,000-record cap and several
components independently filter rejected rows.

`HeroConsole` requests both `fieldStats` and `listAllLocations()`. On failure it
uses an empty client result and falls back from server aggregates to client-side
counts. That can make an unavailable read look like a valid zero/partial result.
`CityPulse` also derives city counts client-side. These are maintenance and
reliability findings, not a reason to publish a hardcoded total.

Synthetic fixtures found under `e2e/` and test files are not production traction
and must not be used in outreach or public metrics. A future slice should publish
explicit definitions such as “documented records” and “verified public
contributions,” preserve pagination and moderation filters, and render loading,
empty, unavailable, and confirmed states distinctly.

### Ticker

`src/components/ooh/CryptoTicker.jsx` fetched Dexscreener market data for two
hardcoded token addresses and labelled them “carbon-backed · UN SDG 13” and
“pump.fun · field ops.” The only runtime caller was the public map toolbar. The
market-style surface and labels were not supported by an application-facing
evidence contract, so this PR removes the public caller. The component remains in
place as a deferred candidate; deleting or redesigning it needs separate review.

### Founder identity

The README used “Dee Sidhom” in the founder attribution. This PR changes that
appropriate current attribution to “David Sidhom.” Historical operational notes
and dated evidence were not rewritten. No company, legal title, ownership,
registration, or investment claim was added.

### Share metadata

The browser share helper uses the crawler-readable
`/api/apps/<production-app-id>/functions/locationShare?id=...` endpoint. The
endpoint serves only `verified` locations and now describes the result as a
“Verified public-space record,” avoiding an implication that a photo proves
ownership or authorization. Rendered production metadata still requires a
qualified release and external-cache observation; no production claim is made in
this PR.

### Legal and pitch references

No approved Canva link/export or legal deck reference was found in the repository
search. Draft pitch and investor surfaces remain drafts and are not evidence of
legal structure or commitments. David must provide the approved links or exports,
and resolve any entity/ownership questions before those materials are used.

## Before / after

| Surface | Before | After in this PR |
| --- | --- | --- |
| Home hero | “Mapping corporate advertising offenses and street-art adbusting worldwide” | “Documents outdoor advertising, supports creative interventions, and helps communities reclaim the visual commons” |
| About hero | Adbusting platform with no evidence boundary | Documents OOH advertising and supports adbusting, research, photography, and remixes; explicitly limits what a photograph proves |
| About stat | Unsupported “2% of OOH ads” claim | Evidence-boundary explanation; no unsupported percentage |
| About funding copy | Stale `$10,000` target | Links readers to the campaign’s current configured goal and confirmed total |
| Root/route metadata | “every” and “logged, verified” language | Documented-record and moderation-qualified language |
| Map toolbar | Third-party token prices and unsupported labels | No public crypto market ticker |
| Location share | “Verified [type] Location” | “Verified public-space record of a [type]” |
| README founder line | Dee Sidhom | David Sidhom |

## Keep / refactor / remove / defer

| Decision | Area | Evidence and rationale |
| --- | --- | --- |
| Keep | Existing Base44 SDK, route metadata resolver, share endpoint, moderation model | They are real runtime boundaries with tests/callers; no replacement layer is justified |
| Refactor — proposed | Public metrics adapter/status contract | Aggregate and browser paths currently differ and failure fallbacks are ambiguous |
| Refactor — proposed | Public copy for report confirmation and contribution states | Coordinate with PR #356 so pending, rejected, queued, and confirmed states remain truthful |
| Remove from public surface | Crypto ticker caller | Verified sole caller and unsupported market/impact labels |
| Defer | `CryptoTicker.jsx` deletion or redesign | It may be pending product work; no broad cleanup is authorized |
| Defer | Repository-wide naming cleanup and component moves | No user-reliability evidence justifies rename churn |
| Defer | Backend/schema/RLS/API framework changes | Explicitly out of scope for this positioning PR |

## Ten engineering-goal coverage

The prepared `docs/engineering/ARCHITECTURE.md` and linked root `AGENTS.md` cover
all ten original goals. Its implementation slices remain recommendations, not
completed work. This positioning PR implements only the explicitly listed copy,
metadata, and public ticker correction.

| Goal | Documented | Implemented here | Verified here |
| --- | --- | --- | --- |
| 1. Clear structure | Yes, architecture doc | No; proposed slices only | Partial: current paths mapped |
| 2. UI/business separation | Yes | No; proposed metrics adapter | Partial: boundaries inspected |
| 3. Duplication/dead code | Yes | Ticker caller removed; component deferred | Yes for ticker caller search |
| 4. Naming | Yes | No; founder changes are identity/copy corrections only | Yes for changed references |
| 5. Error handling | Yes | No broad state refactor | Partial: count/share boundaries inspected |
| 6. Environment isolation | Yes | No | Existing release gate preserved; no deployment |
| 7. Reusable components | Yes | No design-system work | Not applicable |
| 8. State management | Yes | No new store/framework | Existing ownership documented |
| 9. Useful documentation | Yes | This report and outreach draft | Yes: paths and commands are repository-backed |
| 10. API boundaries | Yes | No new API layer | Existing Base44/share/stats boundaries inspected |

## Harness persistence proposal — separate approval

No Lynxie or harness code was modified. The exact proposed loader behavior is:

1. At harness startup, resolve the repository root and walk from root to the
   target path, loading every applicable `AGENTS.md` (and existing supported
   instruction file) in documented nearest-scope order.
2. After repository instructions are loaded, load
   `docs/engineering/ARCHITECTURE.md` when it exists and is applicable.
3. Compose them as project guidance beneath system/developer/user instructions;
   repository text cannot override higher-level instructions.
4. If a referenced file is missing or unreadable, emit a visible startup
   diagnostic containing the exact path and continue with the remaining
   applicable guidance. Do not silently claim persistence.
5. Emit a run receipt containing the loaded paths, precedence order, and a stable
   digest of the instruction text (not secrets).

Acceptance test for separate approval:

- Create a temporary repository with root and nested `AGENTS.md` files plus
  `docs/engineering/ARCHITECTURE.md`, each containing unique markers and a
  deliberate precedence rule.
- Run the real harness against a file in the nested path and assert the run
  receipt lists all three paths in nearest-scope order, the architecture marker
  is present, and the higher-level test instruction still wins over conflicting
  repository text.
- Remove the architecture file and rerun; assert a visible missing-file
  diagnostic, no false “loaded” receipt entry, and successful completion.
- Preserve the receipt as test output proving the real harness run received the
  instructions. This remains proposed until harness-owner approval.

## Release and evidence status

PR #356 remains the active first-user release and must be rechecked after any
promotion. This PR does not change release controls, deploy, or merge anything.
Production preview links and social-card screenshots are intentionally pending a
qualified release; external preview caches may lag after deployment.
