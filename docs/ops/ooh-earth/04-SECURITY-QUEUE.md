# Security Queue

Record findings without overstating. "Confirmed via schema" and "confirmed via runtime" are different claims. "Potential impact" and "proven exploitation" are different claims. Do not call something exploited unless there is evidence it was actually exploited.

## DEPLOYED

**n8nPing auth/input/output hardening** — deployed to production 2026-09-21 via `base44 functions deploy n8nPing`. Source-verified before and after deploy (byte-identical to the tested artifact). **Runtime behavior not independently exercised** — the live webhook was never invoked, by design (avoiding any real side effect / cost). Do not claim this is "runtime-verified."

## FIXED AND DEPLOYED, 2026-09-22 (SOURCE-VERIFIED via the authoritative runtime schema API)

- **`User.role` / `User.access` / `User.agency` / `User.founding_member`** — now field-level `rls.write: {user_condition: {role: admin}}` locked. `region`/`focus_areas`/`profile_public` remain self-editable (no lock added — intentional, same tier as bio/avatar_url).
- **`Location.status`** — now field-level locked (`rls.write.$or`: `role:admin` OR `access:admin` OR `access:moderator` OR `agency:true`). Ordinary creators retain edit access to all non-status fields.
- **`FieldCheck.status`** — identical lock pattern applied.
- **`LeadClaim.create`** — now `{user_condition: {role: admin}}` (was fully open `{}`). **`LeadClaim.note`** — now `maxLength: 1000` (was uncapped). CLOSED 2026-09-22, SOURCE/SCHEMA VERIFIED via the authoritative API; not runtime/behaviorally tested. See full trail below and in `06-EVIDENCE-LOG.md`.

Verified via `GET /api/apps/6a62213cff3ccbca88c04ff5/entity-schemas` (the same authoritative endpoint the CLI's push writes to) — all 23 entities match the intended deployment mirror exactly, with precisely these 3 changed and 20 unchanged versus the pre-push snapshot. **This is SOURCE-VERIFIED, not yet RUNTIME-VERIFIED** — no behavioral test (e.g. an actual non-admin write attempt) has been performed, per the standing rule against synthetic production tests without separate authorization.

**Important verification-method correction**: an initial post-push check via the Base44 Code-tab/Monaco editor (the same method used for the pre-push drift check) showed no change and was wrongly reported as a failed push. The Code tab display is NOT a reliable proxy for the live runtime schema — it appears to be a separate/stale representation. All schema verification going forward should use `GET /api/apps/{id}/entity-schemas` directly. See `08-SESSION-HANDOFF.md` and `06-EVIDENCE-LOG.md` for the full diagnostic trail.

**Potential impact this fix closes** (was not proven exploited beforehand): self-privilege-escalation on `User`; self-verification/moderation-bypass on `Location`/`FieldCheck`.

## CLOSED — `LeadClaim` production create-permission regression (2026-09-22)

**CONFIRMED, not intentional.** Production's `LeadClaim.create` RLS is `{}` (fully open, any caller) and `note` has no length cap. Both BACKUP and origin/main have `create: {user_condition: {role: admin}}` and `note.maxLength: 1000`. This is a genuine authorization defect on production, not a legitimate design divergence — established via first-party evidence, not inference:

- Commit `f0c282d` ("feat(leadClaim): move LeadClaim.create behind a validated server function (#40)", Aug 12 2026, authored by the repo owner) explicitly documents that production's live app *already had* `create` locked to admin-only at that time, and that this PR was bringing the GitHub repo up to match. The commit message also notes Dave reported the Base44 UI wasn't letting him approve the new `claimLead` function at that time.
- `base44/functions/claimLead/entry.ts`'s own code comment: "LeadClaim.create is restricted to admin in entity RLS ... this function is the elevated path, matching the pattern already used by moderate/entry.ts."
- The `claimLead` function (`base44/functions/claimLead/handler.ts`) is a fully validated, `asServiceRole`-elevated write path: validates `location_id` against a real Location record, bounds `operative_handle` (80 chars) and `note` (1000 chars), rejects a second active (pending/accepted) claim on the same location (409), and de-dupes in-flight requests per location. `asServiceRole` writes bypass entity RLS by design, so this function does not depend on `create` being open.
- **Confirmed the function is live on production right now**: `OPTIONS https://oohearth.app/api/apps/.../functions/claimLead` returns `204` (matching the handler's own OPTIONS-response code exactly).
- **Confirmed the deployed frontend already calls the function, not the entity**: fetched production's actual `ClaimLeadDialog-_RQzy5JA.js` chunk (found via live network requests on `/map`, not guessed) and found `X.functions.invoke("claimLead", {...})` — zero occurrences of direct `LeadClaim.create()`.
- A stale, unrelated hardcoded reference table in `src/pages/PortalOps.jsx` (`['LeadClaim', 'R/CREATE OPEN · U/D ADMIN']`) contradicts this — but it's a static display array with no functional connection to actual RLS enforcement, and git history shows it was never updated when `f0c282d` tightened the real permission. This is a documentation bug, not evidence of intended design.

**Conclusion**: production's currently-open `create` RLS provides zero additional value (the validated function is the only path the live UI uses) and is a pure liability — it lets any caller bypass all of `claimLead`'s validation (real-location check, duplicate-active-claim prevention, field length bounds) by hitting the entity API directly, and the missing `note.maxLength` removes even the schema-level backstop.

**Fix deployed 2026-09-22.** `LeadClaim.jsonc` — `create` → admin-only (byte-for-byte matching origin/main and BACKUP), `note` → `maxLength: 1000` + matching description (byte-for-byte matching origin/main and BACKUP). Zero application code changes needed or made. Human executed `npx --yes base44@0.1.14 entities push` from `prod-prerelease-patches/` (the same worktree Phase 2 used) after two rounds of mandatory preflight verification against a fresh authoritative production snapshot. Post-push, `GET /api/apps/6a62213cff3ccbca88c04ff5/entity-schemas` (cache-bypassed) confirms: exactly `LeadClaim` changed, matches the intended mirror 23/23, all other LeadClaim fields/RLS unchanged, 22 other entities unchanged, 0 new, 0 deleted, all 3 Phase 2 locks intact. DevTools smoke check (desktop + mobile: Home/Map/Globe/Location-Detail/Account) shows no regression. **CLOSED — SOURCE/SCHEMA VERIFIED. Not RUNTIME/behaviorally tested** (no actual LeadClaim creation attempted, per standing rule against synthetic production writes without separate authorization).

## FIXED AND DEPLOYED, 2026-09-25 — production `scanAd`/`migrateLocationImages` were behind hardened source

A broader Base44/GitHub reconciliation pass on 2026-09-25 found that two production functions were running behind already-hardened, already-tested source that existed on `origin/main` and BACKUP. Both have now been redeployed to production and source-verified. (This entry was originally published in redacted form while the fix was pending, per responsible-disclosure practice for a public repo with an unpatched gap — now fixed everywhere, full detail below.)

### 1. `scanAd` — was missing `validateMediaUrl()`'s host-allowlist check on `file_url`

- **Was:** production's `scanAd` took `file_url` straight from the request body with zero validation and passed it directly to `base44.asServiceRole.integrations.Core.InvokeLLM({ file_urls: [file_url], ... })`. Only gate before that call was `if (!caller) return 401` (any authenticated user, not admin-only — by design, since this is the normal field-report AI-scan path).
- **Now matches `origin/main`/BACKUP:** before calling `InvokeLLM`, validates `file_url` via `validateMediaUrl()` — must be `https:`, no embedded credentials, and either exactly `media.base44.com`, or `base44.app` with a path matching `/api/apps/{appId}/files/mp/public/{appId}/...` for this app's own id. Any other host is rejected before the LLM call ever fires.
- **Impact this closes** (was not proven exploited beforehand): any authenticated user could previously make production's `scanAd` fetch/pass an arbitrary attacker-chosen URL into the vision-LLM call — at minimum an abuse vector (spend the app's paid AI-vision credits on arbitrary internet images), and depending on how Base44's `InvokeLLM` integration resolves `file_urls` server-side, potentially SSRF-adjacent. Not proven exploited; no live exploitation test was ever run against production.
- **Bonus fix landed with the same redeploy:** production's `scanAd` was also missing the Public Space facility-type detection schema (`skatepark`/`basketball_court`/`multi_use_court` + related fields) already live everywhere else — now present, source-verified.
- **FIX:** redeployed the exact already-tested `origin/main` source (`base44/functions/scanAd/entry.ts` + `handler.ts`, unchanged, already live on BACKUP) via `npx base44@0.1.14 functions deploy scanAd --app-id 6a62213cff3ccbca88c04ff5`.
- **VERIFIED:** re-pulled production's live source post-deploy — `handler.ts` contains `isAuthenticated`/`validateMediaUrl` matching `origin/main` exactly; `entry.ts`'s schema includes the Public Space facility types. Source-verified, not behaviorally/runtime-tested (no live exploitation or synthetic scan request was sent, consistent with the standing rule against synthetic production security tests without separate authorization).

### 2. `migrateLocationImages` — was leaking `error.message` + `error.stack` to the HTTP response on failure

- **Was:** the outer `catch` block returned `Response.json({ error: error.message, stack: error.stack }, { status: 500 })` — a raw internal error message and full stack trace went straight into the HTTP response body on any unhandled exception.
- **Now matches `origin/main`/BACKUP:** the outer catch logs server-side only (`console.error('migrateLocationImages error:', ...)`) and returns a generic `Response.json({ error: 'Migration failed' }, { status: 500 })` — no internals reach the client.
- **Impact this closes:** this function's normal operation is admin-gated (403 for non-admins), so exposure was narrow, but the leak was in the generic catch-all, which could fire on any unhandled exception regardless of the admin check's own outcome path. Reported as a real, present information-disclosure pattern; never proven independently exploitable pre-auth.
- **FIX:** redeployed the exact already-tested `origin/main` source the same way.
- **VERIFIED:** re-pulled production's live source post-deploy — `handler.ts`'s catch block matches `origin/main` exactly (`console.error` + generic message, no `error.message`/`error.stack` in the response).

**Both deploys, 2026-09-25:** pre-deploy source hashes confirmed byte-identical between the intended `origin/main` source and BACKUP's already-deployed source for both functions (SHA-256 match on every file) before touching production — high confidence the redeploy was a pure reconciliation, not an unreviewed change. Focused test suite (`base44/functions/tests/security.test.ts`, 26 tests including `scanAd requires authenticated callers and Base44 media URLs`, `validateMediaUrl accepts trusted Base44 media hosts and rejects everything else`, `migrateLocationImages rejects unauthenticated and non-admin callers`, `migrateLocationImages permits an admin and hides failures`) — all passed before deploying. Rollback artifact (pre-deploy production source + checksums + restore procedure) saved before either deploy. No schema, entity, or data changes involved in either fix — pure function-code reconciliation.

**Both functions' actual authorization checks themselves (who's allowed to do what) were otherwise intact and correct on production throughout** — this was specifically about a missing input-validation layer (`scanAd`) and a missing error-sanitization layer (`migrateLocationImages`), not a broken auth boundary. Also noted during the original investigation: `n8nPing`'s production source carried a stale internal comment reading "PROPOSED PRODUCTION PATCH — not deployed" despite being what was live at the time — a cosmetic/documentation inconsistency only, the actual hardened logic underneath matched the already-verified Phase 1 fix exactly; not re-deployed just to fix a comment.

## Non-findings / explicitly ruled out as safe

- `DigitalBust`, `LocationPhoto` also lack certain field-level locks, but their entity-level `update` RLS is admin-only with no creator-self-edit clause — so the missing field lock is not independently exploitable there. Confirmed via schema on both origin/main and production.
- `Mint.status` lacks a field lock and allows creator self-update on both origin/main and production — but this is by design (self-reported blockchain transaction state, not a moderation/trust field).
- `QuestCompletion`, `StoreItem`, `Purchase`, `Subscription`, and other admin-only-write entities checked and confirmed identical between production and origin/main — no gap.
