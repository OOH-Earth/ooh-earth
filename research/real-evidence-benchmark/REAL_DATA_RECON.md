# Real Evidence Recon — Result: INSUFFICIENT REAL DATA

Status: **empirical portion stopped per this mission's own instructions.**
No benchmark was built. No data was fabricated. This is a negative
result, recorded because a null result is still R&D output worth keeping.

## What was checked

1. **BACKUP** (`6a6748e009b947cb29591871`) — one read-only,
   non-privileged `entities.Location.list()` / `entities.FieldCheck.list()`
   query (`real-benchmark-recon-query1.js`), then repeated **with**
   `--privileged` (RLS-bypassing, admin-level read) to rule out an RLS
   visibility artifact rather than genuine absence of data.

   **Result: 0 `Location` records, 0 `FieldCheck` records, under both
   privilege levels.** This is decisive, not ambiguous — bypassing RLS and
   still getting zero rules out "the data exists but isn't visible to this
   role." BACKUP simply has no placement/observation data. Consistent with
   its role as a code/function verification environment (confirmed in
   earlier sessions of this engagement), not a store of real contributor
   activity.

2. **PRODUCTION** (`6a62213cff3ccbca88c04ff5`) — the equivalent read-only
   query was attempted once. **It was denied by this session's own
   permission system before it reached Base44 at all.** Per that denial's
   explicit instruction ("stop and explain, don't work around it"), no
   retry or alternate framing was attempted. This is the one place real
   contributor-submitted evidence plausibly exists, and it was never
   actually queried.

## Privacy gate (Mission §4)

Not applicable to what was actually reached: BACKUP returned zero records,
so there was nothing to inspect for contributor PII, EXIF, or identifiers.
Production was never queried, so no privacy review of real data happened
either. **No privacy-sensitive data was seen, copied, or retained at any
point in this mission.**

## Data sufficiency gate (Mission §5)

| Metric | Value |
|---|---|
| Total usable real images | 0 (nothing readable — BACKUP is empty, production unreached) |
| Unique locations | 0 |
| Locations with ≥2 observations | 0 |
| Same-placement pairs | 0 |
| Different-placement pairs | 0 |
| Same-creative pairs | 0 |

**Classification: INSUFFICIENT REAL DATA FOR EMPIRICAL CLAIM.**

This is not the same finding as "OOH Earth has no real data" — it is
"the one environment this session could actually read (BACKUP) has none,
and the one environment that plausibly does (production) was not
reachable this session." Those are different problems with different
fixes; see the final report for which one to act on.

## What would unlock the experiment

Either of:

- **Explicit authorization + a permission rule** allowing a read-only
  Base44 query against production, so the exact same non-privileged
  `entities.Location.list()` / `entities.FieldCheck.list()` query already
  written here (`../real-benchmark-recon-query1.js`) can run there instead.
  Non-privileged is the right level to use first — RLS's `data.status:
  "verified"` condition already scopes it to publicly-visible evidence,
  which is also the correct population for a benchmark meant to reflect
  what an institutional user would eventually see.
- Or: **wait for real accumulation** — once contributors submit through
  the live product and a meaningful number of `Location`/`FieldCheck`
  records with images and `location_id`-linked re-observations exist
  (production or a future non-empty BACKUP), re-run this same recon
  script unchanged.

No other path was considered. Scraping, synthetic substitution, or
treating repo/e2e fixtures as real data were explicitly out of scope for
this mission and were not done.
