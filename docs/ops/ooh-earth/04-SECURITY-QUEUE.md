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

## OPEN — production function drift, 2026-09-25 (details withheld from this public repo pending fix)

A broader Base44/GitHub reconciliation pass on 2026-09-25 found that **two production functions are running behind already-hardened, already-tested source that exists on `origin/main` and BACKUP.** One of the two is security-relevant. Neither has been deployed to production.

**This repository is public.** Per standard responsible-disclosure practice, the specific mechanism, affected endpoint behavior, and impact analysis are deliberately **not detailed in this public file** while the gap remains unpatched on production — publishing exact exploit conditions before a fix ships would hand that recipe to anyone reading this repo. The full technical writeup (exact functions, exact code paths, prepared redeploy commands) is recorded privately (local operational notes, shared directly with the project owner) and is not duplicated here.

**What can be said publicly:** the fix in both cases is a straight redeploy of source that already exists, unmodified, on `origin/main` and is already live on the BACKUP environment — no new code needs to be written. This is a Lane D action (production function deploy) requiring the project owner's explicit authorization before it happens, same as any other production write in this repo's process. Once deployed and verified, this entry will be updated with full detail, matching this file's normal practice for closed findings elsewhere in this document.

## Non-findings / explicitly ruled out as safe

- `DigitalBust`, `LocationPhoto` also lack certain field-level locks, but their entity-level `update` RLS is admin-only with no creator-self-edit clause — so the missing field lock is not independently exploitable there. Confirmed via schema on both origin/main and production.
- `Mint.status` lacks a field lock and allows creator self-update on both origin/main and production — but this is by design (self-reported blockchain transaction state, not a moderation/trust field).
- `QuestCompletion`, `StoreItem`, `Purchase`, `Subscription`, and other admin-only-write entities checked and confirmed identical between production and origin/main — no gap.
