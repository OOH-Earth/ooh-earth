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
- Rate limits: one request per panel open; no polling, background refresh, persistent cache, or contribution payload is sent.
- Privacy: only the selected place latitude/longitude and fixed query parameters are sent upstream.

Reference: `https://earthquake.usgs.gov/fdsnws/event/1/que`, `https://www.usgs.gov/data-management/data-licensing`, and `https://www.usgs.gov/faqs/are-usgs-reports/publications-copyrighted`.

## Release boundary

This is not a production candidate and has not been deployed to BACKUP. The current release plan still pins #322 as the production candidate and requires owner-terminal deployment/verification before later work advances. No backend, entity, permission, classifier, or live production state was changed here.
