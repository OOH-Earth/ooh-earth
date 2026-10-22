# Inbound research email forwarding — design, security review, activation handoff

Status: **HOLD / NOT ACTIVE.** Local source + offline tests only. Nothing deployed, no secret set, no webhook created, no email sent.
Date: 2026-10-22. Branch `feat/inbound-email-forward` (base: maintenance/production-2026-10-02 @ 6ce2010).

## Baseline finding
The brief described `base44/functions/forwardReceivedEmail/entry.ts` and a `ForwardedEmail` entity as existing. **Neither exists** in any local worktree, branch or git history (searched all refs and sibling worktrees). If a version exists inside Base44's stored code, it was not in GitHub and is unreviewed; this implementation is new and should replace it. Verify with `base44 functions` listing before deploying so a stored version is not silently overwritten or duplicated.

## What was built (files)
- `base44/functions/forwardReceivedEmail/handler.ts`, `entry.ts` (SDK pin `npm:@base44/sdk@0.8.54`, as reported; stripeWebhook uses 0.8.40 — confirm the pin exists in the runtime before deploy).
- `base44/functions/tests/forwardReceivedEmail.test.ts` (13 tests; added to `npm run test:server-functions`).
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
| Eligible-sender / spam policy | **NOT IMPLEMENTED — decision needed.** Today any sender who can reach the mailbox is forwarded (rate = Resend's inbound limits + 10 req/s send limit). Options: allowlist, subject/DMARC gate, daily cap with a counter row. |

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

Concrete approval needed: **(a)** target branch for the PR, **(b)** schema change, **(c)** sender-eligibility policy, **(d)** David/key owner to provision the two secrets and run the single synthetic test.

Note: BCC on outgoing mail does not forward incoming replies; this route is the only mechanism proposed.
