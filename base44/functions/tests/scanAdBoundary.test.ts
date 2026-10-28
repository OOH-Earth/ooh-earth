import { assert, assertEquals } from 'jsr:@std/assert@1';
import { handleScanAd } from '../scanAd/handler.ts';

// Offline matrix for the server boundary of the AI image-analysis journey: identity is checked
// before any billable integration call, inputs are bounded, and rejected requests make ZERO calls.
// Authentication and the integration are stubbed; fetch is blocked; console output is captured.

const APP_ID = '6a6748e009b947cb29591871';
const getEnv = (name: string) => (name === 'BASE44_APP_ID' ? APP_ID : undefined);
const GOOD_URL = 'https://media.base44.com/images/test.jpg';
const SECRET = 'sk-test-SECRET-prompt-internals';

type Harness = { calls: number; logs: string[]; fetches: number };

function setup() {
  const h: Harness = { calls: 0, logs: [], fetches: 0 };
  const realFetch = globalThis.fetch;
  const realError = console.error;
  globalThis.fetch = (() => {
    h.fetches++;
    throw new Error('network blocked in offline test');
  }) as typeof fetch;
  console.error = (...args: unknown[]) => h.logs.push(args.map(String).join(' '));
  const restore = () => {
    globalThis.fetch = realFetch;
    console.error = realError;
  };
  return { h, restore };
}

const stubClient = (
  h: Harness,
  me: () => Promise<unknown>,
  invoke: () => Promise<unknown> = async () => ({ is_advertising: true, brand_name: 'X' }),
) => ({
  auth: { me },
  asServiceRole: {
    integrations: {
      Core: {
        InvokeLLM: () => {
          h.calls++;
          return invoke();
        },
      },
    },
  },
});

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://fn.local/scanAd', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

async function run(
  req: Request,
  me: () => Promise<unknown>,
  invoke?: () => Promise<unknown>,
  extra: { timeoutMs?: number } = {},
) {
  const { h, restore } = setup();
  try {
    const res = await handleScanAd(
      req,
      { createClientFromRequest: () => stubClient(h, me, invoke), getEnv, ...extra },
      { type: 'object' },
      'server-owned prompt',
    );
    const text = await res.text();
    return { status: res.status, text, h };
  } finally {
    restore();
  }
}

const signedIn = async () => ({ id: 'u1', role: 'user' });

Deno.test(
  'rejects anonymous, invalid/expired identity and auth-service failure with zero AI calls',
  async () => {
    const cases: Array<[string, () => Promise<unknown>]> = [
      ['null identity', async () => null],
      ['empty object', async () => ({})],
      ['no id', async () => ({ role: 'admin' })],
      [
        'expired token (auth throws 401)',
        async () => Promise.reject(new Error('401 token expired')),
      ],
      ['auth service down', async () => Promise.reject(new Error('ECONNRESET ' + SECRET))],
    ];
    for (const [label, me] of cases) {
      const r = await run(post({ file_url: GOOD_URL }), me);
      assertEquals(r.status, 401, label);
      assertEquals(r.h.calls, 0, `${label}: integration calls`);
      assertEquals(r.h.fetches, 0, `${label}: network calls`);
      assert(!r.text.includes(SECRET), `${label}: no internals in response`);
    }
  },
);

Deno.test('spoofed identity/role fields in the body or headers never grant access', async () => {
  const spoof = {
    file_url: GOOD_URL,
    user_id: 'admin',
    id: 'admin',
    role: 'admin',
    authenticated: true,
    is_authenticated: true,
    user: { id: 'u1', role: 'admin' },
  };
  const r = await run(post(spoof, { 'x-user-id': 'u1', 'x-role': 'admin' }), async () => null);
  assertEquals(r.status, 401);
  assertEquals(r.h.calls, 0);
});

Deno.test('allowed identity with a valid input makes exactly one integration call', async () => {
  const r = await run(post({ file_url: GOOD_URL }), signedIn);
  assertEquals(r.status, 200);
  assertEquals(r.h.calls, 1);
  assertEquals(r.h.fetches, 0);
  assertEquals(JSON.parse(r.text).detection.brand_name, 'X');
});

Deno.test(
  'malformed, missing, oversized and unsupported inputs are rejected with zero AI calls',
  async () => {
    const big = 'https://media.base44.com/' + 'x'.repeat(2048);
    const bad: Array<[string, Request, number]> = [
      ['not JSON', post('{not json'), 400],
      ['empty body', post(''), 400],
      ['array body', post([GOOD_URL]), 400],
      ['null body', post('null'), 400],
      ['missing file_url', post({}), 400],
      ['non-string file_url', post({ file_url: 42 }), 400],
      ['object file_url', post({ file_url: { href: GOOD_URL } }), 400],
      ['oversized URL', post({ file_url: big }), 400],
      ['http scheme', post({ file_url: 'http://media.base44.com/x.jpg' }), 400],
      ['foreign host', post({ file_url: 'https://attacker.example/x.jpg' }), 400],
      ['credentials in URL', post({ file_url: 'https://u:p@media.base44.com/x.jpg' }), 400],
      ['javascript scheme', post({ file_url: 'javascript:alert(1)' }), 400],
      ['data URL', post({ file_url: 'data:image/png;base64,AAAA' }), 400],
      ['oversized body', post({ file_url: GOOD_URL, pad: 'y'.repeat(9000) }), 413],
      [
        'declared oversized body',
        post({ file_url: GOOD_URL }, { 'content-length': '999999' }),
        413,
      ],
    ];
    for (const [label, req, status] of bad) {
      const r = await run(req, signedIn);
      assertEquals(r.status, status, label);
      assertEquals(r.h.calls, 0, `${label}: integration calls`);
      assertEquals(r.h.fetches, 0, `${label}: network calls`);
    }
  },
);

Deno.test('wrong HTTP methods are rejected before identity or AI work', async () => {
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const { h, restore } = setup();
    try {
      const res = await handleScanAd(
        new Request('https://fn.local/scanAd', { method }),
        { createClientFromRequest: () => stubClient(h, signedIn), getEnv },
        {},
        'p',
      );
      assertEquals(res.status, 405);
      assertEquals(h.calls, 0);
    } finally {
      restore();
    }
  }
});

Deno.test(
  'provider rejection returns a stable safe error and logs no provider internals',
  async () => {
    const r = await run(post({ file_url: GOOD_URL }), signedIn, async () => {
      throw new Error(`provider said: ${SECRET} prompt=server-owned prompt ${GOOD_URL}`);
    });
    assertEquals(r.status, 502);
    assertEquals(JSON.parse(r.text), { error: 'Scan unavailable' });
    assertEquals(r.h.calls, 1);
    const everything = r.text + r.h.logs.join('\n');
    for (const needle of [SECRET, 'server-owned prompt', GOOD_URL, 'file_url']) {
      assert(!everything.includes(needle), `leaked: ${needle}`);
    }
  },
);

Deno.test('a hung provider is bounded by the timeout and returns a safe 504', async () => {
  const r = await run(post({ file_url: GOOD_URL }), signedIn, () => new Promise(() => {}), {
    timeoutMs: 25,
  });
  assertEquals(r.status, 504);
  assertEquals(JSON.parse(r.text), { error: 'Scan timed out' });
  assertEquals(r.h.calls, 1);
});

Deno.test('an oversized provider result is not returned', async () => {
  const r = await run(post({ file_url: GOOD_URL }), signedIn, async () => ({
    notes: 'z'.repeat(70 * 1024),
  }));
  assertEquals(r.status, 502);
  assert(r.text.length < 100);
});

Deno.test('logs never contain the caller identity, tokens or request body', async () => {
  const r = await run(post({ file_url: GOOD_URL, token: SECRET }), async () =>
    Promise.reject(new Error(SECRET)),
  );
  assertEquals(r.status, 401);
  assert(!(r.text + r.h.logs.join('\n')).includes(SECRET));
});
