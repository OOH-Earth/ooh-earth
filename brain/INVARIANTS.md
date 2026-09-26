# INVARIANTS — hard rules, never regress

## Identity
- **Production app id:** `6a62213cff3ccbca88c04ff5` (`oohearth.app`).
- **BACKUP app id:** `6a6748e009b947cb29591871` (`ooh-earth-backup.base44.app`).
- A historical candidate id `6a62213cff3ccbca880c04ff5` (25 chars, extra `0`)
  was a typo — never use it. Production's real id is 24 characters.

## Schema truth source
- Authoritative: `GET https://app.base44.com/api/apps/{id}/entity-schemas`
  using the Base44 CLI's own stored bearer token
  (`~/.base44/auth/auth.json`), read-only, never logged/written elsewhere.
- **Never trust the Base44 Monaco/Code-tab editor as schema truth** — it has
  been proven to show stale/different content from the real runtime store.

## Entity pushes
- `base44 entities push` pushes the **whole** entity folder — never build a
  push mirror from a stale or partial local snapshot. Always diff a fresh
  authoritative pull against the intended change before pushing.

## Function deploys
- The CLI recognizes `entry.ts`/`entry.js` as a function's real source —
  **never assume a hand-placed `main.ts` will deploy**; check `function.jsonc`
  for an override before assuming.
- `base44 functions pull [name]` takes exactly one name at a time (not
  variadic) — loop per function, don't pass a space-separated list.
- Pulling reconstructs either a single bundled `main.ts` or the original
  `entry.ts`+`handler.ts` pair depending on how the function was actually
  deployed — a different file layout between environments is not
  automatically drift; compare **content**, not just filenames.

## Frontend builds
- Must prove the target app id is embedded in the **true entry file**
  referenced by `dist/index.html` (not just any `index-*.js` glob match —
  multiple chunks can start with `index-`) before deploying.
- `media.base44.com` image URLs referencing the *other* environment's app id
  inside a bundle are a known-benign pattern (hardcoded OG-image/static
  asset URLs, not runtime SDK targeting) — don't mistake this for
  misconfiguration; confirm via grep context before flagging.

## Browser QA
- Known working local Chromium (no system install needed):
  `~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`. Launch
  headless with `--remote-debugging-port=9223`, then chrome-devtools MCP
  connects via its existing `--browserUrl` mode.
- **Never substitute curl-only checks for browser rendering when rendering
  is actually the question** — this exact bug class (MapLibre worker
  resolution) was invisible to canvas-presence/API-200/count checks; only
  direct `getSource().loaded()`/`queryRenderedFeatures()` instrumentation
  caught it.
- Never use browser automation to bypass a sandbox/deploy permission denial.
- Never access unrelated tabs, credentials, OTPs, or email during QA.

## Sandbox/classifier denials
- A denial (e.g., "Merge Without Review") is a stop-and-report checkpoint,
  not a flaky gate — never retry via a different tool, encoding, smaller
  batch, or later turn to reach the same outcome.

## Must-preserve behaviors (verify unaffected after any change nearby)
- P0 `Location` request retry + in-flight dedupe (`withRetry.js`,
  `dedupeInFlight.js`).
- MapLibre worker resolution fix (`maplibreWorkerSetup.js`,
  `?worker&url` import) — Home + Map globe views, `Globe3D.jsx` and
  `MediaCorpGlobe.jsx`.
- Anonymous realtime WebSocket gating (`useAuthGatedSubscribe.js`) — zero
  WebSocket construction attempts for anonymous sessions.
- `User.role`/`access`/`agency`/`founding_member` admin-only write locks;
  `profile_public` stays self-editable, default `false`.
- `Location.status`/`FieldCheck.status`/`LocationRelationship.status`
  moderation write locks (admin/moderator/agency-only).
- `LeadClaim.create` admin-only + `note.maxLength: 1000`.
- Public Space entity fields/enums (`Location`/`FieldCheck` facility types,
  `LocationRelationship`) and the `getPublicProfile`/`moderate` functions.
- Founding Profile privacy default (`profile_public: false`, URL-only
  discovery, no directory).
- `n8nPing` hardening (admin-only, 500-char note cap, sanitized response).
- Payment/checkout code paths (`Store.jsx` checkout/delivery, Stripe
  functions) — never touched incidentally by an unrelated migration/fix.
- Provisioning behaviors (`LabAdmin.jsx`/`CareersAdmin.jsx`-style
  read→conditional-write→reread patterns) — do not wrap in react-query or
  any auto-retry mechanism without redesigning the write path first.
