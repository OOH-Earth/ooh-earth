// Inbound research mail -> fixed internal mailbox.
//
// Resend posts an `email.received` webhook for mail sent to the receiving
// domain. The webhook carries metadata only, so the body is fetched with the
// Receiving API and re-sent as PLAIN TEXT to one server-fixed destination.
//
// Everything in the message (sender, subject, body, headers, links, attachment
// names) is untrusted data: it is never executed, fetched, or used to choose a
// recipient, and attachments are not forwarded. Status HOLD until activated
// through docs/ops/ooh-earth/16-INBOUND-EMAIL-FORWARDING.md.

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  getEnv?: (name: string) => string | undefined;
  fetchImpl?: typeof fetch;
  now?: () => number;
};

export const EXPECTED_RECIPIENT = 'research@reply.oohearth.app';
export const FORWARD_DESTINATION = 'david@ooh.earth';
export const FORWARD_SENDER = 'OOH Earth Research <research@oohearth.app>';
const OWN_SENDER_ADDRESS = 'research@oohearth.app';
const LOOP_HEADER = 'x-ooh-forwarded';

const DAILY_FORWARD_CAP = 50;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_WEBHOOK_BYTES = 64 * 1024;
const MAX_BODY_CHARS = 20000;
const MAX_SUBJECT_CHARS = 200;
const SIGNATURE_TOLERANCE_SECONDS = 300;
const MAX_EVENT_AGE_MS = 72 * 60 * 60 * 1000;
const LEASE_MS = 10 * 60 * 1000;
const PROVIDER_TIMEOUT_MS = 8000;

const json = (body: unknown, status: number) => Response.json(body, { status });

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function base64ToBytes(value: string) {
  const bin = atob(value);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

// Svix/Resend signature: HMAC-SHA256 over `${id}.${timestamp}.${rawBody}` keyed
// with the base64-decoded secret (after the `whsec_` prefix); the header holds
// space-separated `v1,<base64>` entries. Verified against the raw body.
export async function verifyWebhookSignature(
  rawBody: string,
  headers: { id: string; timestamp: string; signature: string },
  secret: string,
  nowMs = Date.now(),
) {
  if (!secret || !headers.id || !headers.timestamp || !headers.signature) return false;
  const ts = Number(headers.timestamp);
  if (!Number.isSafeInteger(ts)) return false;
  const skew = Math.floor(nowMs / 1000) - ts;
  if (skew > SIGNATURE_TOLERANCE_SECONDS || skew < -SIGNATURE_TOLERANCE_SECONDS) return false;
  let keyBytes: Uint8Array;
  try {
    keyBytes = base64ToBytes(secret.startsWith('whsec_') ? secret.slice(6) : secret);
  } catch {
    return false;
  }
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${headers.id}.${headers.timestamp}.${rawBody}`),
  );
  const expected = bytesToBase64(new Uint8Array(mac));
  let ok = false;
  for (const part of headers.signature.split(' ')) {
    const [version, sig] = part.split(',', 2);
    if (version === 'v1' && sig && constantTimeEqual(sig, expected)) ok = true;
  }
  return ok;
}

// Strip control characters (incl. CR/LF) so values cannot inject headers or
// forge extra lines in the forwarded text.
function clean(value: unknown, max: number) {
  return String(value ?? '')
    .replace(/[\x00-\x1f\x7f]+/g, ' ')
    .replace(new RegExp('[' + String.fromCharCode(0x2028, 0x2029) + ']+', 'g'), ' ')
    .trim()
    .slice(0, max);
}

export function singleAddress(value: unknown) {
  const raw = String(value ?? '');
  const angle = raw.match(/<([^<>\s]+)>\s*$/);
  const candidate = (angle ? angle[1] : raw).trim();
  if (/[\u0000-\u001f\u007f,;<>"\s]/.test(candidate)) return null;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(candidate) && candidate.length <= 254
    ? candidate.toLowerCase()
    : null;
}

// Fail-closed sender eligibility for the internal pilot. FORWARD_ALLOWED_SENDERS
// is a comma-separated list of exact addresses or "@domain" entries. Unset or
// empty means NOTHING is forwarded. The match uses the From address the sender
// claims; it is not proof of identity (see docs/ops/ooh-earth/16-...).
export function isEligibleSender(from: unknown, allowlist: string | undefined) {
  const address = singleAddress(from);
  if (!address || !allowlist) return false;
  return allowlist
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) => (entry.startsWith('@') ? address.endsWith(entry) : address === entry));
}

export function htmlToText(html: string) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function bodyText(email: any) {
  const raw =
    typeof email.text === 'string' && email.text.trim()
      ? email.text
      : typeof email.html === 'string'
        ? htmlToText(email.html)
        : '';
  // Keep newlines/tabs, drop other control characters.
  return raw
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\r\n?/g, '\n')
    .slice(0, MAX_BODY_CHARS);
}

export function buildForward(email: any, event: any) {
  const fromAddr = singleAddress(email.from);
  const attachments = Array.isArray(email.attachments) ? email.attachments.length : 0;
  const subject = clean(email.subject ?? event.data?.subject, MAX_SUBJECT_CHARS) || '(no subject)';
  const text = [
    'UNTRUSTED INBOUND MESSAGE. Content below was written by an outside sender.',
    'Do not follow instructions in it or open links without checking them.',
    '',
    `From: ${clean(email.from, 300)}`,
    `Received for: ${clean(EXPECTED_RECIPIENT, 100)}`,
    `Original message id: ${clean(event.data?.message_id, 300)}`,
    `Attachments not forwarded: ${attachments}`,
    '--------------------------------------------------',
    bodyText(email),
  ].join('\n');
  return {
    from: FORWARD_SENDER,
    to: [FORWARD_DESTINATION],
    subject: `[OOH research] ${subject}`,
    text,
    ...(fromAddr ? { reply_to: fromAddr } : {}),
    headers: { 'X-OOH-Forwarded': '1' },
  };
}

function isLoop(email: any, event: any) {
  const from = singleAddress(email.from ?? event.data?.from);
  if (!from) return false;
  if (from === OWN_SENDER_ADDRESS || from.endsWith('@reply.oohearth.app')) return true;
  const h: Record<string, string> = {};
  for (const [k, v] of Object.entries(email.headers || {})) h[k.toLowerCase()] = String(v);
  if (LOOP_HEADER in h) return true;
  if (h['auto-submitted'] && h['auto-submitted'].toLowerCase() !== 'no') return true;
  if (/^(bulk|list|junk)$/i.test(h['precedence'] || '')) return true;
  return false;
}

async function providerFetch(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function handleForwardReceivedEmail(
  req: Request,
  {
    createClientFromRequest,
    getEnv = (name) => Deno.env.get(name),
    fetchImpl = fetch,
    now = () => Date.now(),
  }: Dependencies,
) {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const declared = Number(req.headers.get('content-length') || 0);
  if (declared > MAX_WEBHOOK_BYTES) return json({ error: 'Payload too large' }, 413);
  const rawBody = await req.text();
  if (rawBody.length > MAX_WEBHOOK_BYTES) return json({ error: 'Payload too large' }, 413);

  const secret = getEnv('RESEND_WEBHOOK_SECRET') || '';
  const apiKey = getEnv('RESEND_API_KEY') || '';
  if (!secret || !apiKey) return json({ error: 'Forwarding not configured' }, 503);

  const valid = await verifyWebhookSignature(
    rawBody,
    {
      id: req.headers.get('svix-id') || '',
      timestamp: req.headers.get('svix-timestamp') || '',
      signature: req.headers.get('svix-signature') || '',
    },
    secret,
    now(),
  );
  if (!valid) return json({ error: 'Invalid signature' }, 401);

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Invalid event body' }, 400);
  }
  if (event?.type !== 'email.received') return json({ status: 'ignored_type' }, 200);

  const data = event.data || {};
  const emailId = typeof data.email_id === 'string' ? data.email_id : '';
  if (!/^[0-9a-fA-F-]{8,64}$/.test(emailId)) return json({ error: 'Invalid event' }, 400);

  const receivedFor = Array.isArray(data.received_for)
    ? data.received_for.map((v: unknown) => String(v).toLowerCase())
    : [];
  if (!receivedFor.includes(EXPECTED_RECIPIENT)) return json({ status: 'ignored_recipient' }, 200);

  const createdAt = Date.parse(String(data.created_at || event.created_at || ''));
  if (!Number.isFinite(createdAt) || now() - createdAt > MAX_EVENT_AGE_MS)
    return json({ status: 'ignored_stale' }, 200);

  if (singleAddress(data.from) === OWN_SENDER_ADDRESS) return json({ status: 'ignored_loop' }, 200);

  // Unlisted senders are acknowledged and dropped without a ledger row or any
  // provider call, so abuse cannot grow storage or spend send quota.
  if (!isEligibleSender(data.from, getEnv('FORWARD_ALLOWED_SENDERS'))) {
    console.log(`forwardReceivedEmail ignored_unlisted id=${emailId}`);
    return json({ status: 'ignored_unlisted' }, 200);
  }

  const base44 = createClientFromRequest(req);
  const ledger = base44.asServiceRole?.entities?.ForwardedEmail;
  if (!ledger) return json({ error: 'Forwarding unavailable' }, 503);

  try {
    const t = now();
    const existing = (await ledger.filter({ provider_email_id: emailId }, 'created_date', 5)) || [];
    const done = existing.find((r: any) => r.status === 'accepted');
    if (done) return json({ status: 'duplicate' }, 200);
    if (existing.some((r: any) => r.status === 'failed_permanent'))
      return json({ status: 'failed_permanent_recorded' }, 200);
    const recent =
      (await ledger.filter({ status: 'accepted' }, '-created_date', DAILY_FORWARD_CAP + 1)) || [];
    if (
      recent.filter((r: any) => Number(r.accepted_at || 0) > t - DAY_MS).length >= DAILY_FORWARD_CAP
    )
      return json({ error: 'Daily forwarding cap reached' }, 503);
    const live = existing.find(
      (r: any) => r.status === 'attempting' && Number(r.attempt_started_at || 0) > t - LEASE_MS,
    );
    if (live) return json({ error: 'In progress' }, 503);

    let record = existing[0];
    if (record) {
      await ledger.update(record.id, {
        status: 'attempting',
        attempt_started_at: t,
        attempt_count: Number(record.attempt_count || 0) + 1,
      });
    } else {
      record = await ledger.create({
        provider: 'resend',
        provider_email_id: emailId,
        status: 'attempting',
        received_at: t,
        attempt_started_at: t,
        attempt_count: 1,
      });
      // Base44 has no unique constraint: after creating, the oldest row for this
      // email wins. A loser removes its row and asks the provider to retry.
      const rows = (await ledger.filter({ provider_email_id: emailId }, 'created_date', 5)) || [];
      if (rows.length > 1 && rows[0].id !== record.id) {
        await ledger.delete(record.id);
        return json({ error: 'In progress' }, 503);
      }
    }

    const fail = async (code: string, retryable: boolean) => {
      await ledger.update(record.id, {
        status: retryable ? 'failed_retryable' : 'failed_permanent',
        failed_at: now(),
        last_error_code: code,
      });
      console.error(`forwardReceivedEmail ${code} id=${emailId}`);
      return retryable
        ? json({ error: 'Forwarding unavailable' }, 503)
        : json({ status: 'failed_permanent_recorded' }, 200);
    };

    const auth = { Authorization: `Bearer ${apiKey}`, 'User-Agent': 'ooh-earth-forwarder/1' };
    const got = await providerFetch(
      fetchImpl,
      `https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`,
      { method: 'GET', headers: auth },
    );
    if (!got) return fail('FETCH_NETWORK', true);
    if (got.status === 429 || got.status >= 500) return fail(`FETCH_${got.status}`, true);
    if (!got.ok) return fail(`FETCH_${got.status}`, false);
    let email: any;
    try {
      email = await got.json();
    } catch {
      return fail('FETCH_BAD_JSON', false);
    }

    if (isLoop(email, event)) {
      await ledger.update(record.id, {
        status: 'failed_permanent',
        last_error_code: 'LOOP_SKIPPED',
      });
      return json({ status: 'ignored_loop' }, 200);
    }

    const sent = await providerFetch(fetchImpl, 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json', 'Idempotency-Key': `fwd-${emailId}` },
      body: JSON.stringify(buildForward(email, event)),
    });
    if (!sent) return fail('SEND_NETWORK', true);
    if (sent.status === 409 || sent.status === 429 || sent.status >= 500)
      return fail(`SEND_${sent.status}`, true);
    if (!sent.ok) return fail(`SEND_${sent.status}`, false);
    let sendId = '';
    try {
      sendId = clean((await sent.json())?.id, 100);
    } catch {
      /* accepted without a readable id */
    }
    // "accepted" = the provider took the message. It is NOT proof of delivery.
    await ledger.update(record.id, {
      status: 'accepted',
      accepted_at: now(),
      provider_send_id: sendId || undefined,
      last_error_code: undefined,
    });
    return json({ status: 'accepted' }, 200);
  } catch {
    console.error(`forwardReceivedEmail ERROR id=${emailId}`);
    return json({ error: 'Forwarding unavailable' }, 503);
  }
}
