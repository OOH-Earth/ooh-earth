# Media Corps registry population — decision package (2026-10-06)

Status: **DECISION REQUIRED. Nothing has been seeded.** Production and BACKUP `MediaCorp` both
hold 0 records, so `/media-corps` truthfully shows "No media corps published yet". 0 corps is a
valid state until this is approved.

## What the 24 records are
`src/components/ooh/report/oohMediaCorps.js` exports `OOH_MEDIA_CORPS`, 24 hand-written company
objects (3 global, 12 regional, 9 local). Fields: `name, hq, lat, lng, regions, scope, countries,
panels, desc, parent, url, image_url`. The `MediaCorp` entity schema (`base44/entities/MediaCorp.jsonc`)
has matching fields (plus `founded_year`). No component imports the export by name, so the
data is a draft artifact, not a live data source.

## Provenance and quality (what the code itself shows)
- Source claim: file header says "Sourced from ooh.earth/media-corps and industry research".
  No per-record citation, retrieval date or reviewer is stored. **Provenance is unverified.**
- `panels`, `countries`, `scope`: round-number figures with no source or "as of" date. They are
  claims that go stale; the UI presents them as facts ("1.0M panels", "80 countries").
- `parent`: populated for 24/24, including entries that are software/vendors (`Broadsign`,
  panels = 0) rather than panel owners. Whether each is a factual ownership statement or an
  inference is not recorded.
- `image_url`: **all 24 are `images.unsplash.com` stock photos**, not company assets. Shown in the
  detail drawer hero image they would imply the photo depicts that company. Licensing and
  misrepresentation risk; should not ship as-is.
- `lat/lng`: city-level HQ centroids (4 decimals), not precise addresses. Low privacy risk for
  corporate HQs, but should be labelled "HQ city".
- `url`: 21 distinct hosts; none link-checked.

## Questions that need an owner decision
1. Source of truth: who verifies each record, and against what (filings, company sites)?
2. Currency: add `verified_at` / `source_url` (this is an entity-schema change, which is a hard
   checkpoint and must not ride along with a frontend release).
3. Image policy: remove stock imagery, use a neutral placeholder, or obtain licensed logos.
4. Public display: are factual-claim fields (`panels`, `countries`, `parent`) shown publicly,
   and with what disclaimer ("self-reported / unverified")?
5. Maintenance ownership and update cadence; moderation for corrections or disputes by the
   companies named.
6. How the registry connects to the product graph (PLACE -> OBSERVATION -> ORGANIZATION /
   CAMPAIGN CONTEXT -> FIELD ACTION), which is a separate design with its own checkpoints.

## Recommendation
Do not seed. First run a verification pass on a small subset (e.g. the 3 global operators), add
source and as-of fields through a normal schema-checkpointed change, replace stock imagery, and
only then write records to BACKUP before any production write.

## Out of scope here
No entity, schema, permission or data change is made by this document.
