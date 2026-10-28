# anonymous-ai-containment — spec and cost report (proposal; nothing changed in production)
Owner: David (policy checkpoint) + engineering · Status: draft · Date: 2026-10-28 · Evidence: repo at `1dbddda`, production function list (read-only CLI), Base44 docs read 2026-10-28, private usage ledger/investigation notes (aggregates only)

## 1. Where credits were actually going (REPORTED/inferred, not measured per source)
No active Base44 automation exists in the repo: the only scheduled one (`cleanupIntelCache`) is declared inactive; the only GitHub cron is weekly CodeQL. Dashboard-side automations are **not readable by this session** (UNKNOWN: ask David for the Automations list). The measured burn was **page-load AI calls** in the browser: baseline Home 5 / Map 4 `InvokeLLM` per load (control run 40227417944), now 0 on affected paths (#384, live). So there is **no automation to move to GitHub**; the cost lever was already pulled by #384.
Server side is already bounded: `cachedIntel` = at most one `InvokeLLM` per day per registry key (one key, flash model); `scanAd` requires a signed-in caller; `generateOgImage` is admin-only; `migrateLocationImages` is admin-only.

## 2. Remaining browser-callable AI (caller / permission matrix)
| Caller | Route / trigger | Anonymous today | Prompt control | Billable work before access check |
|---|---|---|---|---|
| `ReportStep2Identify` | /report step 2, user clicks AI detect (photo) | yes (anonymous reporting is intended) | client-built prompt | yes (browser calls integration directly) |
| `TrashId` | /trash, user photo | yes | client-built | yes |
| `UnitFinder` | Map finder, user types a place; web search on | yes | **user text interpolated into prompt** | yes |
| `FieldCheckCamera` | field-check panel photo | not verified | client-built | yes |
| `KlimaWidget` | no importer | n/a (dead code) | n/a | none |
The shared problem is not these four callers: the underlying browser-callable `base44.integrations.Core.InvokeLLM` accepts any prompt from anyone. REPORTED by #384 and Base44's own Security page ("Unauthenticated Consumption of High-Cost LLM Integration", High, stale scan). **Not re-verified live in this task**: doing so costs a credit and was not authorised.

## 3. What Base44 documents (read 2026-10-28)
- Credits: AI call ≈ 1 credit (Automatic) or ≈ 3+ (other models); function invocation ≈ 1 credit per 100; database reads/writes free. "Calling an external service with your own API key does not use" integration credits (but the function invocation still counts).
- Credits docs describe **no way to cap or restrict anonymous use**; only member limits, an "Unusual spend" card, and usage filters. Out of credits ⇒ the integration fails for everyone.
- AI gateway docs: the service-role gateway returns **403 to browser/user tokens**; no rate limits documented ("build your own per-user check"); no per-user cap. Documented user mode only works on privately shared / workspace apps (not usable here: the app must stay public for mapping/reporting).
- **Conclusion (UNKNOWN until Base44 confirms):** no documented setting restricts the *original* browser-callable `Core.InvokeLLM` on a public app. A protected wrapper function does not close it while the original stays callable; it only stops *our* callers needing it.

## 4. Smallest supported change (proposal, in order; each needs the security-policy checkpoint)
1. **Ask Base44 support / the dashboard "Prevent unauthorized credit usage" item** (owner action, no code): is there a supported setting to require auth for, or disable, browser-callable integrations on this app? Record the answer. This is the only step that can actually close the hole.
2. **Move the four callers behind one backend function** that checks `auth.me()` *before* any billable work, accepts a fixed task enum + validated input (image URL host allowlist as `scanAd` does; place name length/charset), fixed server-side prompts (like `cachedIntel`), a timeout, and a small per-user daily allowance in an entity. Anonymous mapping/reporting keep working; **AI-assist becomes sign-in-only** (product decision for David; the report flow must degrade to manual entry, not break).
3. Only after 1 or the platform answer: remove browser access to the integration if a setting exists. Without a setting the original stays open and the residual risk must be recorded as accepted by David.
Limits to state honestly: an entity-backed allowance is **not atomic** (concurrent calls can overshoot) and in-memory counters are per-instance; neither is durable global enforcement. A hard spending cap is not documented; the only backstop is credit exhaustion (affects all users).

## 5. Rollback and acceptance
Rollback: re-deploy the previous frontend bundle (`~/ooh-release-records/2026-10-28/live-f63fdb1-dist` pattern) and delete the new function; callers revert to the direct integration. Acceptance (offline first, Deno stubs + Playwright request spy): anonymous call to the new function ⇒ 401 and **zero** integration calls; signed-in valid ⇒ one call; oversize/invalid input ⇒ 400 and zero calls; allowance exceeded ⇒ 429, zero calls; report flow still submits without AI. BACKUP integration test only with a stated request budget (≤ 3 calls) and David's explicit approval. No load test, no production probing.

## 6. Cost report for David (labelled)
| Claim | Evidence | Status |
|---|---|---|
| Page loads no longer make the removed AI calls | Baseline Home 5 / Map 4 (CI control) vs 0 on BACKUP and on production, 2026-10-28 | VERIFIED (request counts) |
| Credits saved | None measured. Sample 2 (2026-10-25 18:56Z): production 319.31 = AI 240 + functions 79.31; a comparable post-release sample is **missing** | UNKNOWN — no saving claimed |
| Rough exposure per load before #384 | 5–9 AI calls × ≈1–3 credits per Base44 docs (model unknown) ⇒ order of 5–25 credits per Home+Map visit | ESTIMATE from documented rates, not measured |
| Remaining function overhead | ≈7 function calls per Home load (fieldStats ×4, fieldNews, cryptoWatch, cachedIntel) ≈ 0.07 credit per load at 100 invocations/credit | ESTIMATE; fieldStats ×4 is a candidate dedupe (frontend change, not done) |
Sample 3 not taken: the Windows Chrome debugging profile was not signed in to Base44 (no credentials were entered). Needed: sign in once; read App usage (same surface as sample 2); record AI vs functions, test traffic (my BACKUP/production checks on 2026-10-28), and reporting lag. Compare only like for like.
