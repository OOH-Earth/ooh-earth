# Security checkpoint — anonymous AI containment prototype (for owner decision; nothing deployed)
Date: 2026-10-28 · Prototype: branch `proto/ai-assist-auth-boundary` @ `3f5d8f2d1fb99f381f1b9b5f8fdc544adb60a693` (tree `9c473489…`), draft PR, base `maintenance/production-2026-10-02` · Owner contacts: David is the confirmed production recovery and Base44 owner contact; **no fallback person is assigned** (not invented here).

## 1. Journey protected
`/report` Step 2 "AI brand scanner" (photo → brand, campaign, sector, parent corp). Deployed today: the browser calls the AI integration **directly** with a client-built prompt (`ReportStep2Identify.jsx`), anonymously. Step 1's scanner already uses the `scanAd` backend function (auth-required; production source pulled read-only on 2026-10-28 is byte-identical to the repo). Contract reused unchanged: input `{file_url}` (HTTPS Base44 media URL), output `{detection:{brand_name, campaign_name, industry_sector, parent_corp, is_advertising,…}}`; same sector vocabulary.
Not chosen: `UnitFinder` — it asks a model for "real or highly probable" ad units and saves them as Locations (same unsupported-generated-claims class #384 withdrew); hardening it would entrench it. Product decision needed (§7).

## 2. What the prototype changes
- `scanAd/handler.ts`: identity checked **before** body is read and before any billable call (unchanged order); body cap 8 KB (413, also via declared content-length); non-object/array/invalid JSON bodies treated as empty ⇒ 400; 45 s application-level timeout ⇒ 504 `Scan timed out`; 64 KB output cap ⇒ 502; logs only the constant `timeout`/`failure` (previously the provider's message text).
- `ReportStep2Identify.jsx`: calls `scanAd`; signed-out ⇒ `Sign in or fill the fields below` message, **no request**; double activation ignored; failure ⇒ existing "fill manually" message, user input kept.
- No general-purpose proxy: prompt, model and schema stay server-controlled; client supplies only a validated URL. No new dependencies, schema, setting or function created.

## 3. Access matrix (proposed)
| Caller | Anonymous | Signed-in | Admin |
|---|---|---|---|
| `/report` Step 1 scanner, Step 2 scanner (via `scanAd`) | 401 / sign-in note, zero AI calls | allowed | allowed |
| `/report` manual entry, mapping, submission | unchanged (anonymous allowed) | unchanged | unchanged |
| `TrashId`, `UnitFinder`, `FieldCheckCamera` | **not migrated** — still direct browser calls | same | same |
Compatibility impact: anonymous visitors lose Step 2 AI-assist (already true for Step 1); they keep the full manual form. Pending David's sign-in-only decision.

## 4. Evidence (tested SHA `3f5d8f2`)
Server (Deno, offline; auth and integration stubbed, `fetch` blocked, console captured): 9 new tests, full offline suite **81 passed, 0 failed**. Matrix covered: anonymous / empty identity / no id / expired (auth throws) / auth-service down; spoofed `user_id`/`role`/`authenticated` body and headers; valid ⇒ exactly 1 call; not-JSON, empty, array, null, missing/non-string/object URL, oversized URL, http, foreign host, credentials-in-URL, `javascript:`, `data:`, oversized and declared-oversized body, wrong methods ⇒ **zero integration and zero network calls**; provider rejection ⇒ stable `Scan unavailable`, no secret/prompt/URL in response or logs; hung provider ⇒ 504 (25 ms test timeout); oversized result not returned; no token/identity in logs.
Negative control: the same tests against the **original** handler: 5 pass, **4 fail** (body size, internals logging, timeout, output cap) — identity rejection was already sound, hardening is what changed.
Static: prettier, eslint, `npm run typecheck` all exit 0.
Browser (Windows Chrome DevTools MCP, local Vite + local mock API, no Base44/production traffic, synthetic in-memory image): signed-out ⇒ sign-in note, typed input kept, 0 `scanAd` / 0 `InvokeLLM` requests after a double-click; signed-in ⇒ keyboard Enter ×2 ⇒ exactly 1 `scanAd`, fields filled, visible focus; loading state `SCANNING…` disabled; injected 502 ⇒ "Detection failed — fill manually", edited field preserved, retry works; no horizontal overflow at 320 and 390; total across runs: 3 authenticated `scanAd`, 0 unauthenticated, 0 `InvokeLLM`. Widths actually tested: 1039 (window-limited desktop), 390 (signed-out), 320 (signed-in). Pre-existing: the Identify button is 38 px tall (below 44 px touch target). UI checks complement, and do not prove, server authorization.

## 5. Limits (state plainly)
- **The original browser-callable `InvokeLLM` is untouched.** Any anonymous client can still call it directly with any prompt. This prototype only removes one of four legitimate callers' need for it. **Containment is NOT complete.**
- Platform research (Base44 docs read 2026-10-28; additional search): no documented setting to require auth for, restrict or disable browser-callable integrations on a public app; no documented rate limit or spending cap (docs: "build your own per-user check"); the AI-gateway doc says browser/user tokens get 403 on the **service-role gateway** only. A supported restriction path is **UNKNOWN** — needs Base44 support or the owner dashboard (Security page lists "Unauthenticated Consumption of High-Cost LLM Integration" and "Prevent unauthorized credit usage"; contents not opened, scan stale).
- The 45 s timeout bounds this function's wait only; the SDK documents no abort option, so a timed-out call may still bill. No per-user quota is implemented: an entity-backed counter would be non-atomic and process-memory counters are per-instance, so neither is durable global enforcement.
- `auth.me()` failure and "no identity" both ⇒ 401 (the SDK throws for unauthenticated), so they are indistinguishable by design; both make zero AI calls.

## 6. Rollback
Not deployed ⇒ nothing to roll back. If later released: redeploy the previous `scanAd` (`handler.ts`@`f63fdb1`/production-identical) with `functions deploy scanAd` and the previous frontend bundle (`~/ooh-release-records/2026-10-28/live-f63fdb1-dist` pattern); no schema involved.

## 7. Owner decisions still needed (none taken)
1. Sign-in-only AI-assist: approve, or choose another policy (e.g. keep anonymous with a server-side allowance). 
2. Whether `UnitFinder` stays at all (generated, unverified units).
3. Ask Base44 support/owner for a supported restriction of the browser-callable integration; or explicitly accept the remaining exposure in writing.
4. Approve a function deploy of `scanAd` (single function, BACKUP first) and a frontend release — separate checkpoints; no release from this prototype without them.
