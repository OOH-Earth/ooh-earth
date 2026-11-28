import { handleSubmitOffline } from '../submitOffline/handler.ts';
import { LEASE_MS } from '../submitOffline/tickets.ts';

// The fake database models only the documented platform guarantees: no unique constraints, no
// transactions, and a single-record conditional updateMany that is applied atomically. Every
// call yields first, so concurrent handlers interleave between their reads and writes.

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};
const eq = (actual: unknown, expected: unknown, message: string) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(
      `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
};
const tick = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 4));

type Fault = 'none' | 'lose-response' | 'timeout-before' | 'reject-422' | 'reject-403';

function database() {
  const tables: Record<string, any[]> = { Location: [], FieldCheck: [], SubmissionTicket: [] };
  const state = { clock: 1_000_000, faults: [] as Fault[], creates: 0, queries: [] as any[] };
  let seq = 0;
  const matches = (row: any, query: Record<string, unknown>) =>
    Object.entries(query).every(([key, value]) => row[key] === value);
  // userId null = anonymous; anonymous callers cannot read pending records (mirrors read RLS).
  const entity = (name: string, userId: string | null, service: boolean) => ({
    filter: async (query: Record<string, unknown>) => {
      await tick();
      return tables[name]
        .filter((row) => matches(row, query))
        .filter((row) => service || (userId && row.created_by_id === userId))
        .map((row) => ({ ...row }));
    },
    create: async (data: any) => {
      await tick();
      const target = name !== 'SubmissionTicket';
      const fault: Fault = target ? (state.faults.shift() ?? 'none') : 'none';
      if (fault === 'reject-422' || fault === 'reject-403')
        throw Object.assign(new Error('rejected'), { status: fault === 'reject-422' ? 422 : 403 });
      if (fault === 'timeout-before') throw new Error('timeout');
      if (target) state.creates += 1;
      const row = { id: `${name}-${++seq}`, created_by_id: userId ?? 'anonymous', ...data };
      tables[name].push(row);
      await tick();
      if (fault === 'lose-response') throw new Error('connection reset after commit');
      return { ...row };
    },
    updateMany: async (query: Record<string, unknown>, update: { $set: object }) => {
      await tick();
      state.queries.push(query);
      // Atomic for a plain single id: test and write with no await in between.
      const rows = tables[name].filter((row) => matches(row, query));
      rows.forEach((row) => Object.assign(row, update.$set));
      return { updated: rows.length };
    },
  });
  // A fresh client per handler call, like separate function instances.
  const client = (userId: string | null = null) => ({
    auth: {
      me: async () => {
        if (!userId) throw Object.assign(new Error('unauthenticated'), { status: 401 });
        return { id: userId };
      },
    },
    entities: new Proxy({}, { get: (_t, name: string) => entity(name, userId, false) }),
    asServiceRole: {
      entities: new Proxy({}, { get: (_t, name: string) => entity(name, userId, true) }),
    },
  });
  return { tables, state, client };
}

type Db = ReturnType<typeof database>;

async function call(db: Db, body: unknown, userId: string | null = null) {
  const response = await handleSubmitOffline(
    new Request('https://example.test/f', { method: 'POST', body: JSON.stringify(body) }),
    { createClientFromRequest: () => db.client(userId), now: () => db.state.clock },
  );
  return { status: response.status, body: await response.json() };
}

const OP = '3f0c9a1e-7a52-4a10-9a2b-6d9f1f7c2b41';
const payload = (extra: object = {}) => ({
  client_operation_id: OP,
  title: 'Synthetic capture',
  lat: 13.7563,
  lng: 100.5018,
  ...extra,
});
const reserve = async (db: Db, user: string | null = null, operation = OP) =>
  (await call(db, { action: 'reserve', entity_type: 'Location', operation_id: operation }, user))
    .body.ticket_id as string;
const submit = (db: Db, ticket: string, user: string | null = null, data = payload()) =>
  call(db, { entity_type: 'Location', ticket_id: ticket, payload: data }, user);

Deno.test('tickets: simultaneous sends across instances create exactly one record', async () => {
  for (let round = 0; round < 25; round++) {
    const db = database();
    const ticket = await reserve(db);
    const results = await Promise.all(Array.from({ length: 8 }, () => submit(db, ticket)));
    eq(db.tables.Location.length, 1, 'one record');
    eq(db.state.creates, 1, 'one create call');
    eq(results.filter((r) => r.status === 200 && r.body.duplicate === false).length, 1, 'winner');
    assert(
      results.every((r) => r.status === 200 || (r.status === 202 && r.body.pending)),
      'losers are told it is pending or done',
    );
    const again = await submit(db, ticket);
    eq(
      [again.status, again.body.duplicate, again.body.record],
      [200, true, { id: db.tables.Location[0].id }],
      'replay returns only the original id',
    );
  }
});

Deno.test('tickets: every transition is a single-id conditional update', async () => {
  const db = database();
  const ticket = await reserve(db);
  await submit(db, ticket);
  assert(db.state.queries.length >= 2, 'transitions happened');
  for (const query of db.state.queries) {
    assert(typeof query.id === 'string', 'plain id');
    assert(Object.keys(query).length >= 2, 'with a condition');
    assert(
      Object.values(query).every((v) => typeof v !== 'object'),
      'no operators',
    );
  }
});

Deno.test('tickets: a response lost after commit never creates a second record', async () => {
  const db = database();
  const ticket = await reserve(db);
  db.state.faults = ['lose-response'];
  const lost = await submit(db, ticket);
  eq([lost.status, lost.body.code], [503, 'OUTCOME_UNKNOWN'], 'unknown, not failed');
  eq(db.tables.Location.length, 1, 'committed');
  const early = await submit(db, ticket);
  eq([early.status, early.body.pending], [202, true], 'held while the claim may be alive');
  db.state.clock += LEASE_MS + 1;
  const late = await Promise.all([submit(db, ticket), submit(db, ticket), submit(db, ticket)]);
  eq(db.tables.Location.length, 1, 'still one');
  assert(
    late.some((r) => r.body.duplicate === true) && late.every((r) => r.status === 200),
    'reconciled to the original',
  );
});

Deno.test('tickets: a failure before commit is retried once, after the lease', async () => {
  const db = database();
  const ticket = await reserve(db);
  db.state.faults = ['timeout-before'];
  eq((await submit(db, ticket)).status, 503, 'unknown');
  eq((await submit(db, ticket)).status, 202, 'no early retry');
  eq(db.tables.Location.length, 0, 'nothing yet');
  db.state.clock += LEASE_MS + 1;
  const retries = await Promise.all(Array.from({ length: 6 }, () => submit(db, ticket)));
  eq(db.tables.Location.length, 1, 'one record after takeover');
  eq(retries.filter((r) => r.status === 200 && r.body.duplicate === false).length, 1, 'one winner');
});

Deno.test('tickets: a reused ticket with different content is refused', async () => {
  const db = database();
  const ticket = await reserve(db);
  await submit(db, ticket);
  const changed = await submit(db, ticket, null, payload({ lat: 1 }));
  eq([changed.status, changed.body.code], [409, 'PAYLOAD_MISMATCH'], 'refused');
  eq(db.tables.Location.length, 1, 'unchanged');
  const reordered = Object.fromEntries(Object.entries(payload()).reverse()) as ReturnType<
    typeof payload
  >;
  eq((await submit(db, ticket, null, reordered)).status, 200, 'key order is not a difference');
});

Deno.test('tickets: a definite rejection frees the ticket and is not retryable noise', async () => {
  for (const [fault, status] of [
    ['reject-422', 422],
    ['reject-403', 403],
  ] as const) {
    const db = database();
    const ticket = await reserve(db);
    db.state.faults = [fault];
    eq((await submit(db, ticket)).status, status, fault);
    eq(db.tables.SubmissionTicket[0].state, 'open', 'ticket freed');
    eq((await submit(db, ticket, null, payload({ title: 'fixed' }))).status, 200, 'can fix');
    eq(db.tables.Location.length, 1, 'one record');
  }
});

Deno.test('tickets: ids alone expose nothing and identities cannot be swapped', async () => {
  const db = database();
  const mine = await reserve(db, 'user-a');
  await submit(db, mine, 'user-a');
  for (const [user, operation, expected] of [
    [null, OP, 'IDENTITY_MISMATCH'],
    ['user-b', OP, 'IDENTITY_MISMATCH'],
    ['user-b', 'another-operation-id', 'UNKNOWN_TICKET'],
  ] as const) {
    const result = await submit(db, mine, user, payload({ client_operation_id: operation }));
    eq(result.body.code, expected, `refused ${user}`);
    assert(!JSON.stringify(result.body).includes('Location-'), 'no record data');
  }
  eq((await submit(db, 'SubmissionTicket-999', 'user-a')).status, 404, 'unknown ticket');
  eq(db.tables.Location.length, 1, 'one record');
});

Deno.test('tickets: reservation stores no operation id and no submission content', async () => {
  const db = database();
  await reserve(db);
  const row = JSON.stringify(db.tables.SubmissionTicket[0]);
  assert(!row.includes(OP) && !row.includes('13.7563'), 'hashed and content-free');
});

Deno.test('tickets: storage failure on reserve is an outage, and creates nothing', async () => {
  const response = await handleSubmitOffline(
    new Request('https://example.test/f', {
      method: 'POST',
      body: JSON.stringify({ action: 'reserve', entity_type: 'Location', operation_id: OP }),
    }),
    {
      createClientFromRequest: () => ({
        auth: { me: async () => ({ id: 'u' }) },
        asServiceRole: {
          entities: {
            SubmissionTicket: {
              create: async () => {
                throw new Error('schema unavailable');
              },
            },
          },
        },
      }),
    },
  );
  eq(response.status, 503, 'outage');
});

Deno.test('legacy clients: sequential anonymous replay returns a receipt', async () => {
  const db = database();
  const body = { entity_type: 'Location', payload: payload() };
  await call(db, body);
  const replay = await call(db, body);
  eq(db.tables.Location.length, 1, 'no duplicate on sequential replay');
  eq(
    Object.keys(replay.body.record).sort().join(),
    'id,lat,lng',
    'receipt only (no title or other content)',
  );
});

Deno.test('legacy clients: concurrent sends can still duplicate (documented limit)', async () => {
  const db = database();
  const body = { entity_type: 'Location', payload: payload() };
  await Promise.all([call(db, body), call(db, body), call(db, body)]);
  assert(db.tables.Location.length > 1, 'check-then-create is not atomic');
});
