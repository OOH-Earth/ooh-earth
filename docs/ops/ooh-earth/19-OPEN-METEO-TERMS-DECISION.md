# Open-Meteo terms: commercial-use checkpoint (decision package)

Status: **DECISION REQUIRED.** Nothing has been purchased, subscribed to, or signed up for. Existing
usage is untouched; broader production dependence is on hold until this is decided.
Sources: open-meteo.com/en/terms and /en/pricing, read 2026-10-07. This is an engineering reading of
the published terms, **not legal advice**.

## What the terms actually say
- **Free API is non-commercial only.** Limits: **600 calls/minute, 5,000/hour, 10,000/day, 300,000/month**. Data is CC BY 4.0. They reserve the right to block applications and IPs without notice. No uptime guarantee.
- **Non-commercial examples:** private or non-profit sites/apps *that do not have subscriptions or advertising*, personal automation, public research, education.
- **Commercial examples:** "Operating websites or apps that have subscriptions or display advertisements", "integrating our service into commercial products or promotional activities".
- **Commercial licence:** a paid plan (Standard 1M calls/month, Professional 5M, Enterprise 50M+) on `customer-api.open-meteo.com` with an API key; same syntax as the free API. Paid plans mention reserved servers and a 99.9% uptime target. The pricing page text we could read did not show prices (UNVERIFIED), so cost is unknown.
- **Self-hosting:** the server is open source; for very high volume Open-Meteo calls self-hosting "the practical path". Data licence is still CC BY 4.0 and model inputs have their own terms.
- **Attribution:** required under CC BY 4.0. For air quality the docs add that users "must provide a clear attribution to CAMS ENSEMBLE data provider as well as a reference to Open-Meteo".

## OOH Earth's current exposure
- The app calls the **Air Quality API from 6 places**: `TelemetryBar` (global header), `CityPulse`, `GlobeHud`, `AirCommons`, `AmbientPulse`, `ArLens`. Ecology (#338) adds one user-initiated conditions request (air quality plus forecast).
- Requests come from visitors' browsers, so rate limits bite per visitor IP, not for OOH as a whole. Volume is not the problem.
- **The commercial-status question is.** OOH Earth has a Plans page, a store and donation flows. Under Open-Meteo's own definition, "apps that have subscriptions" are commercial. If any of those are live revenue features, **the existing air-quality usage already likely requires a commercial licence**, and this is not new to Ecology.
- Attribution: the existing widgets were not audited for the required CAMS plus Open-Meteo credit. Ecology's conditions card does credit both.

## Options
1. **Paid Standard plan** (commercial licence, key). Smallest change, but the key must be proxied server-side (a key in browser code is public), which is new backend work and a credential checkpoint.
2. **Replace the source** for air quality (e.g. an OBSERVED station network with an open licence) and keep Open-Meteo out of production. Needs its own source review; coverage will be patchier but provider-honest.
3. **Self-host** the open-source server. Operational burden; probably disproportionate.
4. **Remove or reduce** the widgets that depend on it (keep only user-initiated conditions) while commercial status is clarified.
5. **Document OOH as non-commercial** only if that is actually true (no subscriptions or advertising on the site); do not claim it to satisfy the API.

## Recommendation
Do not expand Open-Meteo usage. Resolve OOH's commercial status first (owner/legal), because it decides this and several other dependencies (CARTO terms are also unverified). Until then keep existing usage as is, keep Ecology conditions user-initiated and clearly modelled, and add the missing CAMS/Open-Meteo attribution to the existing widgets as a low-risk follow-up.

## Questions for the owner
1. Is OOH Earth, or will it be, a commercial product (subscriptions, ads, paid store)?
2. If yes, accept a paid plan plus a server-side proxy, or replace the source?
3. Who signs off attribution wording on the existing widgets?
