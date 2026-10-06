# OOH Earth — Data Intelligence Engine: Master R&D Report

Investigated at `origin/main` = `828dbdee3442148daf21feaf5862fabfe09b5058`.
Builds on PR #152 (Evidence Linkage Engine, prototype-only), PR #153
(Provenance model, design-only), PR #154 (real-evidence recon). This
report supersedes none of them — it synthesizes them against **new real
production numbers** gathered in this mission and revises the strategic
conclusion accordingly.

## A. Architecture map (CONFIRMED, from `base44/entities/` + `base44/functions/` + `src/` on current main)

| Layer | What exists |
|---|---|
| Ingestion | `FieldReport.jsx` (new `Location`) + `FieldCheckCamera.jsx` (new `FieldCheck`, its own separate client-side `InvokeLLM` call — not `scanAd`) + `importKmlLocations` (bulk import) |
| AI extraction | `scanAd` (server function, authenticated, one photo → Claude vision, single overall confidence, no persistence) |
| Deterministic registry | `advertiserRegistry.js` — static `PARENT_CORPS`/`AGENCIES` lists + `lookupParentCorpSector()`, used at capture time only |
| Verification | `status: pending/verified/rejected` on `Location`/`FieldCheck`; moderator edits via `LocationEditPanel.jsx` (`Location.update`, direct overwrite, no history) |
| Provenance | Computed transiently (`sectorConflict`, `ai_confidence`) then discarded before persistence — see PR #153 `TRUTH_TABLE.md` |
| Geo | Bounding-box query only (`fetchMapLocations`), no clustering/indexing |
| Search | None found (no semantic/faceted search anywhere) |
| Entity resolution | `advertiserRegistry.js` only, parent-corp→sector direction only (no brand→parent-corp) |
| Media | `Location.image_url` (single), `LocationPhoto` (gallery, separate entity), `FieldCheck.image_url` (per-check) — three unlinked photo locations |
| Temporal history | `FieldCheck.location_id` FK — architecturally present, **operationally unused in production** (see C) |
| Export/Analytics/Caching/Access control | out of this mission's scope except where cited (owned by the observability/revenue lanes, treated read-only) |

## B–C. Real dataset inventory (CONFIRMED, non-privileged production reads, this session)

969 `Location` rows total in production. **This is a much smaller and much
more skewed real dataset than the architecture would suggest:**

| Type | Total | With `brand_name` | With image | Verified |
|---|---|---|---|---|
| transit | 711 (73.4%) | 0 | 4 (0.6%) | 707 (99.4%) |
| billboard | 183 | 7 (3.8%) | 29 (15.8%) | 31 (16.9%) |
| digital | 52 | 5 (9.6%) | 29 (55.8%) | 27 (51.9%) |
| other | 16 | 0 | 16 (100%) | 9 (56.3%) |
| painted | 6 | 0 | 6 (100%) | 3 (50%) |
| mural | 1 | 0 | 1 (100%) | 1 (100%) |

`FieldCheck`: **0 rows, entire production.** `LocationPhoto`: **0 rows,
entire production.** `locations_with_two_or_more_observations: 0`.

**Reading:** the 711 `transit` rows are almost certainly a bulk-imported
geospatial base layer (near-zero images, zero brand names, 99.4%
auto/bulk-verified) — real, but not evidence in the "community observation"
sense. The genuinely organic, contributor-submitted evidence population is
the 258 non-transit rows, and even there, image/brand coverage is sparse
and concentrated unevenly (digital 55.8% imaged, billboard only 15.8%).

## D–I. Data-quality / provenance / longitudinal / geospatial / entity-resolution / evidence findings

- **`brand_name` field coverage: 12/969 (1.2%)**, `parent_corp`: 5/969
  (0.5%), `industry_sector`: 10/969 (1.0%), `campaign_name`: 8/969 (0.8%).
  This is the entire real advertiser-intelligence population — not a
  sample, the complete set.
- **Longitudinal/temporal evidence: zero.** The `FieldCheck` mechanism
  that the entire "temporal history" half of the original R&D thesis
  depends on has never been used in production. This is the single
  clearest disconfirming result from this whole R&D arc.
- **Real, live entity-resolution test against the actual
  `advertiserRegistry.js`** (12 real branded records, see
  `benchmark.mjs`): `industry_sector` coverage on this subset goes from
  10/12 (83.3%) to **12/12 (100%)** by running the existing registry
  function plus one small proposed extension. Two concrete real findings
  surfaced in the process: (1) **2/12 (16.7%) of real records have a
  parent-corp name typed into `brand_name`** ("McDonald's Corporation",
  "Nike Inc.") — a capture-time field-mixup, not a registry gap; (2)
  `advertiserRegistry.js` has real coverage gaps for brands actually
  advertising in this market (Chery, Zontes, Boon Rawd Brewery, MEA — none
  in `PARENT_CORPS`), though none blocked resolution *this* time because
  those records' `industry_sector` was already filled by another source.
- **A real duplicate-placement candidate exists**: two `billboard` rows,
  both `brand_name: "Zontes"`, different campaign taglines, found by
  string+type matching alone — zero image/geo/temporal computation
  needed. Correctly reported as an open question, not asserted as fact
  (would need the `lat`/`lng`/`created_date` this pass didn't fetch to
  resolve further).
- **Geospatial:** real coverage exists (all 969 rows carry `lat`/`lng`),
  but ~27-day date range and near-total absence of repeat visits means
  there's no density/hotspot signal worth computing yet beyond raw point
  count.

## J–K. Biggest asset / biggest weakness

**Biggest current real asset:** a large (969-row), real, verified,
geospatially-complete dataset — but its actual *intelligence* value is
concentrated in a small, high-quality subset (order of 250 organic
non-transit reports, of which only ~12 carry advertiser identification).

**Biggest current real weakness:** normalization/completeness, not
architecture. 98.8% of real `Location` rows have no `brand_name` at all.
The mechanisms to fill it (scanAd, the registry, manual entry) all work —
proven by the 12-record test — but they are barely being exercised. This
is upstream of every other capability in the flywheel: temporal linkage,
campaign grouping, monitoring, and briefs all require a normalized entity
first, and 98.8% of records don't have one.

## L. Canonical intelligence model — recommendation

Do **not** implement the full ENTITY/BRAND/PARENT/CAMPAIGN/CREATIVE/
PLACEMENT/OBSERVATION/EVIDENCE/CONTRIBUTOR/VERIFICATION/PROVENANCE/CHANGE
model as new entities now. Real data density does not justify it yet.

| Concept | Current representation | Proposed representation | Migration cost | Justified now? |
|---|---|---|---|---|
| Brand / Parent org | Flat strings on `Location` | Same, +brand→parent alias table (deterministic, code-only) | None — additive JS data | **Yes, NOW** |
| Provenance | Discarded (PR #153 finding) | `EvidenceProvenance` entity (PR #153 design) | New entity + 4 component edits | Deferred — see M |
| Placement/Observation/Change Event | `Location`+`FieldCheck` FK, unused | Derived view (`buildTimeline()`, PR #152) | None — pure function over existing data | Blocked on real `FieldCheck` adoption, not engineering |
| Campaign / Creative | Free-text `campaign_name`, no linkage | Candidate-linkage pipeline (PR #152) | None new — needs real image volume | Blocked on real data density (51 verified images total) |
| Evidence Graph | None | Not justified at 12-record scale | N/A | **LATER**, revisit at meaningfully higher density |

## M. Data flywheel — where it actually breaks

```
FIELD OBSERVATION → VERIFIED EVIDENCE → NORMALIZED OBSERVATION → ...
                                        ^
                                        BREAKS HERE (98.8% of records)
```

Everything downstream of normalization (entity+geo+temporal linkage,
historical intelligence, search/monitoring/briefs, institutional users,
more contributors) is irrelevant until this breakpoint is addressed,
because there is almost nothing to link, monitor, or brief yet. This is
the highest-leverage breakpoint by a wide margin — higher than any
downstream capability this whole R&D arc has investigated (visual
linkage, provenance auditability, etc.), because fixing it multiplies the
value of *every* downstream capability, while fixing any downstream
capability first would be built on top of almost no real data.

## N. Opportunity scorecard (1–10; for BUILD_COST/OPERATING_COST/PRIVACY_RISK/LEGAL_RISK/SECURITY_RISK, HIGH = BAD; all others HIGH = GOOD)

| Opportunity | USER_VALUE | COMMERCIAL_VALUE | TECH_DIFF | DATA_ADVANTAGE | DEFENSIBILITY | BUILD_COST↓ | OPERATING_COST↓ | PRIVACY_RISK↓ | TIME_TO_USEFUL_DATA |
|---|---|---|---|---|---|---|---|---|---|
| Entity resolution + completeness scoring (this mission's prototype) | 7 | 5 | 4 | 6 | 5 | 2 | 1 | 1 | **now — real data exists today** |
| Field-swap / capture-UX validation (McDonald's/Nike pattern) | 6 | 3 | 2 | 3 | 2 | 2 | 1 | 1 | now |
| Brand Evidence Monitor (as originally proposed) | 8 | 8 | 5 | 8 | 7 | 4 | 3 | 2 | **blocked — 12 real records, not monitorable** |
| Temporal change detection (PR #152 half) | 9 | 8 | 6 | 9 | 9 | 4 | 2 | 2 | **blocked — 0 real FieldChecks** |
| Cross-location creative matching (PR #152 half) | 7 | 7 | 6 | 7 | 7 | 5 | 3 | 2 | partially — 51 real verified images, still thin |
| Provenance/audit trail (PR #153) | 5 | 4 | 4 | 5 | 6 | 5 | 2 | 1 | independent of data density |

**Reasoning, not just totals:** Brand Evidence Monitor and temporal change
detection score highest on paper (user/commercial value, defensibility)
but are **structurally blocked by real data volume today**, not by
engineering effort — building them now would mean shipping a product on
12 and 0 real records respectively. Entity resolution + completeness
scoring scores lower on paper but is **immediately buildable and testable
against real data**, and is a genuine prerequisite multiplier for
everything above it in the table. That's why it's the chosen NOW slice
despite not topping the raw scorecard — Section 14 explicitly asks for
this kind of challenge, and the real numbers back it.

## O. Roadmap

- **NOW:** entity resolution + completeness scoring (built this mission,
  see below); a brand→parent-corp alias table extension to
  `advertiserRegistry.js` (proposed, not shipped — see
  `entityResolutionEngine.mjs`); field-swap validation at capture time
  (flag when a typed `brand_name` verbatim-matches a known parent-corp
  name); investigate *why* `FieldCheck`/`LocationPhoto` adoption is zero
  (UX/discoverability question, not an engineering one).
- **NEXT:** once real `FieldCheck` rows start appearing — wire up PR
  #152's `buildTimeline()` for real; once brand coverage grows
  meaningfully beyond ~12 — revisit Brand Evidence Monitor with a real,
  non-trivial N.
- **LATER:** cross-location creative matching at real scale (needs a
  meaningfully larger verified-image corpus than today's 51); PR #153's
  `EvidenceProvenance` entity, once there's enough volume that
  provenance auditability actually matters at scale.
- **MOONSHOT:** institutional evidence briefs / monitoring API — credible
  in principle, gated on NEXT/LATER actually happening first with real
  volume behind them, not speculative technology risk.

## P–Z, AC–AE. Strongest slice chosen, and what's real vs. synthetic

**Chosen: Entity Resolution & Completeness Engine** — not the originally
hypothesized "Brand Evidence Monitor v0." Explicitly rejected that
default per Section 14's instruction to challenge it: real data (12
branded records total) cannot support a "monitor" product; it can support
validating and hardening the deterministic resolution layer underneath
one, which is the actual current bottleneck (see M).

- **Who cares / who pays:** internal (OOH Earth's own moderators/data
  team) today — this is a data-quality instrument, not yet an external
  product. It becomes commercially adjacent the moment external evidence
  products (Section 11's list) are considered, because none of those can
  honestly be sold on a 1.2%-complete field.
- **Existing data enabling it:** the real `advertiserRegistry.js`
  (unmodified, imported directly) + the real 12-record branded population.
- **Missing data:** everything downstream needs real `FieldCheck` adoption
  and materially more branded `Location` volume — not an engineering gap,
  a usage gap.
- **Architecture:** pure functions, zero new Base44 entities, zero schema
  change, zero new infrastructure. Integration point (not built): call
  `resolveSector()` at capture time in `ReportScanner.jsx`/
  `LocationEditPanel.jsx` instead of the current silent
  `det.industry_sector || registrySector || data.industry_sector` merge,
  and persist `resolution.source` once `EvidenceProvenance` (PR #153)
  ships.
- **Privacy/legal/security:** brand/campaign names on a public
  advertisement are not personal data; the prototype touches zero
  identity fields, zero images, zero `--privileged` reads.
- **Build complexity:** low (built in this mission, ~200 lines). **Operating
  cost:** effectively zero (no LLM calls, no new infra). **Defensibility:**
  moderate on its own (the matching logic is simple), but it's the
  precondition for every higher-defensibility capability in this table —
  its value is multiplicative, not standalone.
- **Real vs. synthetic (Section 15/16 discipline):** the 12-record
  before/after resolution results, the field-swap finding, and the
  duplicate-candidate finding are **REAL, RUNTIME-VERIFIED** (production,
  non-privileged reads, this session). The 500-record stress test is
  **SYNTHETIC FUNCTIONAL PROOF — NOT REAL-WORLD PERFORMANCE EVIDENCE**,
  used only to confirm the code doesn't misbehave at larger N.
- **Empirical claims actually justified:** "the existing registry
  mechanism, applied deterministically, can take this real 12-record
  population from 83.3% to 100% sector coverage" — measured, reproducible
  (re-run `benchmark.mjs`). **Claims NOT justified:** any real precision/
  recall for temporal or visual linkage (still blocked, per PR #154);
  any claim that entity resolution "solves" data quality at OOH Earth
  scale — it was tested on 12 records, not a statistically meaningful
  population.
