import { handleMigrateLocationImages } from '../migrateLocationImages/handler.ts';
import { handleN8nPing } from '../n8nPing/handler.ts';
import { handleScanAd } from '../scanAd/handler.ts';
import { handleCachedIntel } from '../cachedIntel/handler.ts';

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
