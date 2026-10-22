import {
  buildForward,
  handleForwardReceivedEmail,
  htmlToText,
  singleAddress,
  verifyWebhookSignature,
} from '../forwardReceivedEmail/handler.ts';

const assert = (c: unknown, m: string) => {
  if (!c) throw new Error(m);
};
const eq = (a: unknown, b: unknown, m: string) => {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
};

const SECRET = 'whsec_' + btoa('unit-test-secret-bytes-0123456789');
const NOW = Date.parse('2026-10-22T12:00:00Z');

async function sign(id: string, ts: string, body: string, secret = SECRET) {
  const key = await crypto.subtle.importKey(
    'raw',
    Uint8Array.from(atob(secret.slice(6)), (c) => c.charCodeAt(0)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${body}`)),
  );
  return 'v1,' + btoa(String.fromCharCode(...mac));
}

const eventBody = (over: Record<string, unknown> = {}, type = 'email.received') =>
  JSON.stringify({
    type,
    created_at: '2026-10-22T11:59:00Z',
    data: {
      email_id: '56761188-7520-42d8-8898-ff6fc54ce618',
      created_at: '2026-10-22T11:59:00Z',
      from: 'Alice <alice@example.org>',
      to: ['research@reply.oohearth.app'],
      received_for: ['research@reply.oohearth.app'],
      message_id: '<abc@example.org>',
      subject: 'Hello',
      attachments: [],
      ...over,
    },
  });

async function signedRequest(body: string, over: { sig?: string; ts?: string } = {}) {
  const id = 'msg_test1';
  const ts = over.ts ?? String(Math.floor(NOW / 1000));
  return new Request('https://example.test/functions/forwardReceivedEmail', {
    method: 'POST',
    headers: {
      'svix-id': id,
      'svix-timestamp': ts,
      'svix-signature': over.sig ?? (await sign(id, ts, body)),
    },
    body,
  });
}

function harness(opts: { receiving?: any; sendStatus?: number; seed?: any[]; env?: any } = {}) {
  const rows: any[] = [...(opts.seed || [])];
  let n = 0;
  const calls: { url: string; init: any }[] = [];
  const ledger = {
    filter: async (q: any) => rows.filter((r) => r.provider_email_id === q.provider_email_id),
    create: async (r: any) => {
      const row = { id: `r${++n}`, created_date: n, ...r };
      rows.push(row);
      return row;
    },
    update: async (id: string, patch: any) =>
      Object.assign(
        rows.find((r) => r.id === id),
        patch,
      ),
    delete: async (id: string) =>
      rows.splice(
        rows.findIndex((r) => r.id === id),
        1,
      ),
  };
  const fetchImpl = (async (url: string, init: any) => {
    calls.push({ url, init });
    if (url.includes('/emails/receiving/'))
      return Response.json(
        opts.receiving ?? {
          from: 'Alice <alice@example.org>',
          subject: 'Hello',
          text: 'Body',
          headers: {},
          attachments: [],
        },
      );
    return Response.json({ id: 'send_1' }, { status: opts.sendStatus ?? 200 });
  }) as unknown as typeof fetch;
  const env: Record<string, string> = {
    RESEND_WEBHOOK_SECRET: SECRET,
    RESEND_API_KEY: 're_test',
    ...opts.env,
  };
  return {
    rows,
    calls,
    deps: {
      createClientFromRequest: () => ({ asServiceRole: { entities: { ForwardedEmail: ledger } } }),
      getEnv: (k: string) => env[k],
      fetchImpl,
      now: () => NOW,
    },
  };
}

Deno.test('svix documented test vector verifies', async () => {
  const ok = await verifyWebhookSignature(
    '{"event_type":"ping","data":{"success":true}}',
    {
      id: 'msg_loFOjxBNrRLzqYUf',
      timestamp: '1731705121',
      signature: 'v1,rAvfW3dJ/X/qxhsaXPOyyCGmRKsaKWcsNccKXlIktD0=',
    },
    'whsec_plJ3nmyCDGBKInavdOK15jsl',
    1731705121000,
  );
  assert(ok, 'documented vector must verify');
});

Deno.test(
  'signature: tampered body, stale/future timestamp, wrong secret, missing secret rejected',
  async () => {
    const body = eventBody();
    const sig = await sign('m', '1000', body);
    const h = { id: 'm', timestamp: '1000', signature: sig };
    assert(await verifyWebhookSignature(body, h, SECRET, 1000_000), 'baseline valid');
    assert(!(await verifyWebhookSignature(body + ' ', h, SECRET, 1000_000)), 'tampered body');
    assert(!(await verifyWebhookSignature(body, h, SECRET, 1000_000 + 301_000)), 'stale');
    assert(!(await verifyWebhookSignature(body, h, SECRET, 1000_000 - 301_000)), 'future');
    assert(
      !(await verifyWebhookSignature(body, h, 'whsec_' + btoa('other'), 1000_000)),
      'wrong secret',
    );
    assert(!(await verifyWebhookSignature(body, h, '', 1000_000)), 'no secret');
    assert(
      !(await verifyWebhookSignature(body, { ...h, signature: '' }, SECRET, 1000_000)),
      'no sig',
    );
  },
);

Deno.test('rejects bad signature, wrong method, missing config; sends nothing', async () => {
  const body = eventBody();
  let h = harness();
  const bad = await handleForwardReceivedEmail(
    await signedRequest(body, { sig: 'v1,AAAA' }),
    h.deps,
  );
  eq(bad.status, 401, 'bad sig');
  eq(h.calls.length, 0, 'no provider calls on bad sig');
  const get = await handleForwardReceivedEmail(
    new Request('https://x.test', { method: 'GET' }),
    h.deps,
  );
  eq(get.status, 405, 'method');
  h = harness({ env: { RESEND_API_KEY: '' } });
  eq(
    (await handleForwardReceivedEmail(await signedRequest(body), h.deps)).status,
    503,
    'fail closed',
  );
});

Deno.test('ignores other event types, other recipients, stale events, own sender', async () => {
  for (const [body, label] of [
    [eventBody({}, 'email.delivered'), 'type'],
    [
      eventBody({
        received_for: ['someone@reply.oohearth.app'],
        to: ['research@reply.oohearth.app'],
      }),
      'recipient',
    ],
    [eventBody({ created_at: '2026-10-01T00:00:00Z' }), 'stale'],
    [eventBody({ from: 'research@oohearth.app' }), 'own sender'],
  ] as const) {
    const h = harness();
    const res = await handleForwardReceivedEmail(await signedRequest(body), h.deps);
    eq(res.status, 200, `${label} acked`);
    eq(h.calls.length, 0, `${label}: no provider calls`);
    eq(h.rows.length, 0, `${label}: no ledger row`);
  }
});

Deno.test(
  'happy path: fixed destination/sender, text only, idempotency key, accepted != delivered',
  async () => {
    const h = harness();
    const res = await handleForwardReceivedEmail(await signedRequest(eventBody()), h.deps);
    eq(res.status, 200, 'ok');
    const send = h.calls.find((c) => c.url === 'https://api.resend.com/emails')!;
    const payload = JSON.parse(send.init.body);
    eq(payload.to, ['david@ooh.earth'], 'fixed destination');
    eq(payload.from, 'OOH Earth Research <research@oohearth.app>', 'fixed sender');
    assert(!('html' in payload) && !('attachments' in payload), 'text only');
    eq(payload.reply_to, 'alice@example.org', 'reply_to is validated sender');
    eq(
      send.init.headers['Idempotency-Key'],
      'fwd-56761188-7520-42d8-8898-ff6fc54ce618',
      'idempotency key',
    );
    eq(payload.headers['X-OOH-Forwarded'], '1', 'loop marker');
    eq(h.rows[0].status, 'accepted', 'ledger accepted');
    assert(!('delivered_at' in h.rows[0]), 'no delivered claim');
    assert(!JSON.stringify(h.rows[0]).includes('Body'), 'ledger stores no content');
  },
);

Deno.test('duplicate webhook after accepted does not send again', async () => {
  const h = harness({
    seed: [
      { id: 'r0', provider_email_id: '56761188-7520-42d8-8898-ff6fc54ce618', status: 'accepted' },
    ],
  });
  const res = await handleForwardReceivedEmail(await signedRequest(eventBody()), h.deps);
  eq((await res.json()).status, 'duplicate', 'duplicate');
  eq(h.calls.length, 0, 'no calls');
});

Deno.test(
  'fresh attempting lease -> 503; stale lease retried with same idempotency key',
  async () => {
    const id = '56761188-7520-42d8-8898-ff6fc54ce618';
    let h = harness({
      seed: [
        { id: 'r0', provider_email_id: id, status: 'attempting', attempt_started_at: NOW - 60_000 },
      ],
    });
    eq(
      (await handleForwardReceivedEmail(await signedRequest(eventBody()), h.deps)).status,
      503,
      'in progress',
    );
    eq(h.calls.length, 0, 'no calls while leased');
    h = harness({
      seed: [
        {
          id: 'r0',
          provider_email_id: id,
          status: 'attempting',
          attempt_started_at: NOW - 3_600_000,
          attempt_count: 1,
        },
      ],
    });
    eq(
      (await handleForwardReceivedEmail(await signedRequest(eventBody()), h.deps)).status,
      200,
      'recovered',
    );
    eq(h.rows.length, 1, 'same row reused');
    eq(h.rows[0].attempt_count, 2, 'attempt counted');
    eq(
      h.calls.find((c) => c.url.endsWith('/emails'))!.init.headers['Idempotency-Key'],
      `fwd-${id}`,
      'same key',
    );
  },
);

Deno.test('provider 5xx/409 are retryable (503); 4xx permanent (200, recorded)', async () => {
  for (const [status, expect, row] of [
    [500, 503, 'failed_retryable'],
    [409, 503, 'failed_retryable'],
    [422, 200, 'failed_permanent'],
  ] as const) {
    const h = harness({ sendStatus: status });
    const res = await handleForwardReceivedEmail(await signedRequest(eventBody()), h.deps);
    eq(res.status, expect, `send ${status}`);
    eq(h.rows[0].status, row, `ledger ${status}`);
  }
});

Deno.test('loops and auto-generated mail are not forwarded', async () => {
  for (const receiving of [
    { from: 'bot@reply.oohearth.app', text: 'x', headers: {} },
    { from: 'a@example.org', text: 'x', headers: { 'X-OOH-Forwarded': '1' } },
    { from: 'a@example.org', text: 'x', headers: { 'Auto-Submitted': 'auto-replied' } },
    { from: 'a@example.org', text: 'x', headers: { Precedence: 'bulk' } },
  ]) {
    const h = harness({ receiving });
    const res = await handleForwardReceivedEmail(await signedRequest(eventBody()), h.deps);
    eq((await res.json()).status, 'ignored_loop', 'loop');
    assert(!h.calls.some((c) => c.url.endsWith('/emails')), 'nothing sent');
  }
});

Deno.test(
  'untrusted content cannot change recipient, inject headers, or smuggle HTML/attachments',
  () => {
    const out = buildForward(
      {
        from: 'Eve <eve@evil.test>\r\nBcc: attacker@evil.test',
        subject: 'Hi\r\nBcc: attacker@evil.test',
        html: '<script>alert(1)</script><p>Hello <a href="https://evil.test">click</a></p>',
        text: null,
        attachments: [{ filename: '../../x.exe' }],
      },
      { data: { message_id: '<a@b>' } },
    ) as any;
    eq(out.to, ['david@ooh.earth'], 'destination fixed');
    assert(!out.subject.includes('\n') && !out.subject.includes('\r'), 'subject single line');
    assert(!('reply_to' in out), 'invalid sender not used as reply_to');
    assert(!out.text.includes('<script') && !out.text.includes('<a '), 'html stripped');
    assert(!out.text.includes('x.exe'), 'attachment names not echoed');
    assert(out.text.includes('Attachments not forwarded: 1'), 'attachment count only');
    assert(out.text.startsWith('UNTRUSTED INBOUND MESSAGE'), 'untrusted banner');
    assert(!/^Bcc:/m.test(out.text), 'no injected header line');
    assert(!('html' in out) && !('attachments' in out), 'text only');
  },
);

Deno.test('body is bounded', () => {
  const out = buildForward({ from: 'a@b.co', text: 'x'.repeat(100000) }, { data: {} }) as any;
  assert(out.text.length < 21000, 'bounded');
});

Deno.test('helpers', () => {
  eq(singleAddress('A <a@b.co>'), 'a@b.co', 'angle');
  eq(singleAddress('a@b.co, c@d.co'), null, 'multiple rejected');
  eq(htmlToText('<p>a</p><br>b'), 'a\n\nb', 'html text');
});

Deno.test('oversized webhook rejected before verification work', async () => {
  const h = harness();
  const res = await handleForwardReceivedEmail(
    new Request('https://x.test', {
      method: 'POST',
      headers: { 'content-length': '999999' },
      body: 'x',
    }),
    h.deps,
  );
  eq(res.status, 413, 'too large');
});
