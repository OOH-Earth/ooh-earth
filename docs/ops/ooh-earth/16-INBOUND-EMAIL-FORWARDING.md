# Inbound research email forwarding — design, security review, activation handoff

Status: **HOLD / NOT ACTIVE.** Local source + offline tests only. Nothing deployed, no secret set, no webhook created, no email sent.
Date: 2026-10-22. Branch `feat/inbound-email-forward` (base: maintenance/production-2026-10-02 @ 6ce2010).

## Production baseline (read-only, 2026-10-22) and reconciliation plan
Evidence (all read-only CLI calls against the real apps):
- `functions list`: production `6a62213cff3ccbca88c04ff5` has 39 deployed functions and **no `forwardReceivedEmail`**; BACKUP `6a6748e009b947cb29591871` has 38, also none.
- Git: no function source or history anywhere (all refs and sibling worktrees).
- `secrets list` (names only): production `OOH_EARTH_ENVIRONMENT, BASE44_RELEASE_ID, INVESTOR_TOKEN_SECRET, INVESTOR_ACCESS_CODE`; BACKUP `OOH_EARTH_ENVIRONMENT, BASE44_RELEASE_ID, N8N_WEBHOOK_URL, STRIPE_PUBLISHABLE_KEY`. **No `RESEND_*` secret on either.**
- Entity: `ForwardedEmail.list()` on production **succeeds with 0 rows — the entity already exists in production** with an unknown schema (not in git, not in `base44/entities/`). On BACKUP: "Entity schema ForwardedEmail not found".
- Not checked: whether a Resend webhook already exists (needs the Resend account), and the exact production entity schema/RLS (no read-only CLI for it).

Conclusion: no runtime function exists, but a schema was created out-of-band in production. Reconciliation plan before anything is pushed:
1. Owner views the production `ForwardedEmail` schema and RLS in the Base44 dashboard and pastes it into this doc.
2. If its fields differ from `proposed/ForwardedEmail.jsonc`, either adapt the proposed schema/handler to the existing fields (preferred, avoids a schema change) or approve an explicit change. A blind `entities push` could overwrite it.
3. Confirm RLS is admin-only for all four operations; fix if not (public read of this ledger would leak ids/timestamps).
4. Only then add the reconciled `.jsonc` to `base44/entities/`, update the approved manifests, and run the BACKUP qualification.
PR base for this branch: it is backend-only and must not ride the frontend release. Recommended base **`main`** (normal development line) after David's explicit instruction, with a separate BACKUP-first functions-only deploy; opening it against the production maintenance branch is not recommended. No PR is opened yet.

## What was built (files)
- `base44/functions/forwardReceivedEmail/handler.ts`, `entry.ts` (SDK pin `npm:@base44/sdk@0.8.54`, as reported; stripeWebhook uses 0.8.40 — confirm the pin exists in the runtime before deploy).
- `base44/functions/tests/forwardReceivedEmail.test.ts` (16 tests; added to `npm run test:server-functions`).
- `docs/ops/ooh-earth/proposed/ForwardedEmail.jsonc` — proposed ledger schema, **deliberately outside `base44/entities/`** because a new entity is a schema change that fails `scripts/base44-entity-preflight` until the approved manifests are updated (separate gate). Without the entity the function fails closed (503 "Forwarding unavailable").

## Evidence for the provider contract (fetched 2026-10-22)
- Resend verifies with Svix headers `svix-id`, `svix-timestamp`, `svix-signature`; verify the **raw** body (resend.com/docs/webhooks/verify-webhooks-requests). Algorithm per Svix manual verification: HMAC-SHA256 over `id.timestamp.body`, key = base64-decoded secret after `whsec_`, space-separated `v1,<b64>` entries (docs.svix.com). The code is checked against Svix's published test vector (passes).
- `email.received` webhook has **metadata only** (no body/headers/attachments); fields include `email_id`, `received_for`, `from`, `to`, `message_id`, `subject`, `created_at`. Body comes from `GET https://api.resend.com/emails/receiving/{id}`.
- `Idempotency-Key` on `POST /emails`: header, **24 h retention**, ≤256 chars; same payload → same response without resending; different payload → 409; in-flight → 409 `concurrent_idempotent_requests`.
- Base44 function URL per platform docs: `https://<app-domain>/functions/<name>`. **The suggested `/api/functions/forwardReceivedEmail` is not what the docs show — UNVERIFIED, do not use it.** Direct HTTP calls have no user context (`asServiceRole`). Docs do not describe a public-access setting; the existing `stripeWebhook` receives unauthenticated provider POSTs in production, which is the only in-repo evidence that this works. Whether the platform adds its own auth in front of a new function must be confirmed with an unsigned probe (expect our own 401, not a platform 401/403).

## Security review (checked by tests unless noted)
| Control | Result |
|---|---|
| Signature over raw body; 5-min timestamp tolerance both directions; constant-time compare; wrong/missing secret fails | tested |
| Fail closed if secret or API key missing (503), bad signature 401 before any provider call or ledger write | tested |
| Exact envelope recipient filter (`received_for` includes `research@reply.oohearth.app`; header `to` is not trusted) | tested |
| Fixed destination `david@ooh.earth` and sender `OOH Earth Research <research@oohearth.app>` constants; no env/user override | tested |
| `reply_to` only if sender parses as ONE clean address (no CR/LF, commas, angle junk) | tested |
| Subject/sender/message-id stripped of control characters (no header or fake-line injection) | tested |
| Text-only; HTML reduced to text; no links fetched; attachments never forwarded (count only, names not echoed) | tested |
| Untrusted-content banner; no agent/tool/LLM involvement anywhere in the path | by construction |
| Loop prevention: own sender, `@reply.oohearth.app` senders, `X-OOH-Forwarded`, `Auto-Submitted`≠no, `Precedence` bulk/list/junk | tested |
| Payload bound 64 KB; body 20k chars; subject 200 | tested |
| No historical replay: events older than 72 h ignored | tested |
| Logs contain only email id + error code, never addresses/subject/body | review |
| Sender eligibility: fail closed. `FORWARD_ALLOWED_SENDERS` (exact addresses or `@domain`) must be set; unset/empty/unlisted senders are acknowledged and dropped with no ledger row and no provider call | tested (3 tests) |
| Daily cap: 50 forwards per rolling 24 h, then 503 (provider retries later) | tested |

## Delivery correctness — honest limits
States recorded: received/attempting → accepted | failed_retryable | failed_permanent. **"accepted" = Resend accepted the send, not delivered.** A `delivered` state needs a second subscription (`email.delivered`/`email.bounced` on the sent mail) and is **not built**; until then confirm delivery by `GET /emails/{provider_send_id}` (`last_event`) or in David's inbox.
- Duplicate webhooks/retries: ledger row per `email_id`; `accepted` rows short-circuit.
- Send succeeds but ledger update fails: retry re-sends with the **same** `Idempotency-Key` (`fwd-<email_id>`) → no duplicate **within 24 h**. After 24 h a duplicate is possible (residual risk; Resend webhook retry horizon not verified here).
- Crash mid-attempt: row stays `attempting`; after a 10-minute lease the next retry takes over (same key).
- Concurrent deliveries: Base44 offers **no unique constraint or atomic claim** (not verified otherwise). Mitigation is create-then-oldest-wins plus the provider idempotency key. This is best-effort, **not exactly-once**.
- Ledger stores ids/timestamps/status only — no addresses, subject or body.

## Activation handoff (separate approval required for each gate)
1. **Review/merge** the branch (target branch decision below). Confirm no existing stored `forwardReceivedEmail` in Base44.
2. **Schema gate:** add `ForwardedEmail` to `base44/entities/` and the approved entity manifests; BACKUP first. Admin-only RLS as in the proposed file.
3. **Auth path:** deploy functions only (`base44 functions deploy`-style existing path, not a frontend deploy) to BACKUP app `6a6748e009b947cb29591871` first; production app `6a62213cff3ccbca88c04ff5` after BACKUP test.
4. **Secrets (owner enters them; never in chat/source/logs):** `RESEND_API_KEY` (send + receiving-read scope), then `RESEND_WEBHOOK_SECRET`. Use the Base44 secrets mechanism from the platform docs (`secrets set`), entered by the key owner.
5. **Endpoint probe:** `POST` unsigned body to `https://<app-domain>/functions/forwardReceivedEmail`; expected: HTTP 401 `{"error":"Invalid signature"}` (503 "not configured" before secrets). Anything else means platform auth is in front — stop.
6. **Webhook:** list existing Resend webhooks first; reuse a correct `email.received` one or create exactly one pointing at the verified URL; no other event types.
7. **One synthetic test** from an owner-controlled external address to `research@reply.oohearth.app`, harmless text, no attachment. Expect: one ledger row `accepted`, one email at david@ooh.earth with banner + reply-to, Resend send id shows `delivered`. Resend the same webhook from the dashboard → ledger `duplicate`, no second email.
8. **Disable/rollback:** delete or disable the Resend webhook (stops all traffic); remove the function; rotate `RESEND_WEBHOOK_SECRET` and `RESEND_API_KEY`; ledger rows may stay (admin-only).

## Sender policy choices for David (the allowlist is only the pilot default)
| Option | Behaviour | Risk |
|---|---|---|
| A. Allowlist pilot (built) | Only listed addresses/domains forward; everything else is dropped silently | New legitimate correspondents are **not** forwarded; the sender sees no error — acceptable only for the internal pilot |
| B. Open with controls | Forward anyone, with daily cap, untrusted banner, and a DMARC/auth check (needs the provider's authentication result, unverified) | Spam/abuse reaches David; cost bounded only by the cap |
| C. Allowlist + review digest | A, plus a daily count of dropped senders (no content stored) so David can add legitimate ones | Needs a small counter row/schema addition |
The allowlist matches the *claimed* From address; it is not proof of identity.

## Retention, privilege and logging
- Ledger holds ids, timestamps, status, provider send id, error code only; delete rows older than 90 days (manual or scheduled; the scheduler is not built).
- Entity RLS admin-only (create/read/update/delete); the function uses `asServiceRole`. The Resend API key should be the narrowest key that can send and read received mail (key scoping options unverified).
- Logs: email id + error code only.
- Disable fast: delete the Resend webhook, or empty `FORWARD_ALLOWED_SENDERS` (fails closed immediately).

## Integration approval package (nothing below is done)
1. Reconciled schema (step 3 above) — schema gate.
2. Functions-only BACKUP deploy of `forwardReceivedEmail` — deploy gate.
3. Secrets, entered by the key owner: `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `FORWARD_ALLOWED_SENDERS` (pilot list) — secret gate.
4. List existing Resend webhooks; reuse or create exactly one `email.received` webhook at the verified URL — webhook gate.
5. One synthetic test from a listed address; verify ledger, single delivery, duplicate replay → no second email, then the 24-hour idempotency limit stated — test gate.
6. Production repeat of 2–5 only after BACKUP passes.

Concrete approval needed: **(a)** target branch for the PR, **(b)** schema change, **(c)** sender-eligibility policy, **(d)** David/key owner to provision the two secrets and run the single synthetic test.

Note: BCC on outgoing mail does not forward incoming replies; this route is the only mechanism proposed.
