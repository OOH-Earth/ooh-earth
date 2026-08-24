import { handleMigrateLocationImages } from '../migrateLocationImages/handler.ts';
import { handleN8nPing } from '../n8nPing/handler.ts';
import { handleScanAd } from '../scanAd/handler.ts';
import { handleCachedIntel } from '../cachedIntel/handler.ts';
import { handleCreateDonationCheckout } from '../createDonationCheckout/handler.ts';
import { handleClaimLead } from '../claimLead/handler.ts';
import { handleStripeWebhook } from '../stripeWebhook/handler.ts';
import { handleCreateProductCheckout } from '../createProductCheckout/handler.ts';
import { handleCreatePlanCheckout } from '../createPlanCheckout/handler.ts';
import { handleClaimQuest } from '../claimQuest/handler.ts';
import { handlePersonaCtl } from '../personaCtl/handler.ts';
import { handleDeleteMyAccount } from '../deleteMyAccount/handler.ts';

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

const signedStripeRequest = async (body: string, secret: string, now: number) => {
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
    new TextEncoder().encode(`${now / 1000}.${body}`),
  );
  const signature = Array.from(new Uint8Array(mac))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return new Request('https://example.test/function', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': `t=${now / 1000},v1=${signature}`,
    },
    body,
  });
};

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
    const ledgers: any[] = [];
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
          StripeEvent: {
            filter: async (query: any) =>
              ledgers.filter((item) =>
                Object.entries(query).every(([key, value]) => item[key] === value),
              ),
            create: async (value: any) => {
              const record = { id: `ledger-${ledgers.length + 1}`, ...value };
              ledgers.push(record);
              return record;
            },
            update: async (id: string, patch: any) => {
              const record = ledgers.find((item) => item.id === id);
              if (record) Object.assign(record, patch);
              return record;
            },
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

Deno.test('stripeWebhook records retryable ledger state across partial failures', async () => {
  const secret = 'whsec_retry';
  const now = 1_700_000_000_000;
  const ledgers: any[] = [];
  const purchases: any[] = [];
  const funding: any[] = [];
  const item = { edition_sold: 0 };
  let failInventory = true;
  const entities = {
    StripeEvent: {
      filter: async (query: any) =>
        ledgers.filter((record) =>
          Object.entries(query).every(([key, value]) => record[key] === value),
        ),
      create: async (value: any) => {
        const record = { id: `evt-ledger-${ledgers.length + 1}`, ...value };
        ledgers.push(record);
        return record;
      },
      update: async (id: string, patch: any) => {
        const record = ledgers.find((candidate) => candidate.id === id);
        if (record) Object.assign(record, patch);
        return record;
      },
    },
    Purchase: {
      filter: async ({ stripe_session_id }: any) =>
        purchases.filter((record) => record.stripe_session_id === stripe_session_id),
      create: async (record: any) => purchases.push(record),
    },
    FundingLead: {
      filter: async ({ ext_ref }: any) => funding.filter((record) => record.ext_ref === ext_ref),
      create: async (record: any) => funding.push(record),
    },
    StoreItem: {
      get: async () => item,
      update: async (_id: string, patch: any) => {
        if (failInventory) {
          failInventory = false;
          throw new Error('inventory unavailable');
        }
        Object.assign(item, patch);
      },
    },
    Subscription: { filter: async () => [], create: async () => {}, update: async () => {} },
  };
  const event = {
    id: 'evt_retry',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_retry',
        mode: 'payment',
        amount_total: 2500,
        customer_email: 'retry@example.com',
        metadata: { item_id: 'item_retry', item_title: 'Retry item', user_id: 'user_retry' },
      },
    },
  };
  const body = JSON.stringify(event);
  const deps = {
    createClientFromRequest: () => ({ asServiceRole: { entities } }),
    getEnv: (name: string) => (name === 'STRIPE_WEBHOOK_SECRET' ? secret : undefined),
    now: () => now,
    inFlight: new Map<string, Promise<unknown>>(),
  };
  const first = await handleStripeWebhook(await signedStripeRequest(body, secret, now), deps);
  assertEquals(first.status, 500, 'partial inventory failure is retryable');
  assertEquals(ledgers[0].status, 'failed_retryable', 'failed ledger state');
  assertEquals(ledgers[0].purchase_status, 'completed', 'purchase stage retained');
  assertEquals(purchases.length, 1, 'purchase created once before inventory failure');
  const alternateEventBody = JSON.stringify({ ...event, id: 'evt_retry_2' });
  const retry = await handleStripeWebhook(
    await signedStripeRequest(alternateEventBody, secret, now),
    {
      ...deps,
      inFlight: new Map(),
    },
  );
  assertEquals(retry.status, 200, 'different event id retries the same business operation');
  assertEquals(ledgers.length, 2, 'alternate event gets its own ledger row');
  assertEquals(ledgers[0].status, 'completed', 'canonical failed ledger is repaired');
  const replay = await handleStripeWebhook(await signedStripeRequest(body, secret, now), {
    ...deps,
    inFlight: new Map(),
  });
  assertEquals(replay.status, 200, 'same event replay is completed');
  assertEquals(item.edition_sold, 1, 'inventory applied on retry');
  assertEquals(purchases.length, 1, 'retry does not duplicate purchase');
  assertEquals(funding.length, 1, 'retry creates funding once');
  assertEquals(ledgers[0].status, 'completed', 'ledger completed after retry');
});

Deno.test('stripeWebhook fails closed when the durable ledger is unavailable', async () => {
  const secret = 'whsec_missing_ledger';
  const now = 1_700_000_000_000;
  const event = { id: 'evt_no_ledger', type: 'charge.refunded', data: { object: { id: 'ch_1' } } };
  const body = JSON.stringify(event);
  const response = await handleStripeWebhook(await signedStripeRequest(body, secret, now), {
    createClientFromRequest: () => ({ asServiceRole: { entities: {} } }),
    getEnv: (name: string) => (name === 'STRIPE_WEBHOOK_SECRET' ? secret : undefined),
    now: () => now,
    inFlight: new Map(),
  });
  assertEquals(response.status, 500, 'missing ledger is retryable');
  assertEquals(
    await json(response),
    { error: 'Webhook processing unavailable' },
    'sanitized ledger failure',
  );
});

Deno.test('stripeWebhook deduplicates subscription event replays durably', async () => {
  const secret = 'whsec_subscription';
  const now = 1_700_000_000_000;
  const ledgers: any[] = [];
  const subscriptions: any[] = [];
  const entities = {
    StripeEvent: {
      filter: async (query: any) =>
        ledgers.filter((record) =>
          Object.entries(query).every(([key, value]) => record[key] === value),
        ),
      create: async (value: any) => {
        const record = { id: `subscription-ledger-${ledgers.length + 1}`, ...value };
        ledgers.push(record);
        return record;
      },
      update: async (id: string, patch: any) => {
        const record = ledgers.find((candidate) => candidate.id === id);
        if (record) Object.assign(record, patch);
        return record;
      },
    },
    Subscription: {
      filter: async ({ stripe_subscription_id }: any) =>
        subscriptions.filter((record) => record.stripe_subscription_id === stripe_subscription_id),
      create: async (record: any) => subscriptions.push(record),
      update: async (_id: string, patch: any) => Object.assign(subscriptions[0], patch),
    },
  };
  const event = {
    id: 'evt_subscription',
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_1',
        status: 'active',
        current_period_end: 123,
        cancel_at_period_end: false,
      },
    },
  };
  const body = JSON.stringify(event);
  const deps = {
    createClientFromRequest: () => ({ asServiceRole: { entities } }),
    getEnv: (name: string) => (name === 'STRIPE_WEBHOOK_SECRET' ? secret : undefined),
    now: () => now,
    inFlight: new Map<string, Promise<unknown>>(),
  };
  const first = await handleStripeWebhook(await signedStripeRequest(body, secret, now), deps);
  assertEquals(first.status, 200, 'subscription update accepted');
  const replay = await handleStripeWebhook(await signedStripeRequest(body, secret, now), {
    ...deps,
    inFlight: new Map(),
  });
  assertEquals(replay.status, 200, 'subscription replay accepted');
  assertEquals(ledgers.length, 1, 'subscription replay reuses ledger');
  assertEquals(
    subscriptions.length,
    0,
    'update without existing subscription does not invent ownership',
  );
});

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

Deno.test('createProductCheckout keeps price and metadata server-authoritative', async () => {
  let stripeCalls = 0;
  let stripeParams: URLSearchParams | undefined;
  let forwardedIdempotencyKey = '';
  const client = (user: unknown, item: any) => ({
    auth: { me: async () => user },
    asServiceRole: { entities: { StoreItem: { get: async () => item } } },
  });
  const deps = {
    createClientFromRequest: () =>
      client(
        { id: 'user-1' },
        {
          id: 'item-1',
          title: 'Field book',
          status: 'available',
          price_usd: 25,
          edition_size: 10,
          edition_sold: 1,
        },
      ),
    getEnv: (name: string) => ({ STRIPE_SECRET_KEY: 'sk_test', BASE44_APP_ID: 'app-1' })[name],
    fetchImpl: async (_url: string | URL | Request, init?: RequestInit) => {
      stripeCalls++;
      forwardedIdempotencyKey = new Headers(init?.headers).get('Idempotency-Key') || '';
      stripeParams = new URLSearchParams(String(init?.body));
      return new Response(JSON.stringify({ url: 'https://checkout.stripe.test/product' }), {
        status: 200,
      });
    },
  };
  assertEquals(
    (await handleCreateProductCheckout(request('GET', { item_id: 'item-1' }), deps)).status,
    405,
    'product method',
  );
  assertEquals(
    (await handleCreateProductCheckout(request('POST', { item_id: '../bad' }), deps)).status,
    400,
    'product id validation',
  );
  assertEquals(
    (
      await handleCreateProductCheckout(request('POST', { item_id: 'item-1' }), {
        ...deps,
        createClientFromRequest: () => client(null, {}),
      })
    ).status,
    401,
    'product auth',
  );
  const success = await handleCreateProductCheckout(
    new Request('https://example.test', {
      method: 'POST',
      headers: { 'idempotency-key': 'product-1' },
      body: JSON.stringify({ item_id: 'item-1', price_usd: 0.01, user_id: 'attacker' }),
    }),
    deps,
  );
  assertEquals(success.status, 200, 'product success');
  assertEquals(
    stripeParams?.get('line_items[0][price_data][unit_amount]'),
    '2500',
    'product server price',
  );
  assertEquals(stripeParams?.get('metadata[user_id]'), 'user-1', 'product server user metadata');
  assertEquals(forwardedIdempotencyKey, 'product-1', 'product idempotency forwarding');
  const soldOut = await handleCreateProductCheckout(request('POST', { item_id: 'item-1' }), {
    ...deps,
    createClientFromRequest: () =>
      client(
        { id: 'user-1' },
        { status: 'available', price_usd: 25, edition_size: 1, edition_sold: 1 },
      ),
  });
  assertEquals(soldOut.status, 409, 'product sold out');
  const failed = await handleCreateProductCheckout(request('POST', { item_id: 'item-1' }), {
    ...deps,
    fetchImpl: async () => {
      throw new Error('secret stripe');
    },
  });
  assertEquals(failed.status, 502, 'product provider failure');
  assertEquals(await json(failed), { error: 'Checkout unavailable' }, 'product sanitized failure');
});

Deno.test('createPlanCheckout validates plan selection and preserves server pricing', async () => {
  let params: URLSearchParams | undefined;
  const client = (user: unknown) => ({ auth: { me: async () => user } });
  const deps = {
    createClientFromRequest: () => client({ id: 'user-1', email: 'user@example.com' }),
    getEnv: (name: string) => ({ STRIPE_SECRET_KEY: 'sk_test', BASE44_APP_ID: 'app-1' })[name],
    fetchImpl: async (_url: string | URL | Request, init?: RequestInit) => {
      params = new URLSearchParams(String(init?.body));
      return new Response(JSON.stringify({ url: 'https://checkout.stripe.test/plan' }), {
        status: 200,
      });
    },
  };
  assertEquals(
    (await handleCreatePlanCheckout(request('GET', { tier: 'patron', period: 'year' }), deps))
      .status,
    405,
    'plan method',
  );
  assertEquals(
    (
      await handleCreatePlanCheckout(
        new Request('https://example.test', { method: 'POST', body: '{' }),
        deps,
      )
    ).status,
    400,
    'plan malformed',
  );
  assertEquals(
    (await handleCreatePlanCheckout(request('POST', { tier: 'arbitrary', period: 'year' }), deps))
      .status,
    400,
    'plan tier validation',
  );
  assertEquals(
    (await handleCreatePlanCheckout(request('POST', { tier: 'patron', period: 'week' }), deps))
      .status,
    400,
    'plan period validation',
  );
  assertEquals(
    (
      await handleCreatePlanCheckout(
        request('POST', { tier: 'patron', period: 'year', amount: 1 }),
        { ...deps, createClientFromRequest: () => client(null) },
      )
    ).status,
    401,
    'plan auth',
  );
  const success = await handleCreatePlanCheckout(
    new Request('https://example.test', {
      method: 'POST',
      headers: { 'idempotency-key': 'plan-1' },
      body: JSON.stringify({ tier: 'patron', period: 'year', amount: 1 }),
    }),
    deps,
  );
  assertEquals(success.status, 200, 'plan success');
  assertEquals(params?.get('line_items[0][price_data][unit_amount]'), '50000', 'plan server price');
  assertEquals(params?.get('metadata[plan_tier]'), 'patron', 'plan metadata');
  const failed = await handleCreatePlanCheckout(
    request('POST', { tier: 'patron', period: 'year' }),
    {
      ...deps,
      fetchImpl: async () => {
        throw new Error('secret stripe');
      },
    },
  );
  assertEquals(failed.status, 502, 'plan provider failure');
  assertEquals(await json(failed), { error: 'Checkout unavailable' }, 'plan sanitized failure');
});

Deno.test(
  'claimQuest recomputes eligibility and prevents replay/concurrent reward claims',
  async () => {
    const now = new Date('2026-08-24T12:00:00.000Z');
    let createCount = 0;
    const completions: any[] = [];
    const client = (user: unknown, locations: any[] = []) => ({
      auth: { me: async () => user },
      asServiceRole: {
        entities: {
          QuestCompletion: {
            filter: async (query: any) =>
              completions.filter(
                (item) =>
                  item.quest_id === query.quest_id &&
                  item.period_key === query.period_key &&
                  item.created_by_id === query.created_by_id,
              ),
            create: async (value: any) => {
              createCount++;
              completions.push(value);
            },
          },
          Location: { filter: async () => locations },
          DigitalBust: { filter: async () => [] },
          Mint: { filter: async () => [] },
        },
      },
    });
    const inFlight = new Map();
    const deps = {
      createClientFromRequest: () =>
        client({ id: 'user-1' }, [
          { created_date: now.toISOString(), image_url: 'https://media.base44.com/a.jpg' },
        ]),
      now: () => now,
      inFlight,
    };
    assertEquals(
      (await handleClaimQuest(request('GET', { quest_id: 'daily_report' }), deps)).status,
      405,
      'quest method',
    );
    assertEquals(
      (
        await handleClaimQuest(
          new Request('https://example.test', { method: 'POST', body: '{' }),
          deps,
        )
      ).status,
      400,
      'quest malformed',
    );
    assertEquals(
      (await handleClaimQuest(request('POST', { quest_id: 'unknown' }), deps)).status,
      400,
      'quest unknown',
    );
    assertEquals(
      (
        await handleClaimQuest(request('POST', { quest_id: 'weekly_reports' }), {
          ...deps,
          createClientFromRequest: () => client({ id: 'user-1' }, []),
        })
      ).status,
      403,
      'quest incomplete',
    );
    const first = await handleClaimQuest(
      request('POST', { quest_id: 'daily_report', xp_awarded: 999999 }),
      deps,
    );
    assertEquals(first.status, 200, 'quest valid claim');
    assertEquals((await json(first)).xp_awarded, 50, 'quest server reward');
    const replay = await handleClaimQuest(request('POST', { quest_id: 'daily_report' }), deps);
    assertEquals((await json(replay)).already, true, 'quest replay');
    assertEquals(createCount, 1, 'quest duplicate suppression');
    const concurrentMap = new Map();
    const concurrentDeps = {
      ...deps,
      inFlight: concurrentMap,
      createClientFromRequest: () =>
        client({ id: 'user-2' }, [
          { created_date: now.toISOString(), image_url: 'https://media.base44.com/a.jpg' },
        ]),
    };
    const [concurrentA, concurrentB] = await Promise.all([
      handleClaimQuest(request('POST', { quest_id: 'daily_photo' }), concurrentDeps),
      handleClaimQuest(request('POST', { quest_id: 'daily_photo' }), concurrentDeps),
    ]);
    assertEquals(concurrentA.status, 200, 'quest concurrent first response');
    assertEquals(concurrentB.status, 200, 'quest concurrent replay response');
    assertEquals(createCount, 2, 'quest same-runtime concurrent suppression');
    const rollover = new Date('2026-08-25T12:00:00.000Z');
    const nextPeriod = await handleClaimQuest(request('POST', { quest_id: 'daily_report' }), {
      ...deps,
      now: () => rollover,
      inFlight: new Map(),
      createClientFromRequest: () =>
        client({ id: 'user-1' }, [{ created_date: rollover.toISOString() }]),
    });
    assertEquals(nextPeriod.status, 200, 'quest period rollover');
    assertEquals(createCount, 3, 'quest new period reward');
    const unauth = await handleClaimQuest(request('POST', { quest_id: 'daily_report' }), {
      ...deps,
      createClientFromRequest: () => client(null),
    });
    assertEquals(unauth.status, 401, 'quest unauthenticated');
  },
);

Deno.test(
  'personaCtl enforces normalized admin/key authorization and bounded transitions',
  async () => {
    const updates: any[] = [];
    const audit: any[] = [];
    const users = [
      { id: 'admin-1', email: 'admin@example.com', role: 'admin', access: 'admin' },
      { id: 'user-1', email: 'user@example.com', role: 'user', access: 'member' },
    ];
    const client = (caller: unknown) => ({
      auth: { me: async () => caller },
      asServiceRole: {
        entities: {
          User: {
            list: async () => users,
            get: async (id: string) => users.find((user) => user.id === id),
            filter: async ({ email }: any) => users.filter((user) => user.email === email),
            update: async (id: string, patch: any) => {
              updates.push([id, patch]);
              Object.assign(users.find((user) => user.id === id) || {}, patch);
            },
          },
          AccessLog: { create: async (value: any) => audit.push(value) },
        },
      },
    });
    const deps = {
      createClientFromRequest: () => client({ role: 'admin' }),
      getEnv: () => 'secret-key',
    };
    assertEquals((await handlePersonaCtl(request('GET'), deps)).status, 405, 'persona method');
    assertEquals(
      (
        await handlePersonaCtl(request('POST', { action: 'list' }), {
          ...deps,
          createClientFromRequest: () => client(null),
          getEnv: () => '',
        })
      ).status,
      403,
      'persona unauth',
    );
    assertEquals(
      (
        await handlePersonaCtl(
          request('POST', { action: 'set', id: 'user-1', role: 'superuser' }),
          deps,
        )
      ).status,
      400,
      'persona invalid role',
    );
    assertEquals(
      (
        await handlePersonaCtl(
          request('POST', { action: 'set', id: 'missing', access: 'member' }),
          deps,
        )
      ).status,
      404,
      'persona invalid target',
    );
    const success = await handlePersonaCtl(
      request('POST', {
        action: 'set',
        id: 'user-1',
        role: 'user',
        access: 'moderator',
        agency: true,
      }),
      deps,
    );
    assertEquals(success.status, 200, 'persona admin set');
    assertEquals(updates.length, 1, 'persona update count');
    assertEquals(audit.length, 1, 'persona audit count');
    const lastAdmin = await handlePersonaCtl(
      request('POST', { action: 'set', id: 'admin-1', role: 'user' }),
      deps,
    );
    assertEquals(lastAdmin.status, 409, 'persona last-admin guard');
    const keyAccess = await handlePersonaCtl(
      new Request('https://example.test', {
        method: 'POST',
        headers: { 'x-persona-key': 'secret-key' },
        body: JSON.stringify({ action: 'list' }),
      }),
      {
        createClientFromRequest: () => client(null),
        getEnv: () => 'secret-key',
      },
    );
    assertEquals(keyAccess.status, 200, 'persona secret-key path');
    const failed = await handlePersonaCtl(
      request('POST', { action: 'set', id: 'user-1', access: 'member' }),
      {
        ...deps,
        createClientFromRequest: () => ({
          auth: { me: async () => ({ role: 'admin' }) },
          asServiceRole: {
            entities: {
              User: {
                list: async () => users,
                get: async () => users[1],
                update: async () => {
                  throw new Error('secret database');
                },
              },
              AccessLog: { create: async () => {} },
            },
          },
        }),
      },
    );
    assertEquals(failed.status, 500, 'persona sanitized failure');
    assertEquals(
      (await json(failed)).error,
      'Persona operation unavailable',
      'persona failure body',
    );
  },
);

Deno.test(
  'deleteMyAccount reports partial/blocked deletion and retains financial history',
  async () => {
    const deleted: string[] = [];
    const makeClient = (user: unknown, mode = 'success') => ({
      auth: { me: async () => user },
      asServiceRole: {
        entities: {
          Location: {
            filter: async () => [{ id: 'loc-1' }],
            delete: async () => deleted.push('Location'),
          },
          DigitalBust: { filter: async () => [], delete: async () => {} },
          FieldCheck: {
            filter: async () => [{ id: 'check-1' }],
            delete: async () => {
              if (mode === 'partial') throw new Error('delete failed');
              deleted.push('FieldCheck');
            },
          },
          LocationPhoto: { filter: async () => [], delete: async () => {} },
          QuestCompletion: { filter: async () => [], delete: async () => {} },
          LeadClaim: { filter: async () => [], delete: async () => {} },
          User: {
            delete: async () => {
              if (mode !== 'success') throw new Error('blocked');
            },
            update: async () => {
              if (mode === 'blocked') throw new Error('blocked');
            },
          },
        },
      },
    });
    const deps = { createClientFromRequest: () => makeClient({ id: 'user-1' }) };
    assertEquals(
      (await handleDeleteMyAccount(request('GET', { confirm: true }), deps)).status,
      405,
      'delete method',
    );
    assertEquals(
      (await handleDeleteMyAccount(request('POST', {}), deps)).status,
      400,
      'delete confirmation',
    );
    assertEquals(
      (
        await handleDeleteMyAccount(request('POST', { confirm: true }), {
          createClientFromRequest: () => makeClient(null),
        })
      ).status,
      401,
      'delete auth',
    );
    const complete = await handleDeleteMyAccount(request('POST', { confirm: true }), deps);
    assertEquals(complete.status, 200, 'delete complete');
    const completeBody = await json(complete);
    assertEquals(completeBody.status, 'completed', 'delete complete state');
    assert(
      completeBody.retained_by_policy.some((item: string) => item.startsWith('Purchase')),
      'financial history retained',
    );
    assertEquals(deleted.sort(), ['FieldCheck', 'Location'], 'delete owned entities');
    const partial = await handleDeleteMyAccount(request('POST', { confirm: true }), {
      createClientFromRequest: () => makeClient({ id: 'user-1' }, 'partial'),
    });
    assertEquals(partial.status, 207, 'delete partial status');
    assertEquals((await json(partial)).status, 'partial', 'delete partial state');
    const blocked = await handleDeleteMyAccount(request('POST', { confirm: true }), {
      createClientFromRequest: () => makeClient({ id: 'user-1' }, 'blocked'),
    });
    assertEquals(blocked.status, 207, 'delete blocked fallback state');
  },
);
