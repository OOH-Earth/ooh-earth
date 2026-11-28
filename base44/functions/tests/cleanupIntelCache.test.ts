import { handleCleanupIntelCache } from '../cleanupIntelCache/handler.ts';

const assertEquals = (actual: unknown, expected: unknown, message: string) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
};
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-25T00:00:00Z');

function harness(user: any, authThrows = false) {
  const calls = { list: 0, del: [] as string[], svc: 0 };
  const rows = [
    { id: 'old', created_date: new Date(NOW - 20 * DAY).toISOString() },
    { id: 'fresh', created_date: new Date(NOW - 1 * DAY).toISOString() },
  ];
  const client = {
    auth: {
      me: async () => {
        if (authThrows) throw new Error('no session');
        return user;
      },
    },
    get asServiceRole() {
      calls.svc += 1;
      return {
        entities: {
          IntelCache: {
            list: async () => {
              calls.list += 1;
              return calls.list === 1 ? rows : [];
            },
            delete: async (id: string) => {
              calls.del.push(id);
            },
          },
        },
      };
    },
  };
  return { calls, deps: { createClientFromRequest: () => client, now: () => NOW } };
}
const post = () => new Request('https://example.test/f', { method: 'POST' });

Deno.test(
  'cleanupIntelCache rejects anonymous callers before any service-role access',
  async () => {
    for (const h of [harness(null), harness(null, true)]) {
      const res = await handleCleanupIntelCache(post(), h.deps);
      assertEquals(res.status, 401, 'anonymous status');
      assertEquals(h.calls.svc, 0, 'service role untouched');
      assertEquals(h.calls.del, [], 'nothing deleted');
    }
  },
);

Deno.test('cleanupIntelCache rejects non-admin callers (role and access spoof)', async () => {
  for (const user of [
    { id: 'u1', role: 'user' },
    { id: 'u2', role: 'user', access: 'admin' },
    { id: 'u3', data: { role: 'user' } },
  ]) {
    const h = harness(user);
    const res = await handleCleanupIntelCache(post(), h.deps);
    assertEquals(res.status, 403, 'non-admin status');
    assertEquals(h.calls.svc, 0, 'service role untouched');
  }
});

Deno.test('cleanupIntelCache rejects non-POST methods', async () => {
  const h = harness({ id: 'a', role: 'admin' });
  const res = await handleCleanupIntelCache(new Request('https://example.test/f'), h.deps);
  assertEquals(res.status, 405, 'GET status');
  assertEquals(h.calls.svc, 0, 'service role untouched');
});

Deno.test('cleanupIntelCache lets an admin delete only rows past retention', async () => {
  const h = harness({ id: 'a', role: 'admin' });
  const res = await handleCleanupIntelCache(post(), h.deps);
  assertEquals(res.status, 200, 'admin status');
  assertEquals(
    await res.json(),
    { ok: true, scanned: 2, stale: 1, deleted: 1, truncated: false },
    'summary',
  );
  assertEquals(h.calls.del, ['old'], 'only stale row deleted');
});

Deno.test(
  'cleanupIntelCache: a member cannot gain access through a nested role field',
  async () => {
    const h = harness({ id: 'm', role: 'user', data: { role: 'admin' } });
    const res = await handleCleanupIntelCache(post(), h.deps);
    assertEquals(res.status, 403, 'member status');
    assertEquals(h.calls.svc, 0, 'service role untouched');
    assertEquals(h.calls.list, 0, 'no entity reads');
  },
);

Deno.test(
  'cleanupIntelCache: client construction failure reveals nothing and does no work',
  async () => {
    const res = await handleCleanupIntelCache(post(), {
      createClientFromRequest: () => {
        throw new Error('internal detail');
      },
    });
    assertEquals(res.status, 500, 'status');
    assertEquals(await res.json(), { error: 'Cleanup unavailable' }, 'generic body');
  },
);
