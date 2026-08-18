# Dave — Production Access Checklist

Minimum access requested, one category at a time. Each explains exactly what we'd check and what we explicitly do NOT need. Never paste secrets, tokens, or passwords into chat — use the platform's own way of adding a collaborator/viewer, or screen-share and revoke after.

## 1. Base44 dashboard (highest priority)

**Why:** This is the platform `BASE44_MIGRATION_PLAN.md` and `.env.example` both confirm bundles auth, database, functions, and hosting for OOH Earth. It's almost certainly the actual control surface for what's live at `oohearth.app` — not GitHub, not Render directly.

**What we need to check:**
- Which Base44 "app"/environment is bound to the `oohearth.app` domain
- Whether it's synced to this GitHub repo's `main`, a different branch, or not synced to GitHub at all
- When it was last deployed/published
- Whether a staging/preview environment exists

**What we do NOT need:** Billing details, the ability to change plans, access to other Base44 apps/projects if this account has any.

## 2. Confirmation of the deploy trigger (a question, not necessarily access)

**Why:** No GitHub Actions deploy workflow exists in this repo — if pushing to `main` deploys production, that trigger lives outside this repository entirely.

**What we need to check:** Does merging to `main` auto-deploy, or does someone need to click "publish" in Base44?

**What we do NOT need:** Access to configure this ourselves, unless Dave wants engineering to own it going forward.

## 3. Render dashboard (only if Base44 doesn't fully abstract it)

**Why:** Live response headers (`rndr-id`, `x-render-origin-server: uvicorn`) show the origin runs on Render. If this is Base44's own infrastructure (probable), this item is unnecessary — Base44 access covers it. Only relevant if Dave separately manages a Render service.

**What we need to check:** Whether the serving layer resolves a request like `/map` to a matching `dist/map/index.html` before falling back to the SPA — this is the one fact that determines whether PR #102's fix has any live effect.

**What we do NOT need:** Billing, other services on the account, database/infra outside this one app.

## 4. Cloudflare (only if relevant beyond CDN)

**Why:** Confirmed in front of the origin via response headers. Likely just CDN/DNS/TLS — probably nothing to change here for this work.

**What we need to check:** Whether any Cloudflare-level caching or Worker/redirect rule could be masking or altering metadata responses (would explain unexpected behavior if the origin-level fix doesn't show up live).

**What we do NOT need:** DNS write access, Workers deployment access — read-only visibility into rules is enough.

## 5. Social-preview verification tooling (no account access needed)

**Why:** The only way to *prove* a fix works for real crawlers, not just curl.

**What we'd use:** Facebook's Sharing Debugger, Twitter/X Card Validator, LinkedIn Post Inspector — all public tools that just need a URL, not login access to anything of Dave's. We'll run these ourselves once told the fix is live; no access request needed here at all, just flagging it as the actual verification step.

## What we're explicitly not asking for

No DNS write access, no billing access, no database credentials, no Stripe/crypto keys, no ability to modify production data. This checklist is scoped to "can we see enough to confirm what's live and why," not "can we operate production."
