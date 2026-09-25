# Multi-Brand / Ad-Observation Data Model — Architecture Decision Package

Investigation only. No implementation, no schema push, no migration, no production/BACKUP writes. Evidence gathered 2026-09-22 against `origin/main` at `0850422a84b09073d02ecf157ecded466f4f91dc` and production's live, authoritative data (read-only).

## 1. Current Location model, reconstructed from source

`base44/entities/Location.jsonc` fields, grouped by what they actually describe (not by declaration order):

**Physical-asset identity (long-lived, describes the structure itself):**
`title`, `type` (billboard/painted/digital/.../skatepark/basketball_court/multi_use_court/other), `address`, `lat`, `lng`, `access_key` (physical lock/key type for transit shelters), `condition` (infrastructure condition: functional/neglected/damaged/abandoned/reclaimed/upgraded), `ooh_operator` (media company that owns the structure — e.g. Clear Channel, Plan B). `setting`/`public_access` are physical-asset attributes too, but scoped to the Public Space facility subset of `type`.

**Time-varying commercial/observational data (what's currently displayed or claimed):**
`brand_name`, `parent_corp`, `ad_agency`, `campaign_name`, `industry_sector`, `harm_tags`, `harm_statement`, `action_flags`, `adbust_type`/`adbust_image_url` (activist-intervention state — also genuinely time-varying: a subverted billboard can be un-subverted or re-subverted), `graffiti_medium`/`graffiti_style`/`graffiti_surface_m2`/`graffiti_coverage_pct` (describes the *current* creative work, which can be painted over and replaced).

**Submission/moderation metadata:** `client_operation_id`, `status`, `status_updated_at`, `image_url`, `source_link`, `notes`, plus platform-managed `id`/`created_date`/`created_by_id`.

**Key finding: `Location` already conflates two lifetimes.** A billboard's physical existence (years) and its currently-displayed content (`brand_name` et al., which can change in weeks) are stored as sibling fields on the same record with the same lifecycle — editing `brand_name` via `LocationEditPanel.jsx` is an in-place overwrite with no history, identical in mechanism to editing `condition`, even though the two fields answer fundamentally different questions ("does the sign exist" vs. "what's on it right now").

`ooh_operator` is a partial exception worth naming precisely: it's declared as an advertiser-adjacent field ("Advertiser Intelligence" section in `LocationEditPanel.jsx`) but its actual meaning ("OOH media company that owns the structure") is physical-asset data, not commercial content — it's a naming/categorization inconsistency in the current schema, not a defect with user impact.

## 2. Brand/parent_corp consumer matrix

124 non-test references across `src/`. Grouped by workflow (full grep output preserved in `06-EVIDENCE-LOG.md`):

| Area | Files | Read/Write | Assumes singularity? | Impact if model changes |
|---|---|---|---|---|
| Submission (initial report) | `FieldReport.jsx`, `ReportStep2Identify.jsx`, `ReportScanner.jsx`, `AdScanLab.jsx`, `ArLens.jsx` | Write (`Location.create`) | Yes — one `brand_name`/`parent_corp` per submission, AI-detection-assisted | High — this is where a new Observation record would need to be created instead of/alongside the Location field |
| Re-check submission | `FieldCheckCamera.jsx` | Write (`FieldCheck.create`) | Yes — one `brand_name` per check, AI-assisted | Medium — `FieldCheck.brand_name` is *already* a de facto point-in-time observation; a formal Observation entity could absorb this role |
| Editing | `LocationEditPanel.jsx` | Write (`Location.update`) | Yes — destructive overwrite, no history kept | High — the single biggest source of "history loss" (see §6) |
| Location Detail display | `AdvertiserInfo.jsx`, `LocationDetail.jsx` | Read | Yes — renders one brand/parent/agency/operator/sector block | Medium — becomes "current/most-recent observation" instead of a static field |
| Re-check timeline display | `FieldCheckPanel.jsx`, `fieldCheckFreshness.js` (`detectChanges`) | Read | **No** — already compares brand_name across *multiple* FieldCheck rows and the original Location intake, reporting before/after | Low — this logic is the closest thing to a working prototype of the target model already |
| Cross-location brand search | `RelatedLocations.jsx` | Read | Yes — exact case-insensitive string match, capped at 200 most-recent-verified Locations fetched client-side | High — this is workflow #9's entire current implementation; genuinely can't scale or search reliably today |
| Gamification / discovery | `DiscoveryFeed.jsx`, `gamification.js`, `OperativeProfile.jsx` | Read | Yes — groups Locations by `brand_name` string (trimmed, lowercased) for badges/stats | Medium — would need to read from wherever "brand" ends up living |
| Map / list display | `LocationCard.jsx`, `markerUtils.js`, `Map.jsx` (search) | Read | Yes | Low — display-only, would just read a different (or additionally-populated) field |
| Moderation queue | `Dashboard.jsx` | Read | Yes, but already reads `brand_name` from **three different entities** (`Location`, `FieldCheck`, `LocationRelationship`) in the same queue UI — proof the pattern of "an entity with a `brand_name` field, moderated independently" is already normal in this codebase | Low — a 4th entity fits the existing pattern |
| Public Space "visible branding" | `PublicSpacePanel.jsx` | Read/Write (`LocationRelationship.create`) | No — **already draws an explicit epistemic distinction**: `Location.brand_name` renders as raw "Visible Branding... not a claimed relationship," while `LocationRelationship.brand_name` renders as a moderated sponsor claim | **This is the most important single finding in this investigation — see §5.** |
| Server-side field allowlist | `src/api/base44Client.js` | Read (query projection) | N/A | None — just needs the new field/entity added to the allowlist if introduced |

**Assumption of singularity is universal across every *display and search* consumer**, but **two consumers already treat brand as multi-valued/time-varying in practice**: `fieldCheckFreshness.js`'s `detectChanges()` (compares brand across time) and `PublicSpacePanel.jsx`/`LocationRelationship` (multiple brand claims per Location, moderated independently, explicitly distinguished from raw observation).

## 3. Domain semantics — answers grounded in source, not assumption

**A. Is Location a persistent physical OOH asset?** Yes, by `required: [title, lat, lng]` and by every physical-asset field listed in §1 — but it also carries current-commercial-content fields with no distinct lifecycle marker, so the record *represents* the physical asset while *also functioning as* the latest observation of it.

**B. Can advertiser/creative change without the physical asset changing?** Yes — confirmed by `LocationEditPanel.jsx` allowing `brand_name`/`parent_corp` edits independent of any physical-asset field, and by `adbust_type`'s own description ("Type of activist intervention, if any") implying it changes over the asset's life.

**C. Can multiple brands appear simultaneously?** Yes, confirmed by the reference case from `02-INCIDENT-MOBILE-LOCATIONS.md` (Samsung/Toyota on one billboard, represented today only via a manually concatenated string) and by production data (see §4: one real record, `"Leo Beer / Singha Sparkling Water"`, shows the identical pattern).

**D. Can one campaign occupy multiple Locations?** Architecturally yes (nothing prevents the same `campaign_name` string appearing on many `Location` rows), but there is no entity or index that treats a campaign as a first-class, queryable object — it's incidental string repetition, not a modeled relationship.

**E. Can multiple observations of the same Location occur over time?** Yes — this is exactly what `FieldCheck` already is (`location_id` FK, its own `brand_name`/`condition`/`adbust_type`, its own moderation, one-to-many against `Location`). It works today at the mechanism level; the gap is that its own `brand_name` field can only hold one value per check (so it can record a *change* over time but not *simultaneity* at one point in time).

**F. Do photos describe the physical asset, an advertisement, or both?** Both, undistinguished. `LocationPhoto` is a generic one-to-many gallery (`location_id`, `url`, `caption`) with no field indicating whether a given photo is evidence of the structure, the currently-displayed ad, or an activist intervention. `FieldCheck.image_url` and `Location.adbust_image_url` are separate, purpose-specific single-photo fields for their own contexts.

**G. Does FieldCheck represent verification of the asset, an observation, or a mixture?** A mixture, by design and by field list: `condition`/`access_key` are asset-verification fields; `brand_name`/`adbust_type` are commercial/creative observation fields; both share one moderation status. This mixture is not a bug — the product's real workflow (a re-check trip) naturally re-confirms the asset's existence *and* records what's currently on it in the same visit — but it means "verifying a FieldCheck" verifies both facts as one unit, which is a real limitation if a moderator trusts the asset-confirmation but doubts the brand claim (or vice versa).

**H. What does LocationRelationship represent, and does it fit for brand/ad relationships?** See §5 — it represents a *moderated, evidence-based claim about an ongoing relationship* (sponsorship/ownership/operation/naming rights) between a brand/organization and a Public Space facility. Its `relationship_type` enum (`sponsor`/`funder`/`operator`/`owner`/`delivery_partner`/`naming_rights`/`community_partner`) is semantically about durable *relationships*, not point-in-time *advertising placements* — an important distinction developed further in §5 and §7 (Option C).

**I. Which fields violate the natural lifetime of the Location record?** `brand_name`, `parent_corp`, `ad_agency`, `campaign_name`, `industry_sector`, `harm_tags`, `harm_statement`, `action_flags`, `adbust_type`, `adbust_image_url` — all describe *current or recent commercial/creative content*, which has a materially shorter natural lifetime than the physical structure. `graffiti_*` fields have the same issue for street-art content specifically.

**PRODUCT DECISION REQUIRED, flagged rather than assumed:** whether `ooh_operator` should be reclassified as physical-asset data (it describes who owns/operates the structure, not what's advertised on it) is a product naming/categorization call, not something source alone resolves — noted, not decided here.

## 4. Production data findings (read-only, aggregate only, via the authoritative API)

783 verified `Location` records (0 flagged `is_sample`, i.e., no synthetic/demo records in this count — this is real data).

| Metric | Count | % of 783 |
|---|---|---|
| Has `brand_name` | 15 | 1.9% |
| Has `parent_corp` | 7 | 0.9% |
| Has both | 7 | 0.9% |
| Has neither | 768 | 98.1% |
| Has `campaign_name` | 10 | 1.3% |
| Has `ad_agency` | 1 | 0.1% |
| Has `ooh_operator` | 7 | 0.9% |
| Has `industry_sector` | 13 | 1.7% |

**`brand_name` values containing a likely multi-brand delimiter (`/`, `&`, `+`, "and", comma):** 1 record — `"Leo Beer / Singha Sparkling Water"`. **`parent_corp` with the same pattern: 0.**

**Parent-corp naming consistency:** 7 distinct raw strings, 0 case/spacing variants of the same corp under different casing — too small a sample to call this "solved," but no evidence of an active normalization crisis either.

**Duplicate physical coordinates** (rounded to ~1m, appearing on 2+ `Location` rows): 3 clusters, all traced individually — none are the "same physical asset, different brand" scenario. They are genuinely distinct nearby structures (e.g., a digital screen and a phonebox at the same intersection) or, in one case, what looks like the same transit shelter reported twice with identical title/type/date — a submission-dedup question (already tracked separately, `submitOffline`'s dedup is by `client_operation_id` only, not physical position, per the existing multi-brand investigation in `02-INCIDENT-MOBILE-LOCATIONS.md`), not evidence bearing on this brand-model question.

**`FieldCheck`: 0 verified records exist in production.** The re-check/observation-history mechanism (`detectChanges`, `computeFreshness`, the FieldCheck timeline UI) is fully built and code-correct but has **never been exercised on real data**.

**`LocationRelationship`: 0 records exist in production.** Freshly shipped this session; genuinely untested against real usage yet.

**What this means for urgency:** the multi-brand-on-one-asset scenario this task is named for is real (proven by the reference case and by 1 production record) but is currently a **rare edge case, not a systemic problem** — under 2% of verified Locations carry any brand data at all, and only 1 in 783 shows the actual multi-brand symptom. This should directly inform how much implementation effort is justified right now (see §14–15).

## 5. LocationRelationship — the single most important existing artifact for this decision

Full schema in §0 evidence; the load-bearing details:

- **Cardinality:** `Location` 1:N `LocationRelationship` — already exactly the shape a brand/ad-observation model would need.
- **Fields:** `location_id`, `brand_name`, `relationship_type` (enum), `evidence_source` (free text), `evidence_field_check_id` (optional FK to `FieldCheck` — **already links a claim to a specific observation/photo**), `verified_date`, `notes`, `status` (pending/verified/rejected).
- **Moderation:** identical RLS pattern to `Location`/`FieldCheck` (admin/moderator/agency write lock on `status`), moderated via the same generic `moderate` function (`ENTITIES = new Set(['Location', 'DigitalBust', 'FieldCheck', 'LocationRelationship'])`) — verifying a `LocationRelationship` does **not** cascade to or from verifying its `Location` (confirmed by reading `moderate/entry.ts`: each entity is updated independently by `{entity, id, status}`; only `LocationPhoto` cascades, and only from `Location`). **This directly satisfies §10's core requirement — a moderator verifying the physical asset does not implicitly verify every relationship/ad claim about it, and this separation already exists and is proven in production.**
- **Epistemic design already present:** `relationship_type` explicitly stays `"unknown"` until `evidence_source` is reviewed — "a visible logo alone is never sufficient." `PublicSpacePanel.jsx`'s own UI copy draws the exact distinction this whole investigation is about: `Location.brand_name` = "Visible Branding... not a claimed relationship" (raw, unverified observation) vs. `LocationRelationship` = a moderated, evidence-backed claim.

**Why it's not simply reusable as-is (Option C, evaluated fully in §7):** `relationship_type`'s enum vocabulary (sponsor/funder/operator/owner/delivery_partner/naming_rights/community_partner) describes *durable, often non-commercial relationships to a facility* — the semantic frame is "who has a stake in this place," built for skateparks/courts. An OOH advertising placement is a *point-in-time commercial rental of surface space*, frequently rotating, with no implied ongoing relationship between the brand and the structure. Adding `"advertiser"` to this enum would work mechanically but would blur two conceptually distinct real-world relationships under one field — exactly the overload risk this task's own instructions warn against rejecting for.

## 6. User workflows under the current system

| # | Workflow | Current behavior |
|---|---|---|
| 1 | Discover a new billboard | **WORKS.** `FieldReport.jsx` → `Location.create`, physical + commercial fields captured together in one submission. |
| 2 | Report the current brand | **WORKS.** `brand_name`/`parent_corp` set at creation, AI-assisted via `ReportScanner`/`ArLens`/`AdScanLab`. |
| 3 | Brand changes later | **AMBIGUOUS / LOSES HISTORY.** Either (a) `LocationEditPanel.jsx` overwrites `Location.brand_name` in place with zero audit trail, or (b) a new `FieldCheck` is filed with a different `brand_name`, which `detectChanges()` *can* surface as a before/after diff in the timeline UI — but this only works if a FieldCheck is filed; a direct edit silently destroys the prior value. |
| 4 | Two brands share one site | **CANNOT REPRESENT CLEANLY.** Manual string concatenation only (the Samsung/Toyota case; the one production example). No structured multi-value support on `Location`; `FieldCheck.brand_name` has the identical single-value limitation. |
| 5 | One campaign, 100 sites | **WORKS, but not analytically.** `campaign_name` can be repeated across 100 `Location` rows with no query/rollup treating it as one object — no aggregate view exists. |
| 6 | Upload photo proving the current ad | **WORKS** via `Location.image_url`/`FieldCheck.image_url`, but **AMBIGUOUS**: nothing distinguishes "photo of the structure" from "photo proving this specific ad" once in `LocationPhoto`'s generic gallery. |
| 7 | Moderator verifies the physical asset | **WORKS**, and correctly does **not** force-verify commercial content — `Location.status` and any linked `FieldCheck`/`LocationRelationship` status are independent (§5). |
| 8 | Moderator verifies/corrects the advertised brand | **WORKS for `FieldCheck`/`LocationRelationship`** (their own independent moderation) but **AMBIGUOUS for `Location.brand_name` itself** — an admin editing it directly via `LocationEditPanel.jsx` is a silent overwrite, not a moderated claim with an evidence trail. |
| 9 | Search all Samsung appearances | **IS AWKWARD / CANNOT SCALE.** `RelatedLocations.jsx` fetches up to 200 most-recent-verified `Location` rows client-side and does an exact, case-insensitive string match — misses any Samsung location outside that 200-record window, and would not match "Samsung" against "Samsung Electronics." No server-side search or index exists. |
| 10 | Historical observations for one physical asset | **PARTIALLY WORKS.** The `FieldCheck` timeline (`FieldCheckPanel.jsx`) already shows this, when checks exist — but zero real `FieldCheck` rows exist in production today (§4), so this is unproven at scale, and it still can't represent *simultaneous* multi-brand state, only sequential single-value changes. |
| 11 | Brand/corporation analytics | **CANNOT REPRESENT RELIABLY.** `gamification.js`'s brand-grouping and `OperativeProfile.jsx`'s per-user brand stats both do exact-string grouping on whatever free text happens to be in `brand_name` — no normalization, so "Samsung" and "Samsung Electronics" would never merge into one analytic bucket. |

## 7. Architecture options

### Option A — keep Location singular

Continue treating `Location.brand_name`/`parent_corp` (and siblings) as "the current/latest advertiser," unchanged.

- **Simplicity:** highest — zero schema change, zero migration, zero new UI.
- **History:** none; every edit is destructive (as it is today).
- **Multi-brand:** unsupported except by manual concatenation (as today).
- **Analytics:** unreliable (free-text exact match only, as today).
- **Migration cost:** zero.
- **UI impact:** zero.
- **Long-term limitation:** the underlying problem (conflated lifetimes, no audit trail, no simultaneity) persists and compounds as more brand data accumulates — but at **1.9% current field-fill rate**, the compounding is currently slow.

### Option B — Location + generic Observation/Ad record

A new entity (e.g. `AdObservation`) represents a point-in-time (or interval) commercial observation at a `Location`, decoupled from the physical-asset record. `Location` keeps its physical-asset fields and, for backward compatibility, its existing `brand_name`/`parent_corp` as a denormalized "current known state" convenience field (kept in sync by the newest verified Observation, not hand-edited).

- **Represents multiple simultaneous brands:** yes, natively (N rows per `Location`).
- **Preserves history:** yes, by construction (rows are never overwritten, only added).
- **Represents brand changes:** yes, cleanly (a new row, not an edit).
- **Campaign analytics:** possible if `campaign`/`brand` fields are consistently populated (does not solve normalization on its own — see §9).
- **Conceptual clarity:** high — cleanly separates "what is this structure" from "what's currently on it."
- **Compatibility with current UI:** moderate effort — every consumer in §2's matrix that reads `Location.brand_name` for display would need to read from the newest Observation instead (or from the denormalized convenience field, minimizing UI churn).
- **Implementation scope:** new entity + RLS (matching the existing `Location`/`FieldCheck`/`LocationRelationship` pattern almost exactly) + submission-flow changes + moderation-queue addition (mechanically simple, given `moderate`'s generic `ENTITIES` design) + read-path changes across the consumer matrix.
- **Migration complexity:** low if additive (existing `Location.brand_name` values become the "observation #0" seed data, or are simply left as the compatibility field — no forced backfill required).

### Option C — extend LocationRelationship

Add `"advertiser"` (or similar) to `LocationRelationship.relationship_type`'s enum and reuse the entity for OOH ad placements.

- **Represents multiple simultaneous brands:** yes, mechanically identical to Option B (same 1:N shape).
- **Preserves history:** yes.
- **Implementation scope:** smallest of the two real options — no new entity, one enum value + minor UI wiring.
- **Conceptual clarity: LOW — this is the deciding factor against this option.** `relationship_type`'s existing vocabulary (sponsor/funder/operator/owner/delivery_partner/naming_rights/community_partner) describes durable stakeholder relationships to a public facility; a rotating billboard ad is not a "relationship" to the structure in the same sense, has different real-world temporal characteristics (weeks, not years), and conflating the two would make `LocationRelationship`'s own moderation UI (`PublicSpacePanel.jsx`, `Dashboard.jsx`) show two unrelated domains under one label. **Per this task's own explicit instruction ("Reject this option if it overloads an entity with unrelated meanings"), Option C is rejected** — not because it wouldn't work mechanically, but because it would blur a real conceptual distinction the product has already, correctly, drawn (§5).

### Option D — new entity, modeled directly on LocationRelationship's proven shape (recommended direction — see §15)

Structurally near-identical to Option B, but named and scoped explicitly as the advertising/ad-observation counterpart to `LocationRelationship`'s facility-relationship domain, rather than a generic all-purpose "Observation." This is not "enterprise over-modeling" — it's applying a pattern this codebase has already built, tested, and proven safe (identical RLS shape, identical moderation mechanism, identical evidence-linkage-to-FieldCheck idea) to an adjacent, genuinely distinct domain, instead of stretching an existing entity to cover both.

## 8. Cardinality and lifetime (for the recommended shape)

```
Location        1 : N   AdObservation
Location        1 : N   FieldCheck            (existing, unchanged)
Location        1 : N   LocationPhoto         (existing, unchanged)
Location        1 : N   LocationRelationship  (existing, unchanged — sponsorship/ownership domain only)
FieldCheck       0..1 : N   AdObservation      (an observation MAY cite the FieldCheck visit it was recorded during — optional, mirrors LocationRelationship.evidence_field_check_id)
AdObservation    N : 1   Location
```

Lifetimes, grounded in what's actually observed in this codebase/data rather than invented:
- **Location:** years (matches `condition` enum's own long-lived states: functional/neglected/damaged/abandoned/reclaimed/upgraded).
- **AdObservation:** days to months (an OOH campaign's typical rotation — no fixed number should be hardcoded; matches this project's own established philosophy of not inventing an arbitrary freshness threshold, per `fieldCheckFreshness.js`'s own comment on the same subject).
- **FieldCheck:** point-in-time (a single visit).
- **Brand identity** (if ever normalized — §9): long-lived, effectively permanent.

No "Campcampaign" or "Creative" entity is proposed as a v1 requirement — §4's data shows `campaign_name`/`ad_agency` fill rates under 1.3%, far below the threshold that would justify their own first-class entities right now. They should remain free-text fields on `AdObservation`, exactly as they are on `Location` today (additive, no new modeling burden).

## 9. Brand identity — normalization question

Evidence: `advertiserRegistry.js` already exists and is instructive — it's a **curated, hardcoded suggestion list** (`<datalist>` autocomplete) mapping known `parent_corp` strings to `industry_sector`, explicitly *not* a normalized entity with foreign keys ("PARENT_CORPS/AGENCIES stay flat string arrays... do not change their shape"). `brand_name` itself has no registry at all today — fully free text.

- **Free text (current state):** simplest, already what exists, but confirmed unreliable for analytics/search (§6, workflow 9/11) — "Samsung" vs. "Samsung Electronics" never merge.
- **Normalized entity:** would solve merging but requires an editorial/curation process this project doesn't currently have infrastructure for, and risks the exact over-modeling this task's instructions warn against — most of these operative-submitted brand names will never need cross-referencing.
- **Recommended: hybrid, matching the pattern `advertiserRegistry.js` already established.** Keep `brand_name`/`parent_corp` as the free-text, always-populated "as submitted" values (never blocked by normalization), and layer a lightweight, curated suggestion list on top (extending the existing registry to include well-known brand names, not just parent corps) purely for autocomplete and *optional* sector-inference — never a hard requirement, never a foreign key. This defers the harder "did these two rows mean the same brand" problem until real evidence (e.g., recurring search failures) justifies solving it, rather than building a full brand-entity system speculatively.

## 10. History and moderation separation

Already proven safe and already live in the current architecture (§5): `Location`, `FieldCheck`, and `LocationRelationship` are each moderated independently via the generic `moderate` function's `{entity, id, status}` shape, with zero cross-entity cascade except the one deliberate `LocationPhoto` cascade from `Location` verification. A new `AdObservation` entity would need only:
1. Its own RLS matching the established `create: null` / self-or-moderator `update` / admin `delete` pattern (identical to `LocationRelationship`'s).
2. One addition to `moderate/entry.ts`'s `ENTITIES` set.
3. A queue entry in `Dashboard.jsx` (which already reads from 3 different entities in one queue UI — a 4th is not a new pattern).

This cleanly satisfies the explicit requirement: verifying a `Location` (the physical asset exists) would **not** automatically verify any `AdObservation` (a specific brand claim) about it, exactly as `LocationRelationship` already behaves today.

## 11. Backward compatibility / migration

- **No destructive migration required for any option.** `Location.brand_name`/`parent_corp`/etc. can remain exactly as they are — every current consumer keeps working unmodified — while `AdObservation` is introduced purely additively.
- **Compatibility strategy:** treat `Location.brand_name` as a **denormalized "current known observation" cache**, updated by the newest *verified* `AdObservation` for that Location (mirroring how `status_updated_at` already works for `Location.status`) rather than hand-edited directly. This means:
  - Every existing read-only consumer (§2's display/search/gamification rows) keeps working with zero code change, reading the same field.
  - `LocationEditPanel.jsx`'s direct-edit path would eventually be replaced by "submit a new AdObservation" (closing the history-loss gap), but this can happen in a later phase — nothing forces it on day one.
  - The 15 production records that already have `brand_name` set need **no backfill at all** if the compatibility field is simply left as-is; they only "become" observation #0 if/when someone explicitly chooses to seed history for them, which is optional, not required.
- **Migration required:** none. This is the single clearest advantage the additive approach has over a destructive schema replacement.

## 12. Security / permissions (conceptual only — no rule changes under this prompt)

Directly inherits the already-established, already-audited pattern (Phase 2 hardening, `04-SECURITY-QUEUE.md`):
- **Create:** any authenticated user (matching `LocationRelationship`/`FieldCheck`'s `create: null`, i.e., open to any signed-in submission, consistent with this app's contributor model).
- **Edit own, pending only:** the submitter can edit their own pending `AdObservation` before moderation (matching `created_by_id` self-edit clauses elsewhere).
- **Moderate (verify/reject):** admin, `access: admin`, `access: moderator`, or `agency: true` — the exact same `$or` clause already used on `Location.status`/`FieldCheck.status`/`LocationRelationship.status`. **No new self-verification path** — this explicitly avoids repeating the exact class of bug the Phase 2 hardening fixed (a submitter approving their own claim).
- **Delete:** admin only, matching every other moderated entity here.

## 13. Product UX consequences (minimum viable, not a full redesign)

- **Submission:** `FieldReport.jsx`'s existing brand/parent_corp fields become the *first* `AdObservation` instead of (or in addition to) direct `Location` fields — the form itself barely changes.
- **Location Detail:** `AdvertiserInfo.jsx` reads the newest verified `AdObservation` (or the denormalized cache field — no visible change to a user) plus, additively, a "history" affordance if 2+ observations exist (reusing the exact `detectChanges`/timeline pattern `FieldCheckPanel.jsx` already has working).
- **Map/Globe:** no change — marker/card display reads the same cache field.
- **Search:** the real fix for workflow #9 is server-side (a proper `filter`/query against `AdObservation.brand_name` instead of a 200-row client-side scan) — this is a genuine improvement unlocked by the new entity, not required for v1.
- **Brand pages:** out of scope for a v1 — nothing here requires a dedicated brand landing page.
- **Moderation:** `Dashboard.jsx` gains a 4th queue source, same list-item pattern already used for the other 3.
- **User profile/contributions:** `OperativeProfile.jsx`'s brand-discovery stat can keep working unchanged against the cache field, or be enhanced later to count distinct `AdObservation` submissions.
- **Analytics:** unlocked, not required — a future aggregate view becomes possible once real `AdObservation` volume exists; not part of a minimum v1.

## 14. Phased delivery plan (derived from evidence, not templated)

Given §4's finding that this is currently a **low-volume, low-urgency problem** (1.9% field-fill rate, 1 real multi-brand record), every phase below is written to be independently stoppable — there is no product requirement to complete all phases quickly.

- **Phase 0 — prove the shape on BACKUP only.** Add the `AdObservation` entity schema (RLS matching §12) to a BACKUP-only push; no frontend change. Verify via the authoritative `entity-schemas` API, exactly as every prior entity change this project has done. *Risk: none (BACKUP-only, additive, no consumer reads it yet). Rollback: delete the unused entity. Production write: none.*
- **Phase 1 — additive backend + one submission path.** Wire `FieldReport.jsx`'s brand fields to also create an `AdObservation` row (Location fields stay as the compatibility cache, still written the same way as today). *Risk: low (additive write, no existing read path changes). Rollback: stop writing the new entity; nothing reads it yet, so this is a no-op revert. Production write: entity schema push + one frontend deploy, both narrowly scoped.*
- **Phase 2 — moderation queue integration.** Add `AdObservation` to `moderate/entry.ts`'s `ENTITIES` set and `Dashboard.jsx`'s queue. *Risk: low (mirrors 3 already-working integrations). Rollback: remove from the Set/queue. Production write: one function deploy, one frontend deploy.*
- **Phase 3 — Location Detail reads from AdObservation.** Switch `AdvertiserInfo.jsx` to read the newest verified `AdObservation` (or keep reading the cache field, now kept in sync by Phase 1/2's writes — implementation detail to decide at build time, not here). Add the history/diff UI reusing `detectChanges()`. *Risk: medium (a real read-path change on a high-traffic page) — qualify thoroughly on BACKUP first, exactly per this project's standing release runbook. Rollback: revert to reading `Location.brand_name` directly. Production write: frontend-only.*
- **Phase 4 — server-side brand search.** Replace `RelatedLocations.jsx`'s 200-row client-side scan with a real `AdObservation.filter({brand_name: ...})` query. *Risk: low, purely additive improvement. Production write: frontend-only.*
- **Phase 5 — optional legacy-field handling.** Only once `AdObservation` has real adoption: decide (a product decision, not an engineering default) whether `LocationEditPanel.jsx`'s direct `brand_name`/`parent_corp` edit fields should be retired in favor of "submit a new observation," or kept as an admin-only override path. *Not scheduled; revisit only when real usage data justifies it.*

Each phase's "qualification strategy" follows this project's own established, already-proven discipline (`03-RELEASE-RUNBOOK.md`): isolated worktree → focused tests → BACKUP deploy → authoritative-API/live verification → human authorization for the exact production write → deploy → verify → document. Nothing here proposes skipping any of those gates.

## 15. Decision matrix

| Dimension | A (status quo) | B (generic Observation) | C (extend LocationRelationship) | D (new entity, LocationRelationship-shaped) |
|---|---|---|---|---|
| Represents multiple simultaneous brands | No | Yes | Yes | Yes |
| Preserves history | No | Yes | Yes | Yes |
| Represents brand changes cleanly | No (destructive edit) | Yes | Yes | Yes |
| Supports campaign analytics | No | Partial (needs §9) | Partial (needs §9) | Partial (needs §9) |
| Conceptual clarity | Low (conflated lifetimes) | Medium (generic name) | **Low (domain overload — rejected)** | **High** |
| Compatible with current UI | Trivially (it IS current UI) | Needs cache-field bridge | Needs cache-field bridge | Needs cache-field bridge |
| Implementation scope | None | Medium | Smallest | Medium (~same as B, clearer scoping) |
| Migration complexity | None | None (additive) | None (additive) | None (additive) |
| Moderation complexity | N/A | Low (proven pattern) | Low (proven pattern, wrong domain) | Low (proven pattern, right domain) |
| Rollback complexity | N/A | Low (unused entity/field) | Low, but reverting a shared enum value is messier once other relationship types coexist with it | Low (unused entity/field) |
| Future extensibility | Poor | Good | Poor (domain conflict compounds) | Good |

**RECOMMENDED_MODEL: Option D** — a new `AdObservation` entity, structurally modeled on `LocationRelationship`'s already-proven shape (same RLS pattern, same generic `moderate` integration, same optional `evidence_field_check_id` link), kept conceptually separate from `LocationRelationship`'s facility-relationship domain. `Location.brand_name`/`parent_corp`/etc. remain in place, unchanged, as a denormalized "current known state" compatibility cache — no destructive migration, no forced backfill, every existing consumer keeps working.

**RECOMMENDATION_CONFIDENCE: Medium-high on the *shape* (strongly evidenced by §2/§5/§10 — this pattern is already proven safe and working three times over in this exact codebase), lower on the *urgency* (§4's production data shows this is a real but currently rare edge case — 1.9% field-fill rate, 1 actual multi-brand record in 783).** The honest recommendation is: adopt this as the target shape *when* implementation is warranted, but do not treat it as urgent. Phase 0 (schema-only, BACKUP-only, zero consumer impact) could reasonably be done at any time with negligible risk; Phases 1+ should wait for either (a) real growth in ad-industry-focused submissions, or (b) a second real multi-brand case surfacing, whichever comes first — both are cheap, low-risk signals to watch for rather than reasons to build now.

## 16. Product decisions required (not silently decided)

1. **Timing/priority**: given §4's low current prevalence, is this worth resourcing now, or should it wait for a clearer volume signal? (This document recommends waiting, but that's Dave's call, not an engineering default.)
2. **`ooh_operator` reclassification**: should it move conceptually to "physical-asset data" (it describes structure ownership, not advertised content)? Cosmetic/documentation-only either way, but worth an explicit answer before any schema cleanup touches it.
3. **Cache-field write path** (Phase 1/3 implementation detail): should `Location.brand_name` keep being directly writable by `LocationEditPanel.jsx` indefinitely (an admin override path), or should that field eventually become read-only/derived once `AdObservation` exists? Not needed for Phase 0-2; flagged for when Phase 3+ is actually scoped.
4. **Brand suggestion registry scope** (§9): is extending `advertiserRegistry.js` to include well-known *brand* names (not just parent corps) worth the curation effort, or should brand stay purely free-text with no suggestions at all?

## 17. Risks

- **Risk of doing nothing (Option A indefinitely):** compounds slowly given current low volume, but the Samsung/Toyota-style manual workaround becomes more common as ad-industry-focused submission tooling (the AI scanners, `advertiserRegistry.js`, harm-tag system) gets more real use — these already exist and are clearly intended for heavier use than 1.9% fill rate suggests.
- **Risk of building Option D too early:** low-to-moderate engineering effort spent on an entity with near-zero real usage initially (mirroring `LocationRelationship`'s own current zero-row state, 3 months after a similar build) — mitigated by treating Phase 0 as genuinely optional-and-cheap rather than committing to the full phased plan on a fixed timeline.
- **Risk of choosing Option C instead:** domain overload inside `LocationRelationship` would be materially harder to unwind later than simply not having built `AdObservation` yet — an argument for waiting rather than for taking the cheaper-looking option under time pressure.
