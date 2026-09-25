# Founding Profile Discovery — Product Decision Package

Investigation only. No implementation, no schema/entity/function changes, no BACKUP/production writes. Evidence gathered 2026-09-22 against `origin/main` at `0850422a84b09073d02ecf157ecded466f4f91dc`.

## 0. Multi-brand decisions — recorded (carried over from the prior investigation)

Confirming these 7 decisions are captured (see `01-PRIORITY-QUEUE.md` for the full record, already written up after the architecture investigation):
1. `AdObservation` is the preferred future architecture for separating rotating commercial content from persistent physical Locations.
2. **Not implemented now** — production evidence shows low usage (1.9% `brand_name` fill rate, 0.9% `parent_corp`, exactly one confirmed multi-brand concatenation case).
3. No migration/backfill planned.
4. `Location.brand_name` and related commercial fields remain available for compatibility/current-state use.
5. No `Brand`/`Campaign`/`Creative` entities yet.
6. Brand suggestions stay lightweight/curated (extending the existing `advertiserRegistry.js` pattern, not a normalized entity).
7. `ooh_operator` treated as physical-asset-model data unless future evidence says otherwise.

All 7 already match what `09-MULTI-BRAND-DATA-MODEL.md` and `01-PRIORITY-QUEUE.md` recorded — no correction needed.

## 1. Current Founding Profile flow, reconstructed from source

**Not a new entity.** Per `src/lib/founderProfile.js`'s own header comment: "A Founding Profile is not a new entity: it's the existing self-editable User fields (`full_name`, `handle`, `bio`, `avatar_url`) plus a small set of additional freeform fields (`region`, `focus_areas`), using the exact same self-service path" (`base44.auth.updateMe`). `founding_member` is the one schema-declared, admin-only field on `User.jsonc` — never settable by the user themselves.

**Editing (`src/pages/Account.jsx`, "PROFILE" tab):** handle input (validated via `HANDLE_PATTERN = /^[a-zA-Z0-9_-]{2,32}$/`, duplicate-checked live via `getPublicProfile`'s `mode: "check"`), display name, avatar URL, bio (280 chars), region (60 chars, "never your precise location"), up to 5 focus areas from a fixed 10-item list, and the `profile_public` toggle (defaults `false`, explicit copy: "Off by default. Turn this on to publish your name, handle, bio, region, focus areas, and verified-contribution counts at a public URL anyone can view. Turn it off any time to stop anyone from seeing it — this takes effect immediately on save."). Saving calls `base44.auth.updateMe(...)` with exactly these fields (never `role`/`access`/`agency`/`founding_member`, which are schema-write-locked to admin regardless).

**Publish/unpublish:** a single boolean toggle + save. No separate "publish" step, no draft/preview state, no confirmation dialog. Once `profile_public: true` and `handle` is valid, `Account.jsx` shows a "View public profile →" link to `/founders/${handle}`; while `false`, it shows "Your profile is private — turn on 'Public Founding Profile' above and save to publish it."

**Public rendering (`src/pages/FounderProfile.jsx`, route `/founders/:handle`):** calls `getPublicProfile` client-side, renders a `loading | found | not_found | error` state machine. On `found`: avatar (or initials fallback), name/handle, "Founding Member" badge (if applicable), "Member since" (formatted `created_date`), region, bio, focus-area chips, and a 2-stat contribution block (verified reports / verified re-checks) or an honest "No verified public contributions yet" empty state. On `not_found`: "No founding profile exists at @handle" — **identical response shape whether the handle genuinely doesn't exist or exists but isn't public** (confirmed in `getPublicProfile`'s own code and comment — this is intentional privacy-by-indistinguishability, already correctly designed).

**`getPublicProfile` (`base44/functions/getPublicProfile/entry.ts`):** two modes. `check` — is this handle taken, and is it mine (used only by the edit form's live duplicate-guard, compares against the caller's own identity, cannot enumerate other users). `view` (default) — the actual public lookup, detailed in §3.

**Discovery/links into profiles from elsewhere:** see §4 — there are none, beyond the owner's own Account-page link.

## 2. Aggregate public-profile data — what could and couldn't be determined safely

Attempted a read-only, no-PII, aggregate-only count (matching the exact method used for the multi-brand investigation's Location counts) via the authoritative API using the CLI's own management bearer token: `GET /api/apps/{id}/entities/User?limit=1000` → **`403`: "Authentication required to list users... You must be logged in to perform this operation."**

**This is itself a meaningful, decisive finding, not a dead end:** `getPublicProfile`'s own source comment states plainly, "there is no general client-side `User.filter()` exposed to non-admins, by design" — and this investigation's attempt just confirmed that restriction extends even to the CLI's own elevated management token, not just an ordinary end-user session. Reading aggregate User data (even privacy-safe counts) requires either (a) a genuine authenticated *end-user* session with the platform's own admin-facing data view (something only Dave, as the workspace owner, can cheaply do via the Base44 dashboard itself), or (b) a new `asServiceRole`-elevated server function (exactly what a directory-listing function would itself need to be — see §10). No end-user production session was available this pass, and per the standing "do not manufacture credentials" rule, none was created to force this number.

**FOUNDING_MEMBER_COUNT / HANDLE_COUNT / PUBLIC_PROFILE_COUNT: not safely/reliably determinable from this investigation's available access.** Reported honestly rather than guessed. Dave can get the real numbers directly from Base44's own data view in under a minute — recommended as the one, single cheap step if this decision needs a harder number before finalizing (see §13's reconsideration trigger).

**Strong qualitative signal in place of an exact count:** `profile_public` is referenced in exactly one place in the entire frontend (`Account.jsx` — confirmed via a fresh `git grep`, not assumed from memory) — no onboarding step ever prompts a new user to enable it, no badge/gamification system rewards or references it, no other page mentions it. It is a single, unadvertised, off-by-default toggle inside a settings tab. This is a strong (if not numeric) signal that adoption is currently low — a toggle with zero product-side encouragement to use it, in a young feature (shipped this session, alongside Public Space), is very unlikely to have meaningful uptake yet.

## 3. Public data contract (`getPublicProfile`, read only — not modified)

**PUBLIC** (returned in the `view` response when `found: true`):
- `profile.handle`, `profile.full_name`, `profile.avatar_url`, `profile.bio`, `profile.region`, `profile.focus_areas`, `profile.founding_member`, `profile.member_since` (= `User.created_date`).
- `contributions.verified_reports`, `contributions.verified_rechecks` — **counts only**, computed server-side via `asServiceRole.entities.Location/FieldCheck.filter({created_by_id, status: 'verified'})`; no list of the actual records, no titles, no locations, no dates of individual contributions.

**PRIVATE, CONFIRMED EXCLUDED** (never present anywhere in the function's response shape, in either mode): `id` (the User's own record id — the public identifier is `handle`, never the internal id), `email`, `role`, `access`, `agency`, `disabled`/`disabled_reason`, `is_verified`, `force_password_reset`, `collaborator_role`, and any pending/rejected Location or FieldCheck data (only verified counts are computed; no raw rows are ever returned). Confirmed by direct code read — the response object is hand-built field-by-field from a fixed allowlist, not a serialized User record with fields stripped after the fact, which structurally rules out an accidental future leak of a newly-added User field.

**DERIVED/UNKNOWN:** none — every returned field maps directly and traceably to a User property; nothing is inferred or computed beyond the two verified-contribution counts.

**Confirmed: cannot expose email/role/access/agency/internal IDs/private metadata** — by construction, not by a filter that could be bypassed. No changes proposed or made to this function.

## 4. Discovery today — confirmed via a fresh, complete search

`git grep -n "founders\|FounderProfile" origin/main -- 'src/*'` (re-run fresh for this investigation, not reused from any earlier session's memory) returns exactly 5 hits:
1. `App.jsx` — the lazy import.
2. `App.jsx` — the `/founders/:handle` route registration.
3. `founderProfile.js` — a comment.
4. **`Account.jsx` — the one and only internal link**, `to={`/founders/${normalizeHandle(me.handle)}`}`, rendered only for the profile's own owner, only when `profile_public` is true.
5. `FounderProfile.jsx` — the component itself.

**No link exists from:** the leaderboard, any contribution/activity feed, any Location or LocationDetail page, any search or navigation menu, the homepage, any community/portal surface, or any admin surface. **A visitor cannot discover another public founder's profile without already being given the exact handle by that founder directly** (a shared link, a mention elsewhere, etc.) — confirmed structurally, not assumed.

**Notable, directly relevant finding:** `Leaderboard.jsx` (the most natural existing "contribution discovery" surface) **explicitly and deliberately masks member identity today** — its own UI copy states "Member identities masked for privacy," and it renders only a masked `OP-XXXX` id derived from the user's internal id, never a handle, name, or profile link, **for every user regardless of their `profile_public` setting.** This is an existing, deliberate privacy decision already made by the product, not an oversight — and it directly bears on Option C (§7).

## 5. Product value — what would a directory actually enable, given what the product has today

| Potential goal | Does current product data support it? |
|---|---|
| Recognition for early community members | Yes — `founding_member` badge and `member_since` already exist and render correctly on the individual profile page. A directory would surface this more broadly, but the recognition data itself already works. |
| Community discovery ("who else is doing this near me") | Partially — `region` exists (deliberately imprecise, "never your precise location"), but with near-zero current public-profile adoption (§2), there's nothing to discover yet. |
| Contributor identity | Yes — handle/name/avatar/bio are all real, working fields. |
| Reputation | Partially — only two aggregate counts (verified reports/rechecks) exist; no ranking, no comparison UI beyond the already-existing (and identity-masked) leaderboard. |
| Networking | **No support in the product today** — no messaging, no following, no contact mechanism of any kind exists or is implied by any current feature. A directory would not, by itself, enable networking; it would only enable *finding* someone, with no next step beyond whatever contact info (if any) the person volunteers in their own bio. |
| Geographic/community discovery | Weak — `region` is a free-text, low-precision field with no structured geocoding tied to it; a directory couldn't meaningfully filter or map by it without new work. |
| Contribution attribution | Already works via the individual profile page's stat chips; a directory doesn't add anything new here, just surfaces it more broadly. |

**Conclusion:** a directory's real, evidenced value is narrow — better recognition surfacing for the (currently very small, likely near-zero) set of people who've both become founding members *and* opted into `profile_public`. It does not unlock networking, ranking, or geographic discovery in any way the current product actually supports — those would require genuinely new features this task correctly says not to invent.

## 6. Privacy model

`profile_public` defaulting to `false` is the one hard invariant to preserve, and every option below preserves it — none propose changing the default or removing the toggle.

**The real question is narrower and more specific than "should profile_public gate a directory":** does consenting to "a public URL anyone can view" (the toggle's exact current copy) also mean consenting to "appear in a browsable list next to every other opted-in member"? These are not obviously the same act of consent. A public URL is *discoverable-if-shared*; a directory listing is *discoverable-by-browsing*, a meaningfully broader exposure with no action required by anyone who already knows the person.

- **Model A (profile_public automatically = directory-listed):** **not recommended without an explicit copy change.** The current toggle's own wording ("a public URL anyone can view") frames this as share-by-link, not "listed for browsing" — silently reinterpreting existing opt-ins as directory consent would retroactively expand what people already agreed to, without them having agreed to it. Rejected for the same reason this task's own instructions warn against choosing it "merely because it requires fewer fields."
- **Model B (separate directory opt-in):** the privacy-correct model if a directory is ever built — respects that the two are genuinely different acts of consent. Costs one more boolean field and one more toggle in `Account.jsx`; cheap, and it would need a re-consent moment for anyone already `profile_public: true` before appearing (or, more simply, default the new field to `false` for everyone, including existing opted-in profiles, and let the existing "View public profile" flow stay exactly as it is regardless).
- **Model C (profiles remain URL-only):** the current state; preserves the existing, already-understood consent model exactly.
- **Model D:** not needed — B and C together already cover the responsible design space; nothing in the evidence gathered here points to a materially different fourth model.

## 7. Directory options, evaluated

**Option A — keep URL-only (current state).** Simplicity: highest (already built, zero further work). Privacy: cleanest (matches the exact consent already given). Community value: limited to whoever already has a shared link. Current adoption: unknown exact count, but the toggle's total lack of visibility/promotion (§2) strongly suggests very low uptake so far.

**Option B — simple public directory.** A new `/founders` (or similar) route listing opted-in profiles, using only fields already public per-profile (§3) — no new data exposure, only new aggregation. Value: real but narrow (§5). Privacy: requires Model B's separate opt-in (§6) to be done responsibly; using the existing `profile_public` flag alone would misrepresent consent. Implementation: a new route/page (small) **plus a new backend listing function** (not small — see §10; `getPublicProfile` cannot support this today). Sorting: by `member_since` (already available, no new field needed) is the least presumptuous default — avoids inventing a "reputation ranking" the product doesn't otherwise have. Empty states: a real, material risk given §2's evidence — a directory with 0–2 entries reads as a broken or abandoned feature, not a recognition tool. Abuse/moderation: low incremental risk beyond what already exists on the individual profile page (bio/avatar content moderation would be a pre-existing gap either way, not new to a directory).

**Option C — contribution-based discovery (no standalone directory; surface real identity through existing surfaces like the leaderboard).** Directly evaluated against the strongest existing candidate surface, `Leaderboard.jsx` — and found to conflict with an existing, deliberate design decision: the leaderboard explicitly masks identity for privacy today, for everyone, regardless of `profile_public`. Making an exception for opted-in users (show real handle + profile link instead of `OP-XXXX` only for those with `profile_public: true`) is a coherent, evidence-consistent idea, but it is a **privacy-model change to an existing, working, deliberately-anonymous surface** — a materially more sensitive change than adding a new, clearly-labeled directory page, and it still requires the same new backend capability Option B needs (a way to know, for a batch of user ids, who is opted in — §10). Better fit for the product's existing structure than a brand-new page, but not meaningfully cheaper or lower-risk given the evidence.

**Option D — hybrid.** Not separately justified by the evidence gathered: nothing here suggests a combination of B+C is better than picking one, and the honest recommendation (§12) is neither, for now.

## 8. Directory scale / empty-state test

Exact current count is not available (§2), but the qualitative evidence is consistent and points the same direction: a toggle that appears in exactly one place in the app, with zero prompts, zero incentives, and no measurable promotion, shipped in the same release as the rest of the Founding Profile feature. It would be surprising if double-digit users have found and enabled it yet. **A directory built today would very plausibly render as empty or near-empty** — which actively undermines the recognition goal it would exist to serve (an empty "community directory" reads as "nobody's here," the opposite of the intended effect). This is the deciding factor in §12's recommendation, not an arbitrary threshold — the product reasoning is: *a recognition feature that looks abandoned on day one does more harm to the community-recognition goal than not having the feature yet.*

## 9. Minimum useful version (documented for future reference, not being built now)

If and when adoption data justifies building this: route `/founders` (public, no auth required to view, matching `/founders/:handle`'s own access model); one nav entry (likely from the existing "Member profile"/community area, not the primary nav, to avoid overpromising a feature that may have few entries even once launched); a simple card grid reusing `FounderProfile.jsx`'s own `Avatar`/`StatChip` components (no new visual design needed); sort by `member_since` ascending (earliest first — matches "Founding" framing, needs no new field); simple offset/cursor pagination sized for a small dataset (no need to over-engineer for a directory that may have single-digit-to-low-double-digit entries for a long time); an honest, non-defeatist empty state ("No public founding profiles yet — be the first," with a link to the Account toggle) rather than hiding the page if it's empty; accessible via the same patterns already used on `FounderProfile.jsx` (semantic headings, `role="img"`/`aria-label` avatar fallback already implemented there); mobile-responsive card grid, no new breakpoints needed beyond what `FounderProfile.jsx` already establishes. **Not needed even in a v1:** following, messaging, likes, a social graph, or any ranking beyond simple chronological order — none of these are implied by anything the current product already does.

## 10. Backend requirements

**Confirmed: `getPublicProfile` cannot support discovery as written.** It resolves exactly one handle at a time (`base44.asServiceRole.entities.User.filter({ handle })`, taking `matches?.[0]`) — there is no listing branch, no pagination, no bulk mode. Read directly from source, not inferred.

**A directory would need a new function** (name illustrative only, not being built — e.g. `listPublicFounders`). Its minimal conceptual contract:
- Server-side only, `asServiceRole`-elevated (exactly like `getPublicProfile`'s `view` mode).
- Filters explicitly on the *directory* opt-in field from §6 (not implicitly reusing `profile_public` — respecting the consent distinction drawn there), never returning anyone who hasn't explicitly opted into listing.
- Returns only the exact same allowlisted fields `getPublicProfile` already exposes per-profile (§3) — no new fields, no expanded exposure, purely an aggregation of what's individually already public.
- Never returns `id`/`email`/`role`/`access`/`agency`/private metadata — same hard allowlist discipline as `getPublicProfile`.
- Paginated with a bounded page size (avoiding an unbounded full-table response).
- Sorted server-side (by `created_date`, matching §9) so the client never needs broader read access to compute ordering itself.

**Schema change required:** yes, if Model B (§6) is adopted — one new boolean field (e.g. `directory_listed`) on `User.jsonc`, self-editable exactly like `profile_public`, defaulting `false`. This is the only schema change any option in this document would need; not proposed for implementation now.

**Function change required:** yes — one new function, not a modification to `getPublicProfile` (keeping the existing, already-hardened single-lookup function untouched and unexpanded, per this task's own instruction not to modify it).

**Frontend change required:** yes, if built — one new route/page (§9), one new Account.jsx toggle (if Model B), zero changes to `FounderProfile.jsx` itself (its components would just be reused, not modified).

## 11. Security / abuse analysis

**Risks already inherent in the existing public-URL model (unchanged by any option here):** anyone who knows or guesses a handle can already view that profile's full public allowlist (§3) — this is already true today and is the accepted, understood tradeoff of the existing "public URL anyone can view" feature. Handle-squatting/impersonation risk already exists today (any valid-pattern handle can be claimed) and is unrelated to discovery.

**Risks materially increased specifically by bulk discovery (a directory or leaderboard-integration), not present today:**
- **Enumeration/scraping:** today, finding public profiles requires already knowing a handle (or brute-forcing the 2–32 character handle space, which the "identical response for not-found vs. not-public" design already resists efficiently sampling). A directory or bulk-listing function inherently makes it trivial to enumerate every opted-in profile in one or a few requests — this is the core, honest tradeoff a directory makes, not a bug to fix, but a real increase in exposure that must be a deliberate, informed choice (hence §6's emphasis on explicit, separate consent).
- **Profile-content abuse at scale:** today, a bio/avatar with abusive content is only seen by whoever already has the link; a directory would put it in front of anyone browsing. No new moderation *mechanism* is proposed here (out of scope for this decision), but the *exposure surface* for existing, unmoderated free-text fields (`bio`) would increase.
- **Directory spam:** a bulk-listing surface is a more attractive target for automated fake-profile creation than a share-by-link model, where there's no incentive to create a profile nobody will ever visit.

None of these risks are disqualifying — they're the standard, well-understood tradeoffs of any opt-in directory feature — but they are new relative to today, which is exactly why Model B's explicit, separate consent (§6) matters rather than silently reusing `profile_public`.

## 12. Decision matrix

| Dimension | A — URL-only | B — Simple directory | C — Contribution-based discovery |
|---|---|---|---|
| Current user benefit | Works for whoever already has a link | Real but narrow (§5), undermined by likely-empty state (§8) | Real but conflicts with an existing deliberate privacy design (leaderboard masking) |
| Privacy impact | None (matches existing consent exactly) | Moderate — needs new, separate consent (§6) to be done responsibly | Higher — changes an *existing* anonymous surface's behavior |
| Implementation scope | None | New route + new schema field + new function | New function + a privacy-sensitive change to existing, shipped UI |
| Backend scope | None | New `asServiceRole` listing function (§10) | Same new listing capability, applied differently |
| Discoverability | Share-by-link only | Full browsable listing | Partial (only within leaderboard's existing ranking context) |
| Community value | Limited by adoption | Limited by adoption AND undermined by empty-state risk today | Limited by adoption; benefits from leaderboard's existing traffic |
| Empty-state risk | N/A (no listing surface to look empty) | **High, today** (§8) | Lower (leaderboard has content regardless of opt-in count) |
| Abuse surface | Baseline (unchanged) | Increased (enumeration, spam) | Increased, same degree as B |
| Maintenance | None | Ongoing (new page, new function, new field) | Ongoing (modifies a shipped surface) |
| Reversibility | N/A | High (unused route/function can be removed cleanly) | Lower (once real identities appear on the leaderboard, reverting to full masking is a visible behavior change for real users, not just an unused code path) |

**RECOMMENDED_DIRECTION: Option A (keep URL-only) for now.** If/when reconsidered, prefer Option B (a clearly-labeled, separately-consented directory) over Option C — B is more reversible, doesn't touch an existing shipped privacy surface, and its empty-state risk (the main argument against building now) resolves naturally as adoption grows, whereas C's cost (modifying the leaderboard's privacy model) doesn't get any cheaper with time.

**BUILD_NOW_OR_DEFER: DEFER.**

**RATIONALE:** No option here fails on merit — a directory is a coherent, evidence-grounded idea with real (if narrow) value once genuine adoption exists. The decisive factor is timing, not design: the qualitative adoption signal (§2, §8) strongly suggests near-zero current uptake of a feature with zero promotion, and building a browsable directory on top of that produces an empty, recognition-undermining surface rather than a valuable one. This mirrors the multi-brand decision's own reasoning (§0) — a sound target design, correctly not rushed ahead of real demand.

## 13. Reconsideration trigger

Revisit this decision when **any** of the following becomes true:
1. Dave checks the real `profile_public: true` count directly via Base44's own dashboard (the one cheap, non-invasive step this investigation couldn't take itself) and finds meaningful adoption (a specific number isn't prescribed here — Dave is better positioned to judge what "meaningful" means for this community's actual size than an arbitrary threshold set in this document).
2. A real, organic user request for discoverability surfaces (someone asks "how do I find other members" or similar).
3. Any future feature independently needs a bulk/paginated public-User-read capability for an unrelated reason — at that point, the marginal cost of also supporting directory listing drops substantially, changing this decision's cost side of the ledger.

## 14. Next priority (identified, not started, per this task's explicit instruction)

With multi-brand deferred and Founding Profile discovery deferred, the priority queue's next genuinely executable item is the remaining `KNOWN_ISSUES.md` #16 react-query migration candidates (`CareersAdmin.jsx`/`Store.jsx`/`Plans.jsx`/`PortalOps.jsx`), each still needing its own dedicated scoping pass per `01-PRIORITY-QUEUE.md`'s existing record — not started under this prompt.
