# Real-Photo Benchmark Design (Evidence Linkage Engine)

## Data availability check (Mission 4, done first)

Searched the entire repository for any real photographic content:
`e2e/fixtures/test-image.png` and `test-image-2.png` are the only image
fixtures referenced anywhere near the report/scan flow. Pulled both from
`origin/main`: **both are 1×1 pixel PNGs** (70 bytes, pure upload-mechanism
test stubs). `e2e/screenshots/**` and `delivery/**/screenshots/**` are
Playwright UI screenshots of the app itself, not field photography.

**Conclusion: zero real OOH photographs exist anywhere in this repository,
committed history, or test fixtures.** Per this mission's explicit
instruction, no images were fabricated or scraped to fill this gap. What
follows is the harness and label schema only — **no populated dataset**.

## Benchmark unit

One **labeled pair** of real photographs, each shaped like a real
`Location`/`FieldCheck` image submission (same fields the Truth Table
documents: `lat`, `lng`, `created_date`, `brand_name` if known), plus a
`relationship` label from the schema below. A benchmark run is a set of
pairs with known ground truth, evaluated exactly the way `benchmark.cjs`
in PR #152 evaluates synthetic pairs — same metric code, real input.

## Label schema

```jsonc
{
  "pair_id": "string",
  "photo_a": { "url_or_path": "string", "lat": "number", "lng": "number", "captured_at": "ISO 8601" },
  "photo_b": { "url_or_path": "string", "lat": "number", "lng": "number", "captured_at": "ISO 8601" },
  "relationship": {
    "type": "same_placement_same_time"       // trivial positive: same location_id, near-simultaneous
             | "same_placement_different_time" // FieldCheck re-observation case
             | "same_creative_different_placement" // the hard cross-location positive
             | "same_brand_different_creative"     // negative: same advertiser, different creative — must NOT link
             | "unrelated"                          // negative: nothing in common
  },
  "perturbation_class": "none"          // identical conditions
                       | "viewpoint_angle"  // different photography angle
                       | "lighting_weather" // different time of day / weather
                       | "partial_occlusion" // pedestrian, vehicle, foliage blocking part of the creative
                       | "crop_zoom",       // different framing/distance
  "labeler_confidence": "high | medium | low",  // the human labeler's own certainty — a benchmark on human-uncertain pairs is not trustworthy ground truth
  "notes": "string — free text, e.g. why this pair is hard"
}
```

Every `relationship.type` needs coverage at **every** `perturbation_class`
that's physically plausible for it before precision/recall numbers from
this benchmark should inform a production threshold decision. The
synthetic benchmark in PR #152 already covers `viewpoint_angle` (Cluster E)
and demonstrated the technique's real limitation there — a real-photo
benchmark's most valuable contribution is `lighting_weather` and
`partial_occlusion`, which cannot be honestly simulated synthetically.

## Where this data would have to come from

Not investigated further here (out of the read-only recon scope), but the
only legitimate sources are: (1) OOH Earth's own future contributor
submissions, once collected with consent under the existing capture flow
(the honest path — wait for real data rather than backfill from
elsewhere); (2) an explicit, separately-authorized decision to source a
small licensed/public-domain OOH photography set for calibration only,
never presented as OOH Earth field evidence. Scraping arbitrary web images
is explicitly out of scope per this mission's constraints and was not
attempted.

## Mission 5 — evaluation plan (metrics + thresholds, defined before any real run)

| Metric | Definition | Why it's tracked |
|---|---|---|
| Precision | TP / (TP + FP) among surfaced candidates | False links are worse than missed ones for evidence claims |
| Recall | TP / (TP + FN) | How much real linkage the pipeline misses |
| F1 | harmonic mean | Single-number tuning signal, never the sole gate |
| Top-k candidate recall | fraction of true links present in the top-k ranked candidates for a given observation | If used as a reviewer worklist, k matters more than a hard threshold |
| **False-link rate** | FP / total candidates surfaced | **The metric that gates production use** — see below |
| Candidate-reduction ratio | 1 − (candidates / raw pairs) | Proves the geospatial/temporal gates are doing real work before any expensive step runs |
| Latency per observation | wall-clock cost of evaluating one new observation against the existing corpus | Determines whether this can run at request time or must be a background job |

### Why false-link rate outranks recall here

This mission is explicit: *"We would rather miss a candidate than
incorrectly assert a relationship."* A missed link is an opportunity cost
— an institutional user's query returns slightly less. A false link is a
**trust failure** — it can misattribute a creative to the wrong campaign
or wrong physical location in what's presented as evidence. Every design
decision in PR #152 already reflects this (candidates are never
auto-asserted, always routed to human/LLM review) — this benchmark's
thresholds must preserve that asymmetry, not just optimize F1.

### Production-relevant thresholds (defined now, before any real data exists)

- **False-link rate must be ≤ 2%** measured on the real-photo benchmark
  before `findCandidateLinks()`'s output is shown to *any* user as
  anything other than a moderation-queue candidate (never as an assertion
  on a public page).
- **Recall below 100% is acceptable and expected** — the honest target is
  "high enough to be useful as a review-queue prioritizer," not
  "complete." No specific recall floor is set here because it depends on
  review-queue capacity, a product decision, not a technical one.
- **Any single perturbation_class with false-link rate > 5%** on its own
  slice disqualifies that class from auto-surfacing until addressed
  (e.g., if `lighting_weather` pairs blow the budget while others don't,
  ship candidate linkage without that class rather than block on all of
  them, or without candidate linkage for pairs captured more than N hours
  apart in very different ambient light — a deployable mitigation, not a
  blocker).
- These thresholds apply **only when real labeled data exists**. The
  synthetic benchmark's numbers (PR #152) are explicitly not used to
  clear this gate — restated from that PR's own README: "insufficient
  data for a real performance claim."
