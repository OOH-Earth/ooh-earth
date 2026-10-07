# Environmental source register

Part of OOH's provenance infrastructure. **NO SOURCE -> NO CLAIM**: an environmental layer may only be
presented if it can answer *where did this come from, what kind of data is it, when does it
represent, and how certain should I be*. Add a record here before shipping any new environmental
source. Measured facts below were taken from the live providers on 2026-10-06/07; anything not
verifiable in-session is marked **UNVERIFIED**.

Data types: **REFERENCE** (map geography), **OBSERVED** (a provider-dated measurement or record),
**MODELLED** (model output), **DERIVED** (computed by OOH from other data). Never present one as another.

---

## Natural Earth
- **Dataset:** `ne_50m_rivers_lake_centerlines` (rivers only, scalerank <= 5, 194 named features, coordinates rounded to 2 decimals).
- **Type:** REFERENCE. **Coverage:** global major rivers. **Temporal:** static cartographic dataset (no observation date).
- **Freshness:** n/a (bundled, versioned with the app). **Licence:** public domain (verified at naturalearthdata.com/about/terms-of-use).
- **Attribution:** not required; OOH credits it anyway ("Natural Earth (public domain)").
- **Access:** bundled JSON, lazy chunk (~74 KB gzipped) loaded only on the Rivers page. **Rate limit / caching:** none (static asset).
- **Known biases:** generalised at 1:50m, so small rivers and exact channels are absent; names are English only; not a hydrological authority.
- **Failure modes:** none at runtime (bundled). A failed chunk import leaves the OSM layer only.
- **OOH usage:** Rivers world view (RIVERS-1, #337).

## OpenStreetMap via CARTO vector tiles
- **Dataset:** CARTO `carto.streets` v1 vector tiles (OpenMapTiles schema), layers `waterway`, `water`, `landcover`, `park`.
- **Type:** REFERENCE. **Coverage:** global, zoom 0-14 (OOH requests from zoom 5). **Temporal:** continuously edited OSM; tile build lag unknown (UNVERIFIED).
- **Licence:** OSM data is ODbL; CARTO basemap terms apply (same vendor and terms the app's base maps already depend on; CARTO's commercial-use terms are UNVERIFIED here and should be confirmed with the Open-Meteo-style review).
- **Attribution:** "(c) CARTO, (c) OpenStreetMap contributors" shown in the map attribution and legend.
- **Access:** client, CORS open. **Rate limit:** not published for tiles (UNVERIFIED). **Caching:** HTTP caching; OOH adds no extra cache.
- **Known biases:** OSM completeness varies by region (empty Sahara and open-ocean views are real emptiness *or* sparse mapping). The `park` layer's `class` is free-text national tagging (e.g. "naturpark", "reserve_naturelle_nationale"), **not** the WDPA register. `landcover` is OSM-mapped, not a satellite classification.
- **Known failure modes:** a TileJSON failure, all-tile failure, or partial tile failure are each surfaced distinctly in the UI. All tiles bundle every layer (about 50-100 KB each), so detail is gated to zoom >= 5.
- **OOH usage:** Rivers detail network (#337), Ecology reference layers (#338), all MapLibre base maps.

## iNaturalist
- **Dataset:** API v2 `/observations`, research-grade, last 180 days, `obscured` records excluded, `fields=` projection (about 6 KB per 100 records, gzipped).
- **Type:** OBSERVED (community observation with a date). **Coverage:** global, but density tracks where people observe, not biodiversity.
- **Temporal:** per-record `observed_on` (calendar day). **Freshness:** minutes to days in active regions; sparse regions return nothing for 180 days.
- **Licence:** per-record (`cc-by`, `cc-by-nc`, null = all rights reserved). OOH shows only metadata (taxon, date, source link) and **no photos**.
- **Attribution:** every record links back to its iNaturalist observation page. **Access:** client, CORS open.
- **Rate limit:** **UNVERIFIED in-session** (provider page is JavaScript-rendered). OOH issues at most 2 requests per settled viewport, 600 ms debounce, 5 minute cache, cancellation on movement.
- **Caching:** responses carry `Cache-Control: public, max-age=300`.
- **Known biases:** urban and wealthy-country observer bias; taxon-group bias; "no records" is not "no life".
- **Failure modes:** provider error and empty results are separate UI states. Obscured records exist and are excluded rather than shown at false precision.
- **OOH usage:** Ecology (#338); proposed Main Map replacement (see 20-MAIN-MAP-LLM-TRUST-AUDIT.md).

## Open-Meteo
- **Dataset:** Air Quality API (CAMS ENSEMBLE) and Forecast API (national weather models), `current` block.
- **Type:** **MODELLED** (nearest model grid cell, not a station reading). **Coverage:** global grid (returns values even over open ocean).
- **Temporal:** provider `current.time` and `interval` (air quality 3600 s, weather 900 s). **Freshness:** shown with the provider's own timestamp.
- **Licence / terms:** CC BY 4.0 data licence; the **free API is non-commercial only** (see 19-OPEN-METEO-TERMS-DECISION.md). **Attribution:** required, including the CAMS provider for air quality.
- **Access:** client, CORS open. **Rate limit (free):** 600/min, 5,000/hour, 10,000/day, 300,000/month.
- **Known biases:** model resolution about 11 km for air quality; point values do not represent street-level exposure.
- **Failure modes:** HTTP errors surface as "unavailable"; no value is ever carried forward.
- **OOH usage:** existing air-quality widgets (6 call sites), Ecology "Conditions here" (#338, user-initiated only). **Not used for rivers:** the flood API was tested and rejected (0.63 m3/s for the Ganges at Varanasi, 11.8 m3/s for the Thames at London, from tributary grid-cell snapping).

## USGS Water Data APIs (OGC API)
- **Dataset:** `api.waterdata.usgs.gov/ogcapi/v0` collections `latest-continuous` (readings) and `monitoring-locations` (names, site types).
- **Type:** OBSERVED (gauge measurement). **Coverage:** United States and territories only. Elsewhere: NO OBSERVATION COVERAGE.
- **Temporal / freshness:** per-reading UTC `time`. Measured 2026-10-06: ages ranged from 7 minutes to about 42 years across one 2x2 degree box. **"Latest" is not "current"**: discontinued gauges keep their last value.
- **Licence:** US Government work, generally public domain ("for the most part, is in the public domain", USGS docs); provisional data is subject to revision. **Attribution:** credit USGS.
- **Access:** client, CORS open. **Rate limit:** unauthenticated requests are rate limited (HTTP 429); headers `X-RateLimit-Limit/Remaining`; higher limits need an api.data.gov key (OOH uses none).
- **Caching:** OOH caches per 0.5-degree-snapped area for 5 minutes, shares in-flight requests, cancels superseded requests and pauses when the tab is hidden.
- **Measured payload (2026-10-07):** a 4x3 degree box in Maryland/Virginia returned 901 latest values (no hard cap at `limit=3000`; a `next` link signals truncation), 46 KB gzipped with a `properties=` projection, ~3 s. Without the projection it is 613 KB.
- **Names are fetched on selection**, not in bulk: the `monitoring-locations` list truncates at 3000 and a `site_type_code=ST` filter misses tidal sites (`ST-TS`, e.g. the Anacostia River). `items/{id}` is ~1 KB. USGS gives a site name, not a separate waterbody.
- **Qualifiers / flags to preserve:** `approval_status` (Provisional/Approved), `qualifier` (ESTIMATED, DISCONTINUED, BACKWATER, RATINGDEV, LESSTHAN ...).
- **Known biases:** gauge placement favours populated and flood-prone reaches; discharge and gage height are different quantities (units ft3/s vs ft) and are never merged.
- **Failure modes:** the legacy `waterservices.usgs.gov` IV service returned HTTP 503 and 30-51 s responses on 2026-10-06 and is being migrated away; OOH uses the modernised API with a hard client timeout.
- **OOH usage:** RIVERS-2 observed stations (in progress; nothing deployed).

## UK Environment Agency flood-monitoring API
- **Dataset:** `/id/stations` (metadata) and `/data/readings?latest` (all latest readings), `parameter=level`.
- **Type:** OBSERVED (river, tidal and groundwater level). **Coverage:** England-focused (a few border and coastal stations appear elsewhere, e.g. Leith). Elsewhere: NO OBSERVATION COVERAGE.
- **Temporal / freshness:** 15-minute cadence; measured 2026-10-07: ages 17 minutes to 28 days across 4,135 readings. Stale readings are shown as stale.
- **Licence:** Open Government Licence v3. **Attribution (required wording):** "This uses Environment Agency flood and river level data from the real-time data API (Beta)."
- **Access:** client, CORS open, no registration. **Rate limit:** none numeric; provider guidance is **one `readings?latest` call every 15 minutes** instead of per-station crawling (80 KB gzipped, 0.9 s). **Caching:** `max-age=300`.
- **Known biases / distinctions that must be kept:** `qualifier` separates Stage, Downstream Stage, **Tidal Level**, Height and groundwater; units mAOD vs mASD differ by datum. A tidal level is not river flow.
- **Failure modes:** beta service, no SLA, "should not be relied upon for safety critical applications"; suspended stations (status field) and missing latest values occur.
- **OOH usage:** RIVERS-2 observed stations.
