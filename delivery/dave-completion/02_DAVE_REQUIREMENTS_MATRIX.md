# Dave Requirements Matrix

Evidence-based, one row per requirement area. Status legend: DONE / VERIFIED
EXISTING / PARTIAL / BLOCKED / NOT STARTED.

---

## 1. Core Adbusting Experience — **VERIFIED EXISTING, strengthened this pass**

| Field | Detail |
|---|---|
| Current state | Full loop works: `/report` (4-step wizard: Document→Identify→Classify→Respond) and `/ar` (camera capture) both run the same AI scanner (`scanAd`), save to `Location`, and hand off to map + detail views. |
| Files | `src/pages/Report.jsx`, `src/components/ooh/FieldReport.jsx`, `src/components/ooh/report/ReportStep2Identify.jsx`, `src/pages/ArLens.jsx`, `src/pages/LocationDetail.jsx`, `src/pages/Map.jsx` |
| Routes | `/report`, `/ar`, `/location/:id`, `/map` |
| Data model | `Location` entity (`base44/entities/Location.jsonc`) — no schema change needed or made |
| What already works | Capture → AI identify → classify → submit → done-state with "View report"/"View on map" → map auto-highlights the new pin (`?highlight=<id>`, shipped PR #84) → location detail shows full advertiser context |
| What was missing (fixed this pass) | Map search only matched title/address, not brand/parent_corp (fixed PR #93); AR's result summary omitted parent_corp even though it was already detected and saved (fixed PR #95) |
| Dependencies | None new |
| Risk | Low — all changes additive, no existing behavior altered |
| Estimated size | Small (all shipped) |
| Decision required | None |
| Built autonomously | Yes |

## 2. Brand Intelligence — **DONE (on existing architecture, no migration)**

| Field | Detail |
|---|---|
| Current state | Brand, campaign, parent corp, agency, sector, related locations, and corporate footprint are all real and connected. |
| Files | `AdvertiserInfo.jsx`, `RelatedLocations.jsx`, `BrandBadge.jsx` (60+ real advertiser/operator/agency marks), `report/advertiserRegistry.js`, `Map.jsx`'s `filtered` |
| Data model | Existing free-text fields on `Location` (`brand_name`, `parent_corp`, `ad_agency`, `ooh_operator`, `industry_sector`) — **no `Brand`/`Organisation` entity was needed or built** |
| What already works | Brand icon lookup renders on map markers, advertiser info, edit panel, AI-scan results. "Same advertiser" cross-referencing on location pages. |
| What was missing (fixed this pass) | No "same parent corporation" cross-referencing (fixed PR #91 — two differently-branded surfaces under the same holding company are now linked); brand/parent-corp weren't searchable on the map (fixed PR #93) |
| Dependencies | None new |
| Risk | Low |
| Estimated size | Small |
| Decision required | **Only if a real relational `Brand`/`Organisation` entity is wanted later** (e.g. to dedupe "Shell" vs "Shell plc" spelling variants, or attach brand-level metadata not tied to any one location) — not required for anything currently asked. See `06_DECISIONS_REQUIRED.md` Decision A. |
| Built autonomously | Yes |

## 3. Corporate Footprint Map — **DONE**

| Field | Detail |
|---|---|
| Current state | Search a brand or parent corp on the map → filters to matching locations. View a location → see sibling brands under the same parent corp + nearby locations. Click a heat hotspot → jump straight into the nearest report. |
| Files | `Map.jsx`, `RelatedLocations.jsx`, `HeatLayer.jsx` |
| What already works | Existing Leaflet map infrastructure reused entirely — no new mapping system |
| What was missing (fixed this pass) | Search scope (PR #93), corp cross-linking (PR #91), heat→location handoff (PR #96) |
| Decision required | None |
| Built autonomously | Yes |

## 4. Activity / Heat Intelligence — **DONE for what was asked; verified-only filter deferred**

| Field | Detail |
|---|---|
| Current state | Real report-density heat layer (`leaflet.heat`), toggleable, non-destructive to markers, click-to-nearest-report. |
| Files | `HeatLayer.jsx`, `LayerManager.jsx`, `MapLayerToggle.jsx`, `Map.jsx` |
| What already works | Reflects real `Location` data end-to-end; already scopes to the adbusting-specific subset when combined with that street filter (existing ads/adbusting/graffiti union logic in `Map.jsx`, unchanged) |
| What was missing (fixed this pass) | No interaction at all (fixed PR #96 — click a hotspot, open the report); a real sizing bug (canvas collapsed to 0×0 against a site-wide CSS reset — found and fixed via testing, PR #92) |
| Deferred, not built | Verified-only filter — explicitly deferred per an earlier product decision ("default to raw density, add the toggle only if genuinely low effort") |
| Decision required | Only if the verified-only filter is now wanted — small addition, needs one product decision (see `06_DECISIONS_REQUIRED.md` Decision B) |
| Built autonomously | Yes |

## 5. AR — **VERIFIED EXISTING + strengthened; UI already honest**

| Field | Detail |
|---|---|
| Current state | Real camera, real GPS, real capture→upload→`Location.create`, real AI identification via the same `scanAd` call `/report` uses. |
| Files | `src/pages/ArLens.jsx` |
| Verified real | Camera (`getUserMedia`), GPS (`navigator.geolocation`), capture (canvas frame grab), brand/parent-corp/agency/operator identification (real AI call, not simulated), report creation, map handoff (`?highlight=`), report confirmation |
| Verified honest, not fake | The "lock on" reticle is a **manual UI gesture** (`onClick={() => setLocked(true)}` — confirmed by reading the trigger, not assumed) — it has never claimed to be real object detection, and no copy anywhere says otherwise. The CO₂ overlay is an honestly-labeled average (`~4.76t CO2/yr avg.`), not a per-billboard measurement (fixed earlier this convergence effort, PR #81). PM2.5 is a real live API call (Open-Meteo), not fabricated. |
| What was missing (fixed this pass) | AR's result summary showed brand + operator but silently dropped parent_corp even though it was already detected and saved (fixed PR #95) |
| Real object detection | **Not implemented, not investigated for implementation this pass** — genuine client-side billboard object detection (e.g. on-device ML model) is a real computer-vision feature, not a small integration, and was correctly out of scope per the brief's own "do not build fake object detection" instruction. If wanted, this is a new capability requiring a model, latency/accuracy testing, and a product decision — not a documentation fix. |
| Decision required | Only if real object detection is wanted (see `06_DECISIONS_REQUIRED.md` Decision C) |
| Built autonomously | Yes (documentation + the one real integration gap found) |

## 6. NFT / Web3 — **PARTIAL, precisely bounded — see `11_NFT_WEB3_STATUS.md`**

Summary (full detail in the dedicated file):

| Capability | Status |
|---|---|
| Wallet connection | **REAL** — MetaMask/Phantom via `useWallet.jsx`, real `eth_requestAccounts`/Solana `connect()` |
| Signing | **REAL** — server-verified ownership signature (`verifyWallet` function), no transaction |
| Market data | **REAL** — live Zora market data on `/zora` |
| Metadata | **REAL/PREPARED** — real metadata JSON built and uploaded to storage per location |
| Mint preparation | **PREPARED** — `Mint` entity records created with `status: 'prepared'` |
| Actual on-chain minting | **EXTERNAL, NOT IMPLEMENTED IN-APP** — user is sent to `zora.co/create` to actually mint; "mark minted" is a **self-reported, unverified** token address, not a chain read |
| Ownership | **NOT VERIFIED ON-CHAIN** — the app never queries the chain to confirm a mint actually happened or who owns it |
| Display / collectibles | **PARTIAL** — `NftCreator`/`NftStudioPanel` is a freeform trading-card visual studio, disconnected from a user's actual earned badges |
| User trophies on NFT | **NOT IMPLEMENTED** (a working prototype was built and verified in an earlier loop this session — badge→NFT-studio prefill deep-link — then deliberately shelved as out of that pass's priority order; sits in local git history only, not pushed, not a PR; recoverable) |
| Physical collectible readiness | **CONTENT ONLY** — `/store` sells a physical card ($25) tied to the visual design, not to a verified on-chain asset |

No fabricated on-chain claims found or introduced. Decision required: see `06_DECISIONS_REQUIRED.md` Decision D.

## 7. User Trophies / Contribution Identity — **VERIFIED EXISTING, real**

| Field | Detail |
|---|---|
| Current state | Real, functioning gamification system — not built this pass, pre-existing |
| Files | `useGamification.js`, `gamification.js` (13 badges, level curve, quests), `BadgeGrid.jsx`, `OperativeProfile.jsx` (`/profile`) |
| What already works | XP/level from real contribution counts (reports, verified reports, photos, digital busts, mints, leads, streaks), earned badges displayed, daily/weekly quests with real progress tracking and claimable bonus XP |
| Connection to NFT | **Exists as a working prototype, not shipped** (see item 6) — this is the smallest viable implementation already identified: deep-link an earned badge into the existing NFT studio with title/grade/color prefilled from the badge's real tier. No new entity needed. |
| Decision required | Whether to ship the badge→NFT prefill link now (see `06_DECISIONS_REQUIRED.md` Decision E) |
| Built autonomously | N/A — pre-existing; connection prototype built but not shipped this pass |

## 8. Agency / Freelance Workflow — **NOT STARTED beyond an honest scaffold — see `13_AGENCY_WORKFLOW_STATUS.md`**

| Field | Detail |
|---|---|
| Current state | `ClientPortal.jsx` (`/portal/client`) is a **deliberately, explicitly labeled sample scaffold** — every row is tagged `'sample'` in its own data, with an inline comment: "Scaffold with clearly-labelled SAMPLE rows; live data wires in via the n8n ops spine later." |
| What exists | UI shell only: brief cards, campaign cards, deliverable list — all sample content, zero backend |
| What does not exist anywhere | Signed documents, freelancer onboarding, timesheets, clock in/clock out, work tracking, contacts, jobs dashboard, agency operations backend — confirmed via repo-wide grep, zero matches beyond incidental copy mentions ("onboarding" used as a UI-tour word, not a workflow) |
| Repository search performed | `grep -rn "clock.in\|clock_in\|timesheet\|freelancer\|onboarding" src/ base44/` — only incidental copy hits, no infrastructure |
| Why not built this pass | This is genuinely a new HR/operations system: work-tracking and timesheets carry real employment-classification and compensation implications, and "signed documents" implies a legal e-signature integration. Building this without Dave's decision on scope, compensation model, and legal requirements would be inventing business logic, which the mission's own rules explicitly forbid. |
| Decision required | Full scope decision — see `06_DECISIONS_REQUIRED.md` Decision F |
| Built autonomously | No — correctly stopped per the mission's own stop conditions |

## 9. Hermes / Advanced Operations — **BLOCKED, zero repository evidence — see `12_HERMES_STATUS.md`**

| Field | Detail |
|---|---|
| Repository search performed | `grep -rli "hermes" --include="*.md" --include="*.js" --include="*.jsx" --include="*.json" --include="*.yml" --include="*.yaml" .` across the entire repo |
| Result | **Zero matches** in any source file, config file, workflow file, or documentation file. The only file containing the word "Hermes" is this session's own memory/state file (`CLAUDE_CONVERGENCE_STATE.md`, which is not part of the product repo — it's a working note, and even there it's recorded as "not an external protocol... architecturally unrelated to OOH Earth" from an earlier investigation). |
| Conclusion | There is no existing Hermes integration, specification, or reference anywhere to build against. Implementing "Hermes as the advanced protocol" without a concrete spec would mean inventing an integration from nothing — explicitly forbidden by the mission's own rules ("Do not fabricate an integration"). |
| Decision required | An exact specification of what Hermes is, what system it lives in, and what API/credential surface it exposes — see `06_DECISIONS_REQUIRED.md` Decision G |
| Built autonomously | No — correctly stopped, nothing to build against |

## 10. Fundraising / Business Intelligence — **PARTIAL, existing data only**

| Field | Detail |
|---|---|
| Current state | The product already collects real business-relevant data as a side effect of its core loop: brands, parent corporations, agencies, operators, sectors, locations, and (via `RelatedLocations`) corporate footprint relationships |
| What already exposes BI value | `/location/:id` (full advertiser chain), map brand/corp search (#93), corporate footprint cross-linking (#91), heat map (#92) — together these already let anyone browsing the product see "which corporations are most active where," without any new dashboard |
| What does not exist | A dedicated business-intelligence/CRM view (contacts, opportunities, campaigns-as-sales-objects) |
| Why not built further this pass | The brief explicitly says "do not build a giant CRM," and no concrete BI requirement beyond what's already exposed was specified. Building speculative dashboards without a named use case would be exactly the "manufactured work" the mission forbids. |
| Decision required | A specific BI use case (e.g. "show me total documented spend-adjacent exposure per corporation") would let this be scoped precisely — see `06_DECISIONS_REQUIRED.md` Decision H |
| Built autonomously | No further build — existing exposure judged sufficient absent a named requirement |

## 11. CI / Engineering Quality — **DONE for Playwright; PARTIAL for lint/typecheck/build/format**

| Field | Detail |
|---|---|
| Current state | `scripts/ci-test-summary.mjs` (PR #85) gives every Playwright job a Job Summary: pass/fail counts, failing test titles, `file:line`, trimmed error, artifact pointer. CodeQL-clean (a real backslash-escaping bug was found and fixed in that same PR). |
| What already works | `e2e`/`e2e-mobile` jobs in `.github/workflows/ci.yml` both call the summary script |
| What is missing | `Lint & Typecheck`, `Build`, and `Prettier` jobs have **no structured failure summary** — a failure there still requires reading raw logs, exactly the problem #85 solved for tests |
| Why not extended this pass | Correctly out of scope for this pass per explicit instruction ("do not sacrifice product work for cosmetic CI improvements") — flagged as a real, small, low-risk follow-up rather than started speculatively mid-mission |
| Decision required | None — this is safe to build any time; see `NEXT` in `04_REMAINING_WORK.md` |
| Built autonomously | Not this pass (deliberately deferred, not blocked) |

## 12. Release / Deployment — **BLOCKED on human GitHub Settings access (already diagnosed, not re-investigated)**

See `14_RELEASE_STATUS.md` for full detail — this is a **known, previously diagnosed** blocker, re-stated here per the mission's own instruction not to re-discover it.

## 13. Commercial Licensing — **VERIFIED EXISTING, unchanged**

| Field | Detail |
|---|---|
| Current state | Source code: **AGPL-3.0** (`LICENSE`). Non-code content/data/design: **CC BY-SA 4.0** (`LICENSE-CONTENT.md`). `package.json` is `"private": true`. |
| What was done | Verified, not changed — no licensing modification made, per explicit instruction |
| Decision required | If commercialization requires different terms (AGPL is strongly copyleft — a SaaS competitor could be legally required to open-source their modifications under it), that is a relicensing decision only Dave can make | See `15_LICENSING_STATUS.md` and `06_DECISIONS_REQUIRED.md` Decision I |
| Built autonomously | N/A — audit only |
