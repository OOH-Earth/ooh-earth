# Geospatial intelligence foundation

This is a data and algorithm contract, not a Map rewrite. Current `Location`
records contain latitude/longitude, moderation status, timestamps, type, and
optional media/evidence fields. `FieldCheck` links to a location and carries
coordinates, status, condition, and optional media. Interactive retrieval is
already viewport-bounded; empty data is not evidence of no inventory.

## Location quality

The repository now provides deterministic primitives for coordinate validity,
evidence freshness, moderation state, possible duplicate candidates, and
bounded geographic coverage. Results are explainable:

- `VERIFIED`: valid coordinates, verified status, and current evidence;
- `LIKELY_VALID`: valid coordinates and current but unverified evidence;
- `NEEDS_REVIEW`: valid coordinates but unknown evidence freshness;
- `STALE`: evidence older than the configured threshold;
- `INSUFFICIENT_DATA`: invalid/missing coordinates or no usable record.

These are classifications, not confidence scores. Duplicate detection only
proposes coordinate-proximity pairs, is capped, and never merges or deletes.

## Freshness and coverage

Freshness is policy-driven and must be supplied by the caller for a specific
use case; the initial bounded default is one year for location evidence. A
future timestamp is UNKNOWN. Coverage reports records seen, valid coordinates,
and verified coordinates. `NO_EVIDENCE` explicitly does not mean `NO_INVENTORY`.

Future field-intelligence queries should use bounded viewport/region inputs and
return provenance: source record, observed time, evidence type, and reason.
Useful deterministic queries include verified inventory, stale inventory,
verification-needed locations, possible duplicates, weak field coverage, and
recently verified locations.

## Spatial indexing decision

H3/S2 is **NOT ADOPTED**. Current evidence does not demonstrate a need for
cell aggregation, proximity allocation, or full-world analysis beyond the
existing bounded queries. Adoption becomes justified only when measured
viewport/query latency, coverage aggregation cost, or field-work allocation
requires stable spatial cells and a small benchmark shows material benefit.

## Future intelligence contracts

Visual intelligence should begin with local media metadata/quality and bounded
review queues; OCR, detection, recognition, and change detection require a
separately justified model/runtime. Temporal intelligence requires repeated
observations with stable location identity and observed timestamps; current
data must not be treated as a historical series. Offline-first product work
should preserve deterministic operation identity, safe retry, reconciliation,
and visible conflicts without creating a general synchronization platform.

AI becomes justified only when proprietary structured evidence is sufficient
for natural-language queries to add user value. Any future model sits above
deterministic evidence and cannot become its source of truth.
