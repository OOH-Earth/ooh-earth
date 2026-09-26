# Evidence Linkage Engine — R&D Prototype

Status: **PROTOTYPE**. Not wired into the app, not deployed, not a dependency
of any existing code path. Pure research code demonstrating one technical
primitive against synthetic fixtures. Nothing here was built, tested, or
labeled as anything other than a prototype — see the Claim Labels section.

## Mission

OOH Earth already lets contributors capture a photo of a piece of
out-of-home advertising or an activist intervention as a `Location` record,
and lets other contributors re-check that same physical spot later as a
`FieldCheck` (CONFIRMED — read directly from `base44/entities/Location.jsonc`
and `FieldCheck.jsonc` on `origin/main` at `35b8ba3`). Today that produces a
pile of independent rows. Nothing in the repository (CONFIRMED — zero hits
for `embedding|vector|similarity|cosine|faiss|pgvector|qdrant|dedup|duplicate`
across `src/` and `base44/`) turns that pile into a timeline, or notices when
the same creative shows up at more than one physical placement.

This prototype asks: **how much of that can be done without a new model,
new infrastructure, or an extra LLM call per event** — and where does that
stop working?

## What it does

Two primitives, in `linkageEngine.cjs`:

1. **`buildTimeline(observations)`** — deterministic. Groups a `Location`'s
   own creation row plus all its `FieldCheck` rows (already linked by the
   real `location_id` foreign key — no similarity search needed, the FK
   already proves "same physical placement"), sorts them by time, and diffs
   consecutive pairs on `brand_name` / `parent_corp` / `campaign_name` /
   `condition` / `adbust_type` to emit typed change events
   (`intervention_appeared`, `intervention_removed`, `advertiser_replaced`,
   `condition_changed`). Zero ML. This is the top of the AI-architecture
   hierarchy (deterministic logic) and is realistically production-ready as
   specified.

2. **`findCandidateLinks(observations, opts)`** — the harder half of the
   brief's thesis: is the *same creative* showing up at a *different*
   `location_id`? Three gates, cheapest first:
   - geospatial (haversine distance ≤ `maxDistanceMeters`)
   - temporal (days apart ≤ `maxTimeWindowDays`)
   - visual similarity (dHash Hamming distance ≤ `hashDistanceThreshold`)

   Every surviving candidate carries `distance_meters`, `days_apart`,
   `hash_distance`, a `similarity_score`, a `confidence_tier`, and a plain
   `explanation` object — nothing is asserted as fact; this is a candidate
   list for a human or an LLM verification step to review, not an
   auto-linker.

## Why dHash, not an embedding model or an API call

Per the AI-architecture rule (deterministic → registry → geospatial →
**embedding/similarity model** → specialized CV → LLM → human), the
candidate-generation stage should use the *cheapest* layer that's reliable
enough to cut the search space before anything expensive runs. A difference
hash (dHash: downsample to 9×8 grayscale, encode adjacent-pixel brightness
gradients as bits, compare by Hamming distance) is:

- zero download (a few lines of arithmetic, not a model checkpoint)
- zero API cost, zero new secret, zero new vendor
- fully explainable (`hash_distance: 18/64` means something a reviewer can
  reason about; a 512-dim CLIP vector's cosine similarity does not, without
  more infrastructure to make it legible)
- robust to the case it's actually good at: near-duplicate photos (same
  crop, mild brightness/exposure drift, sensor noise) — exactly what
  happens when two different contributors photograph the same billboard
  from a similar angle within days of each other

It is a real, known technique, not a shortcut invented for this prototype.

## What it demonstrably cannot do (measured, not asserted)

TEST 3 in `benchmark.cjs` deliberately constructs a same-creative pair where
the second photo is a steep off-axis shot (shear + nonlinear remap, not just
crop/brightness). Measured dHash distance: **29/64** — well outside any
threshold that keeps precision usable (see the sweep table below). This
confirms, rather than assumes, the standard limitation of hash-based
similarity: it detects near-duplicates, not the same object from a
materially different viewpoint. Closing that gap for real needs a learned
visual embedding (e.g. a small CLIP-family model), which is an explicit
**NEXT/LATER** infrastructure decision (new compute, possibly a hosted
inference cost) — not something to bolt on speculatively now.

## Benchmark results (synthetic corpus, n=35, fully deterministic/seeded)

Run: `node benchmark.cjs` (no dependencies, ~350ms, exits 0 on pass).

- **Timeline diffing (TEST 1):** exact-match pass on a 3-observation
  synthetic timeline (intervention appears at day 12; full advertiser
  replacement + intervention removal + condition decay at day 40). This is
  logic correctness, not a statistical claim.

- **Cross-location candidate linkage (TEST 2):** threshold sweep over the
  one tunable parameter (`hashDistanceThreshold`), geospatial/temporal gates
  held fixed at 5000m/21 days:

  | threshold | candidates | TP | FP | FN | precision | recall | F1 |
  |---|---|---|---|---|---|---|---|
  | 8  | 0  | 0 | 0 | 3 | 1.000 | 0.000 | 0.000 |
  | 12 | 0  | 0 | 0 | 3 | 1.000 | 0.000 | 0.000 |
  | 16 | 1  | 1 | 0 | 2 | 1.000 | 0.333 | 0.500 |
  | **20** | **2** | **2** | **0** | **1** | **1.000** | **0.667** | **0.800** |
  | 24 | 8  | 3 | 5 | 0 | 0.375 | 1.000 | 0.545 |
  | 28 | 12 | 3 | 9 | 0 | 0.250 | 1.000 | 0.400 |
  | 32 | 13 | 3 | 10 | 0 | 0.231 | 1.000 | 0.375 |

  Best F1 at threshold=20 (precision 1.0, recall 0.667). Adversarial checks
  (same creative in a different city 67km away; a different creative in the
  same block) never leak in at the conservative end — proving the
  geospatial gate, not the hash, is what correctly rejects the
  visually-similar-but-wrong-city case.

- **⚠️ INSUFFICIENT DATA FOR A REAL PERFORMANCE CLAIM.** There are only 3
  positive examples in this fixture set. The sweep table demonstrates that
  the *pipeline* behaves the way the design predicts (gates compose
  correctly, there is a real precision/recall tradeoff, adversarial
  near-misses are rejected) — it does not and cannot tell you what recall
  or precision to expect on real photographs at real scale. That requires a
  benchmark built from real `Location`/`FieldCheck` data with human-labeled
  ground truth, which does not exist yet (would be the first NEXT-stage
  deliverable if this is pursued further).

- **Scale (TEST 4, extrapolated from a measured per-pair cost, not
  separately load-tested):** the naive O(n²) pairwise scan stays sub-second
  through ~n=1,000 observations and would take an extrapolated ~2 minutes
  at n=20,000. The fix when that becomes real is a deterministic geospatial
  pre-bucket (geohash/grid-cell grouping) before any hash comparison runs —
  not a new database. See Architectural Compatibility below for when an
  actual spatial/vector index would be justified.

## Architectural compatibility (how this could integrate — nothing here changes live architecture)

- **Ingestion point:** unchanged. `Location.create` / `FieldCheck.create`
  already exist; this reads their output, it doesn't touch how they're
  written.
- **Data representation:** would need one additive field on `Location`
  (e.g. a persisted image hash) — additive schema change, not a rewrite of
  existing fields. No existing field needs to change shape.
- **Indexing:** at prototype scale, none needed (linear scan). At real
  scale, a deterministic geohash bucket is sufficient for the geospatial
  pre-filter — still no new infrastructure. A true nearest-neighbor vector
  index (FAISS/pgvector/Qdrant) is only justified once the similarity
  signal is a real embedding vector (not a 64-bit hash, which a plain
  indexed integer column already handles fine) — i.e. only alongside the
  NEXT-stage embedding upgrade, not for this prototype's technique.
- **Query path:** `buildTimeline` per-location is a natural fit for
  computing on read (or on write, cached) via a Base44 function, the same
  shape as `fieldStats`. `findCandidateLinks` at real scale is a background
  job, not a request-time call (O(n²) even with pre-bucketing needs batch
  scheduling), which is a genuinely new architectural piece — a background
  worker — that Base44's function model doesn't obviously provide today;
  worth confirming before committing to this design further.
- **UI consumer:** a new "evidence timeline" panel on the Location detail
  page, and a moderation/review queue surfacing candidate links for a human
  (or, later, an LLM verification pass) to confirm/reject — never
  auto-asserted.
- **Model hosting:** none required for what's prototyped here. Only the
  NEXT-stage embedding upgrade would introduce a hosting/cost decision.
- **Cache strategy:** timelines are cheap to recompute on read; candidate
  links are the expensive part and are the natural cache/materialize
  target (recompute only when new observations land nearby in space+time).
- **Observability:** both primitives are pure functions over structured
  input, trivially unit-testable and loggable — no new observability
  primitive needed beyond what the existing telemetry lane already does for
  other functions (not touched by this prototype).
- **Failure mode:** both primitives fail closed by construction — an empty
  or malformed observation set produces an empty timeline/candidate list,
  never a false claim.
- **Migration path:** additive only. Existing `Location`/`FieldCheck` rows
  need no backfill to keep working; historical image hashing could be
  backfilled opportunistically, not as a blocking migration.
- **Is Base44 alone sufficient?** For `buildTimeline`: yes. For
  `findCandidateLinks` at meaningful scale: Base44's entity store is
  sufficient for storage (one new indexed field), but the O(n²)-with-bucketing
  batch job needs to run somewhere — a scheduled Base44 function is
  plausible for moderate scale; this would need validating against Base44's
  actual background-job/scheduling primitives before committing further,
  which this prototype did not investigate (out of scope, read-only lane).

## Claim labels

- **CONFIRMED:** `Location`/`FieldCheck` schemas, absence of any existing
  embedding/similarity/dedup code, AI confidence being dropped before
  `Location.create`, all benchmark numbers above (reproducible via
  `node benchmark.cjs`).
- **INFERRED:** that a geohash pre-bucket is sufficient up to real
  production scale (reasoned from the measured per-pair cost, not
  separately load-tested at n>33).
- **PROTOTYPE:** both `linkageEngine.cjs` functions — demonstrate the
  primitive, are not production-hardened (no input validation, no schema
  coupling to the real Base44 client).
- **UNVERIFIED:** dHash's real-world precision/recall on actual contributor
  photographs (explicitly flagged above, not glossed over); whether Base44
  supports the background-job model `findCandidateLinks` would need at
  scale.

## Running it

```
node research/evidence-linkage/benchmark.cjs
```

No dependencies, no network calls, no Base44 client — completely isolated.
