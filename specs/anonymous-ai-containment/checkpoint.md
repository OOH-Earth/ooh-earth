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

---

# Update 2026-10-29 — "authenticated brand-scanner hardening" (not complete AI containment)
Decisions recorded in `docs/ops/ooh-earth/07-DECISION-LOG.md` (2026-10-29; owner-side instruction relaying David's delegated direction, not a new direct statement from David). v1 above is preserved as history.

## Reviewed head
Draft PR #391, branch `proto/ai-assist-auth-boundary`, head `5356b87646cafe4c6fbe9c94808ffa9466c05863`, tree `1e865742f3d956049c0e7ba5f86ce4a5bb05555b`, base `maintenance/production-2026-10-02` @ `1dbddda`. Separate draft PR #397 (`fix/unitfinder-generation-containment` @ `be3a77b0…`) for the UnitFinder decision. Neither is merged or deployed to production. **CI on these exact heads has not been confirmed in this update** (drafts; see blockers).

## Review checklist for #391 (findings)
| Check | Result |
|---|---|
| Server identity before billable work | Yes: `auth.me()` runs before the body is read and before `InvokeLLM`; unchanged order. Caller-supplied id/role/flags are never read (tested). |
| Limits on actual received bytes | **Defect found and fixed:** v1 used `req.text()` + character length, so multibyte or mis-declared bodies could exceed 8 KB in bytes. Now a stream reader counts received bytes and cancels at the cap; tests: chunked without Content-Length, wrong Content-Length, multibyte (€×3000 = 9000 bytes), valid chunked body accepted. |
| URL schemes/hosts vs existing journey | Unchanged `validateMediaUrl` (HTTPS `media.base44.com`, or current-app `base44.app` file URL); same as Step 1 uploads. |
| Caller-controlled roles/prompts/provider config | Only `file_url` is read. Prompt, model (`claude_sonnet_4_6`) and schema are server constants. |
| Outputs: fields, types, bounds | **Defect found and fixed:** v1 returned the raw model result. Now reduced to schema-declared fields with type/enum/length bounds (strings ≤ 4000, arrays ≤ 20×100, number clamped 0..1, control chars stripped); missing required fields or non-object ⇒ 502. |
| Model output as untrusted text | Server keeps it as plain text; the report components contain no `dangerouslySetInnerHTML`; values land in form inputs. |
| Errors/logs | Constant strings only (`timeout`/`failure`); tested no secret/prompt/URL in response or logs. |
| Timers / late failures | Timer cleared in `finally`; losing provider promise observed with `.catch`. Note: `Promise.race` already subscribes to all inputs, so the late-settlement test is a regression guard, not a discriminating test. |
| UI | **Defect found and fixed in DevTools:** 3 same-tick clicks made 3 requests (React state guard is async); a ref guard makes it 1. AI results no longer overwrite fields edited **during** the scan (`identifyMerge`, 4 unit tests). Identify control now 44 px. |

## Limits: proposed implementation values, not standards
- **8 KB body:** the only client input is `{"file_url": "<≤2048 chars>"}` ≈ 2.1 KB, so 8 KB leaves ~4× headroom; boundary tested at/over 8192 bytes.
- **45 s timeout:** an **unmeasured** assumption for a vision call (no latency data collected); the BACKUP smoke test would give a single data point. Adjust only on evidence. It bounds this function's wait; it does **not** cancel the provider call or cap spend, and the client does not retry automatically.
- **64 KB output cap:** effectively unreachable after per-field caps (worst case ≈ 34 KB); kept as a backstop, not a limit that does work.
- No durable rate limit exists; none is claimed.

## Tests (tested at `5356b87`)
Server (Deno, offline; `fetch` blocked, console captured): 14 `scanAd` boundary tests, **full offline suite 86 passed, 0 failed**. UI logic: 4 `node:test` tests pass. prettier/eslint/typecheck exit 0. Negative controls: original handler vs the first 9 tests ⇒ 4 fail; #391-as-first-pushed vs the added tests ⇒ 4 fail (body bytes, output reduction, malformed output, sanitizer). DevTools (Windows Chrome, local Vite + local mock API, synthetic in-memory image, no Base44 traffic): signed-in at 1280 / 390 / 320 / 844×390 — Identify 44 px, no overflow, repeated activation = 1 request, edit made during the scan kept, failure ⇒ 1 request and **no automatic retry** (0 extra after 3 s), edit before failure kept; signed-out at 390 and 320 — announced sign-in note, 0 requests. Emulation is not physical-device validation. The inline "Sign in" link is 32 px tall (inline text link; flagged).

## BACKUP evidence (function only; frontend untouched)
Window 1 in `~/ooh-release-records/2026-10-29/BACKUP-RESERVATION.md` (peer acknowledged, serial order). Pre-state `scanAd` pulled from BACKUP = byte-identical to production and to the previous repo version (hashes in `scanad-backup-before-sha256.txt`). `functions deploy scanAd --app-id <BACKUP>` only: exit 0; pulled back: `entry.ts`/`handler.ts` byte-identical to the candidate; `function.jsonc` unchanged (name + entry only, no automations, no scheduler). Anonymous POST (with spoofed `role`/`user_id` in the body): **401 `Authentication required`**, no billable work. **Authenticated synthetic smoke test: NOT done** — no signed-in BACKUP session is available and no credentials were created or used. Request count for that test so far: 0.

## UnitFinder (#397)
Generation, geocoding of model-invented addresses and `Location.create` removed; dialog name, focus trap, Escape/focus-return kept; "Unavailable" notice plus 44 px link to the Report form. No data deleted. Revert the commit to restore. DevTools at 1280: no inputs, 0 AI requests, Tab stays inside, Escape closes and returns focus. New e2e spec is unrun locally (CI is its first run).

## Original endpoint exposure (decision 3)
Unchanged and **not closed**. Platform research found no documented control. A support question for the owner to send is drafted in `support-question.md` (not sent). The Security page was read read-only: 6 issues, scan "Out of date", "Fix all" disabled; expanding a finding row was denied by the auto-mode classifier and not retried. If Base44 offers a control, test it in BACKUP first; a wrapper, CORS rule or hidden button is not closure.

## Remaining blockers and owner actions before any production step
1. Authenticated BACKUP smoke test: needs a signed-in BACKUP session (owner) — one request, synthetic non-personal media, no Location creation.
2. Exact-head CI + CodeQL on #391 and #397 (drafts; mark ready is a separate, reviewed step) and a recorded code/security review of those heads.
3. BACKUP frontend preview of Step 2 + UnitFinder after the UI lane's window; backend verified compatible first.
4. Owner: send/answer the support question; decide on accepting or closing the remaining endpoint exposure.
5. Production only after the above, as **separate recorded steps**: `scanAd` function (rollback = `scanad-backup-before/`), then the frontend. No production setting, schema push or function deploy has been made.
