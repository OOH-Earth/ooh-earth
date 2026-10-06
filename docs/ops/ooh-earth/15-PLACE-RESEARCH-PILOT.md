# Place Research Pilot — bounded first slice

Date: 2026-10-06
Branch: `feat/place-research-pilot-local`
Status: fixture-first frontend slice; no production or BACKUP deployment

## What shipped in this slice

- Location detail has an on-demand `Research this place` panel. Opening it is the only trigger for provider access.
- A clearly labelled fixture card validates event/publication time, retrieval time, geographic precision, original link, and the not-live boundary.
- The live read-only adapter queries the USGS Earthquake Catalog directly with the selected public place coordinates, a 100 km radius, a maximum of five events, and no account or user identifiers.
- External reporting is visually separated from the existing OOH-verified field-check timeline. The panel links to the existing field-check action as the next step.
- Provider errors and no-coordinate states leave the fixture and the rest of Location Detail usable. Live results are marked stale after six hours.

## OSIRIS-informed decision

Reviewed `https://osirisai.live/` and `https://github.com/simplifaisoul/osiris` on 2026-10-06. Reused the useful patterns: on-demand layer activation, place/viewport-bounded requests, source links on result cards, explicit stale/outage handling, and source traceability.

The OOH slice does not embed or import OSIRIS. Direct USGS access was selected over OSIRIS's `/api/earthquakes` route because this first pass needs one transparent, read-only upstream contract, avoids introducing a remote intermediary, and keeps the disclosed query and privacy boundary in OOH code. OSIRIS remains a design reference rather than a runtime dependency.

## Source review checkpoint

- Coverage: USGS ComCat is global; the request is bounded to 100 km around the selected place.
- Contract: documented FDSN Event Web Service GeoJSON query.
- Rights: USGS-authored data is public domain in the US; the UI retains USGS attribution language. Data rights are tracked separately from OSIRIS's MIT code licence.
- Reliability: the catalog is authoritative for published events, but completeness is not guaranteed for small events or sparsely instrumented regions.
- Rate limits: one explicit live action starts at most one shared request for a canonical provider/coordinate/query key. A bounded eight-entry in-memory cache is fresh for five minutes; there is no polling or background refresh. Cache hits retain the original upstream retrieval timestamp.
- Privacy: fixture mode makes no provider request. A live action sends only the selected public place latitude/longitude and fixed query parameters upstream, with omitted credentials and a restrictive `no-referrer` policy. Normal network metadata, including the connecting IP address, is visible to USGS. Restricted/private coordinates are rejected until an explicit privacy decision exists.
- Request correctness: coordinates are finite and range-checked (including zero); the request is bounded to the previous 30 days, 100 km and five results. Only transient timeout/network/408/425/429/5xx failures retry once, respecting `Retry-After`; malformed responses do not retry. Failed in-flight entries are cleared for deliberate retry.
- Evidence boundary: duplicate provider event IDs are collapsed only when the IDs match. External reports retain source, event, retrieval and precision metadata, but never change OOH verification, create a field check, or imply site damage. The field-check handoff still requires an independent observation and normal confirmation.
- Feed choice: the Catalog query is used for a place-bounded historical window. USGS real-time GeoJSON feeds were not selected because this panel does not continuously monitor or poll a global feed.

Reference: `https://earthquake.usgs.gov/fdsnws/event/1/query`, `https://earthquake.usgs.gov/fdsnws/event/1/`, `https://www.usgs.gov/data-management/data-licensing`, and `https://www.usgs.gov/faqs/are-usgs-reports/publications-copyrighted`.

## Release boundary

This is not a production candidate and has not been deployed to BACKUP. The current release plan still pins #322 as the production candidate and requires owner-terminal deployment/verification before later work advances. No backend, entity, permission, classifier, or live production state was changed here.
