import { handleMigrateLocationImages } from '../migrateLocationImages/handler.ts';
import { handleN8nPing } from '../n8nPing/handler.ts';
import { handleScanAd } from '../scanAd/handler.ts';
import { handleCachedIntel } from '../cachedIntel/handler.ts';
import { handleCreateDonationCheckout } from '../createDonationCheckout/handler.ts';
import { handleClaimLead } from '../claimLead/handler.ts';
import { handleStripeWebhook } from '../stripeWebhook/handler.ts';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};
const assertEquals = (actual: unknown, expected: unknown, message: string) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
};
const json = (response: Response) => response.json();
const request = (method = 'POST', body?: unknown) =>
  new Request('https://example.test/function', {
    method,
    headers: { 'content-type': 'application/json' },
    body:
      body === undefined || method === 'GET' || method === 'HEAD'
        ? undefined
        : JSON.stringify(body),
  });

const migrationClient = (user: unknown, locations: unknown[] = []) => {
  const updates: unknown[] = [];
  const uploads: unknown[] = [];
  return {
    updates,
    uploads,
    client: {
      auth: { me: async () => user },
      asServiceRole: {
        entities: {
          Location: {
            filter: async () => locations,
            updateMany: async (...args: unknown[]) => updates.push(args),
          },
        },
        integrations: {
          Core: {
            UploadFile: async (...args: unknown[]) => {
              uploads.push(args);
              return { file_url: 'https://media.base44.com/migrated.jpg' };
            },
          },
        },
      },
    },
  };
};

Deno.test('migrateLocationImages rejects unauthenticated and non-admin callers', async () => {
  let created = 0;
  const deps = {
    createClientFromRequest: () => {
      created++;
      return { auth: { me: async () => null } };
    },
  };
  const unauth = await handleMigrateLocationImages(request(), deps);
  assertEquals(unauth.status, 403, 'unauthenticated migration status');
  const method = await handleMigrateLocationImages(request('GET'), deps);
  assertEquals(method.status, 405, 'migration method status');
  assertEquals(created, 1, 'non-POST must not create a client');
});

Deno.test('migrateLocationImages permits an admin and hides failures', async () => {
  const fake = migrationClient({ data: { role: 'admin' } }, [
    { image_url: 'https://ooh.earth/old.jpg' },
  ]);
  const response = await handleMigrateLocationImages(request(), {
    createClientFromRequest: () => fake.client,
    fetchImpl: async () =>
      new Response(new Uint8Array([1, 2]), { headers: { 'content-type': 'image/jpeg' } }),
  });
  assertEquals(response.status, 200, 'admin migration status');
  const body = await json(response);
  assertEquals(body.migratedCount, 1, 'migration count');
  assertEquals(fake.uploads.length, 1, 'upload call count');
  assertEquals(fake.updates.length, 1, 'update call count');

  const failed = await handleMigrateLocationImages(request(), {
    createClientFromRequest: () => ({
      auth: { me: async () => ({ role: 'admin' }) },
      asServiceRole: {
        entities: {
          Location: {
            filter: async () => {
              throw new Error('secret detail');
            },
          },
        },
      },
    }),
  });
  assertEquals(failed.status, 500, 'migration failure status');
  const failedBody = await json(failed);
  assertEquals(failedBody, { error: 'Migration failed' }, 'migration failure body');
});

Deno.test(
  'n8nPing enforces admin auth, validates input, and sanitizes downstream responses',
  async () => {
    let fetches = 0;
    const baseDeps = {
      createClientFromRequest: () => ({ auth: { me: async () => ({ role: 'admin' }) } }),
      getEnv: (name: string) =>
        name === 'N8N_WEBHOOK_URL' ? 'https://n8n.example.test/hook' : undefined,
      fetchImpl: async () => {
        fetches++;
        return new Response('{"secret":"do-not-reflect"}', { status: 200 });
      },
    };
    const unauth = await handleN8nPing(request(), {
      ...baseDeps,
      createClientFromRequest: () => ({
        auth: {
          me: async () => {
            throw new Error('no auth');
          },
        },
      }),
    });
    assertEquals(unauth.status, 401, 'n8n unauth status');
    const malformed = new Request('https://example.test/function', { method: 'POST', body: '{' });
    const bad = await handleN8nPing(malformed, baseDeps);
    assertEquals(bad.status, 400, 'n8n malformed status');
    const overlong = await handleN8nPing(request('POST', { note: 'x'.repeat(501) }), baseDeps);
    assertEquals(overlong.status, 400, 'n8n bounded note status');
    const success = await handleN8nPing(request('POST', { note: 'hello' }), baseDeps);
    assertEquals(success.status, 200, 'n8n success status');
    const successBody = await json(success);
    assert(successBody.ok === true && successBody.n8n.status === 200, 'n8n success body');
    assert(
      !JSON.stringify(successBody).includes('do-not-reflect'),
      'downstream body must not be reflected',
    );
    assertEquals(fetches, 1, 'n8n fetch count');
    const failed = await handleN8nPing(request('POST', {}), {
      ...baseDeps,
      fetchImpl: async () => {
        throw new Error('secret downstream');
      },
    });
    assertEquals(failed.status, 502, 'n8n failure status');
    assertEquals(
      await json(failed),
      { ok: false, error: 'Webhook unavailable' },
      'n8n failure body',
    );
  },
);

Deno.test(
  'createDonationCheckout preserves public donations while bounding Stripe input',
  async () => {
    let calls = 0;
    let forwardedIdempotencyKey = '';
    const fetchImpl = async (_url: string | URL | Request, init?: RequestInit) => {
      calls++;
      forwardedIdempotencyKey = new Headers(init?.headers).get('Idempotency-Key') || '';
      const params = new URLSearchParams(String(init?.body));
      assertEquals(params.get('line_items[0][price_data][unit_amount]'), '5000', 'Stripe amount');
      assertEquals(params.get('line_items[0][price_data][currency]'), 'usd', 'Stripe currency');
      return new Response(JSON.stringify({ url: 'https://checkout.stripe.test/session' }), {
        status: 200,
      });
    };
    const deps = {
      fetchImpl,
      getEnv: (name: string) => ({ STRIPE_SECRET_KEY: 'sk_test', BASE44_APP_ID: 'app' })[name],
    };
    assertEquals(
      (await handleCreateDonationCheckout(request('GET', { amount: 50 }), deps)).status,
      405,
      'donation method',
    );
    const malformed = new Request('https://example.test', { method: 'POST', body: '{' });
    assertEquals(
      (await handleCreateDonationCheckout(malformed, deps)).status,
      400,
      'donation malformed body',
    );
    for (const amount of [Number.NaN, Number.POSITIVE_INFINITY, 0, 10_001]) {
      assertEquals(
        (await handleCreateDonationCheckout(request('POST', { amount }), deps)).status,
        400,
        'donation invalid amount',
      );
    }
    const invalidKey = await handleCreateDonationCheckout(
      new Request('https://example.test', {
        method: 'POST',
        headers: { 'idempotency-key': 'bad key' },
        body: JSON.stringify({ amount: 50 }),
      }),
      deps,
    );
    assertEquals(invalidKey.status, 400, 'donation invalid idempotency key');
    const success = await handleCreateDonationCheckout(
      new Request('https://example.test', {
        method: 'POST',
        headers: { 'idempotency-key': 'donation-1' },
        body: JSON.stringify({ amount: 50, ignored: 'field' }),
      }),
      deps,
    );
    assertEquals(success.status, 200, 'donation success');
    assertEquals(calls, 1, 'donation Stripe calls');
    assertEquals(forwardedIdempotencyKey, 'donation-1', 'donation idempotency forwarding');
    const failed = await handleCreateDonationCheckout(request('POST', { amount: 50 }), {
      ...deps,
      fetchImpl: async () => {
        throw new Error('secret Stripe detail');
      },
    });
    assertEquals(failed.status, 502, 'donation provider failure');
    assertEquals(
      await json(failed),
      { error: 'Checkout unavailable' },
      'donation sanitized failure',
    );
  },
);

Deno.test(
  'claimLead validates bounded anonymous claims and suppresses local concurrent duplicates',
  async () => {
    let creates = 0;
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const claims: any[] = [];
    const client = {
      asServiceRole: {
        entities: {
          Location: {
            filter: async () => {
              await gate;
              return [{ id: 'loc-1', title: 'Test location' }];
            },
          },
          LeadClaim: {
            filter: async () => claims,
            create: async (value: unknown) => {
              creates++;
              claims.push({ ...(value as object), status: 'pending' });
              return value;
            },
          },
        },
      },
    };
    const inFlight = new Map();
    const deps = { createClientFromRequest: () => client, inFlight };
    assertEquals((await handleClaimLead(request('GET'), deps)).status, 405, 'claim method');
    assertEquals(
      (
        await handleClaimLead(
          new Request('https://example.test', { method: 'POST', body: '{' }),
          deps,
        )
      ).status,
      400,
      'claim malformed body',
    );
    assertEquals(
      (await handleClaimLead(request('POST', { location_id: {}, operative_handle: 'x' }), deps))
        .status,
      400,
      'claim malformed identity',
    );
    assertEquals(
      (
        await handleClaimLead(
          request('POST', { location_id: 'loc-1', operative_handle: 'x'.repeat(81) }),
          deps,
        )
      ).status,
      400,
      'claim oversized handle',
    );
    const first = handleClaimLead(
      request('POST', { location_id: 'loc-1', operative_handle: '@ghost', note: 'observe' }),
      deps,
    );
    const second = handleClaimLead(
      request('POST', { location_id: 'loc-1', operative_handle: '@other' }),
      deps,
    );
    release?.();
    const [one, two] = await Promise.all([first, second]);
    assertEquals(one.status, 200, 'claim first success');
    assertEquals(two.status, 200, 'claim concurrent replay response');
    assertEquals(creates, 1, 'claim create count');
    const duplicate = await handleClaimLead(
      request('POST', { location_id: 'loc-1', operative_handle: '@third' }),
      {
        createClientFromRequest: () => ({
          asServiceRole: {
            entities: {
              Location: { filter: async () => [{ title: 'Test' }] },
              LeadClaim: {
                filter: async () => [{ status: 'accepted' }],
                create: async () => {
                  throw new Error('must not create');
                },
              },
            },
          },
        }),
        inFlight: new Map(),
      },
    );
    assertEquals(duplicate.status, 409, 'claim active duplicate');
  },
);

async function stripeSignature(body: string, secret: string, timestamp: number) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  return `t=${timestamp},v1=${Array.from(new Uint8Array(mac))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}`;
}

Deno.test(
  'stripeWebhook verifies signatures and makes replay-safe best-effort mutations',
  async () => {
    const secret = 'whsec_test';
    const now = 1_700_000_000_000;
    const funding: any[] = [];
    const purchases: any[] = [];
    const updates: any[] = [];
    const client = {
      asServiceRole: {
        entities: {
          FundingLead: {
            filter: async ({ ext_ref }: any) => funding.filter((item) => item.ext_ref === ext_ref),
            create: async (value: any) => {
              funding.push(value);
            },
          },
          Purchase: {
            filter: async ({ stripe_session_id }: any) =>
              purchases.filter((item) => item.stripe_session_id === stripe_session_id),
            create: async (value: any) => {
              purchases.push(value);
            },
          },
          StoreItem: {
            get: async () => ({ edition_sold: 2 }),
            update: async (...args: any[]) => updates.push(args),
          },
          Subscription: { filter: async () => [], create: async () => {}, update: async () => {} },
        },
      },
    };
    const fetchImpl = async (url: string | URL | Request) =>
      url.toString().startsWith('https://n8n')
        ? new Response('{}', { status: 200 })
        : new Response('{}', { status: 200 });
    const deps = {
      createClientFromRequest: () => client,
      getEnv: (name: string) =>
        name === 'STRIPE_WEBHOOK_SECRET'
          ? secret
          : name === 'N8N_WEBHOOK_URL'
            ? 'https://n8n.test/hook'
            : undefined,
      fetchImpl,
      now: () => now,
      inFlight: new Map<string, Promise<unknown>>(),
    };
    const invalid = await handleStripeWebhook(
      new Request('https://example.test', { method: 'POST', body: '{}' }),
      deps,
    );
    assertEquals(invalid.status, 401, 'Stripe invalid signature');
    const event = {
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          mode: 'payment',
          amount_total: 5000,
          customer_email: 'donor@example.com',
          metadata: { item_id: 'item_1', item_title: 'Field book', user_id: 'user_1' },
        },
      },
    };
    const body = JSON.stringify(event);
    const headers = { 'stripe-signature': await stripeSignature(body, secret, now / 1000) };
    const first = await handleStripeWebhook(
      new Request('https://example.test', { method: 'POST', body, headers }),
      deps,
    );
    assertEquals(first.status, 200, 'Stripe first delivery');
    assertEquals(funding.length, 1, 'FundingLead creation');
    assertEquals(purchases.length, 1, 'Purchase creation');
    assertEquals(updates.length, 1, 'inventory update');
    const replay = await handleStripeWebhook(
      new Request('https://example.test', { method: 'POST', body, headers }),
      deps,
    );
    assertEquals(replay.status, 200, 'Stripe replay');
    assertEquals(funding.length, 1, 'FundingLead replay suppression');
    assertEquals(purchases.length, 1, 'Purchase replay suppression');
    assertEquals(updates.length, 1, 'inventory replay suppression');
    const secondEvent = { ...event, id: 'evt_2' };
    const secondBody = JSON.stringify(secondEvent);
    const secondReplay = await handleStripeWebhook(
      new Request('https://example.test', {
        method: 'POST',
        body: secondBody,
        headers: { 'stripe-signature': await stripeSignature(secondBody, secret, now / 1000) },
      }),
      deps,
    );
    assertEquals(secondReplay.status, 200, 'Stripe session replay with new event id');
    assertEquals(funding.length, 1, 'session-level FundingLead dedupe');
    assertEquals(purchases.length, 1, 'session-level Purchase dedupe');
    assertEquals(updates.length, 1, 'session-level inventory dedupe');
    const ignoredEvent = {
      id: 'evt_ignored',
      type: 'charge.refunded',
      data: { object: { id: 'ch_1' } },
    };
    const ignoredBody = JSON.stringify(ignoredEvent);
    const ignored = await handleStripeWebhook(
      new Request('https://example.test', {
        method: 'POST',
        body: ignoredBody,
        headers: { 'stripe-signature': await stripeSignature(ignoredBody, secret, now / 1000) },
      }),
      deps,
    );
    assertEquals(ignored.status, 200, 'Stripe ignored event');
    const failed = await handleStripeWebhook(
      new Request('https://example.test', { method: 'POST', body, headers }),
      {
        ...deps,
        inFlight: new Map(),
        createClientFromRequest: () => ({
          asServiceRole: {
            entities: {
              FundingLead: {
                filter: async () => [],
                create: async () => {
                  throw new Error('secret database');
                },
              },
              Purchase: { filter: async () => [], create: async () => {} },
              StoreItem: { get: async () => ({ edition_sold: 0 }), update: async () => {} },
            },
          },
        }),
      },
    );
    assertEquals(failed.status, 500, 'Stripe partial failure retry signal');
    assertEquals(
      await json(failed),
      { error: 'Webhook processing unavailable' },
      'Stripe sanitized failure',
    );
  },
);

Deno.test('scanAd requires authenticated callers and Base44 media URLs', async () => {
  let llmCalls = 0;
  const schema = { type: 'object' };
  const prompt = 'scan';
  const client = (user: unknown, result: unknown = { is_advertising: true }) => ({
    auth: { me: async () => user },
    asServiceRole: {
      integrations: {
        Core: {
          InvokeLLM: async (...args: unknown[]) => {
            llmCalls++;
            return { result, args };
          },
        },
      },
    },
  });
  const unauth = await handleScanAd(
    request('POST', { file_url: 'https://media.base44.com/x.jpg' }),
    { createClientFromRequest: () => client(null) },
    schema,
    prompt,
  );
  assertEquals(unauth.status, 401, 'scan unauth status');
  const invalid = await handleScanAd(
    request('POST', { file_url: 'https://attacker.example/x.jpg' }),
    { createClientFromRequest: () => client({ id: 'u1' }) },
    schema,
    prompt,
  );
  assertEquals(invalid.status, 400, 'scan invalid URL status');
  const oversized = await handleScanAd(
    request('POST', { file_url: 'https://media.base44.com/' + 'x'.repeat(2048) }),
    { createClientFromRequest: () => client({ id: 'u1' }) },
    schema,
    prompt,
  );
  assertEquals(oversized.status, 400, 'scan oversized URL status');
  const success = await handleScanAd(
    request('POST', { file_url: 'https://media.base44.com/images/test.jpg' }),
    { createClientFromRequest: () => client({ id: 'u1' }) },
    schema,
    prompt,
  );
  assertEquals(success.status, 200, 'scan success status');
  assertEquals(llmCalls, 1, 'scan LLM call count');
  const failed = await handleScanAd(
    request('POST', { file_url: 'https://media.base44.com/images/test.jpg' }),
    {
      createClientFromRequest: () => ({
        auth: { me: async () => ({ id: 'u1' }) },
        asServiceRole: {
          integrations: {
            Core: {
              InvokeLLM: async () => {
                throw new Error('secret provider');
              },
            },
          },
        },
      }),
    },
    schema,
    prompt,
  );
  assertEquals(failed.status, 502, 'scan failure status');
  assertEquals(await json(failed), { error: 'Scan unavailable' }, 'scan failure body');
});

Deno.test(
  'cachedIntel restricts methods, keeps keys server-defined, and coalesces misses',
  async () => {
    let llmCalls = 0;
    let creates = 0;
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const client = {
      asServiceRole: {
        entities: {
          IntelCache: {
            filter: async () => [],
            create: async () => {
              creates++;
            },
          },
        },
        integrations: {
          Core: {
            InvokeLLM: async () => {
              llmCalls++;
              await gate;
              return { events: [] };
            },
          },
        },
      },
    };
    const inFlight = new Map<string, Promise<unknown>>();
    const deps = { createClientFromRequest: () => client, todayKey: () => '2026-08-24', inFlight };
    const method = await handleCachedIntel(request('GET', { key: 'skyIntel' }), deps);
    assertEquals(method.status, 405, 'cached intel method status');
    const unknown = await handleCachedIntel(request('POST', { key: 'arbitrary' }), deps);
    assertEquals(unknown.status, 400, 'cached intel key status');
    const first = handleCachedIntel(request('POST', { key: 'skyIntel' }), deps);
    const second = handleCachedIntel(request('POST', { key: 'skyIntel' }), deps);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assertEquals(llmCalls, 1, 'concurrent cache misses should invoke LLM once');
    release?.();
    const [one, two] = await Promise.all([first, second]);
    assertEquals(one.status, 200, 'cached intel first status');
    assertEquals(two.status, 200, 'cached intel second status');
    assertEquals(creates, 1, 'cache write count');
  },
);
