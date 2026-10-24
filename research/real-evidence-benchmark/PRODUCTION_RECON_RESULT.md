# Production Evidence Recon — Result

Authorized, tightly-scoped follow-up to `REAL_DATA_RECON.md` (BACKUP was
confirmed empty; this checks production, non-privileged, read-only only).

## What was queried

`production-recon-query.js` — non-privileged `entities.filter()` against
`Location`, `FieldCheck`, `LocationPhoto` on production
(`6a62213cff3ccbca88c04ff5`), bounded at 2000 rows/entity, field-projected
to structural columns only: `id`, `type`/`location_id`, `lat`, `lng`,
`status`, `created_date`, `image_url`/`url`. **Never requested**:
`created_by_id`, `uploaded_by`, `notes`, `harm_statement`, `brand_name`,
`campaign_name`, `parent_corp`, `ad_agency` — excluded from the query
itself, not merely from this report. No `--privileged` flag used anywhere.
No image bytes fetched — presence/absence of `image_url`/`url` only.

## Result (raw counts, CONFIRMED)

```json
{
  "total_locations_readable": 969,
  "total_locations_hit_cap": false,
  "total_fieldchecks_readable": 0,
  "total_locationphotos_readable": 0,
  "locations_with_two_or_more_observations": 0,
  "observations_with_image_reference": 85,
  "verified_observations_with_image_reference": 51,
  "location_status_breakdown": { "verified": 778, "pending": 155, "rejected": 36 },
  "location_date_range": { "earliest": "2026-07-24", "latest": "2026-08-20" }
}
```

Neither `Location` nor `FieldCheck` hit the 2000-row cap, so these are
true totals for the current production state, not a truncated sample.

## Reading

- Production has real, substantial `Location` activity (969 rows, 778
  verified) over roughly a 27-day window — this is genuinely more
  contributor activity than either R&D session expected going in.
- **Zero `FieldCheck` rows exist anywhere in production.** Not an RLS
  artifact — the same non-privileged access level that correctly surfaced
  `pending`/`rejected` `Location` rows (which requires admin-level RLS
  visibility, confirming this session's read access is not restricted to
  only `verified`/own records) returned zero for `FieldCheck` too. This
  means: **the re-observation mechanism the entire "temporal evidence"
  half of the thesis depends on has never actually been used in
  production.** `locations_with_two_or_more_observations: 0` follows
  directly — there is currently no real data anywhere to test
  `buildTimeline()`'s core capability against.
- Zero `LocationPhoto` rows — the optional multi-photo gallery path has
  also never been used; every real photo reference lives solely in
  `Location.image_url`.
- Of 969 Locations, only 85 (~8.8%) carry any `image_url` at all, and 51
  of those are `verified`. `image_url` is not a required field in the
  schema (`Location.jsonc` requires only `title`, `lat`, `lng`) — this is
  a real, structural reason the raw candidate pool for image-based
  matching is much smaller than the total Location count suggests.

## Privacy check (Mission §3)

Confirmed isolatable, and isolated in the query itself (not just the
report): placement ID (`Location.id`), image reference (`image_url`/`url`
— presence checked, values never printed), timestamp (`created_date`),
verification status (`status`), geospatial coordinates (`lat`/`lng` —
fetched for future spatial-relationship work, not printed per-record
here). Confirmed excluded from the query: contributor account identifiers,
wallet/display-name (`LocationPhoto.uploaded_by`), and all free-text
fields that could incidentally carry identifying content. No personal
data was retrieved, seen, or is present anywhere in this report.
