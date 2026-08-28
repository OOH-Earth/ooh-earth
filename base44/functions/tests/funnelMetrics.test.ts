import { handleFunnelMetrics } from '../funnelMetrics/handler.ts';

const assertEquals = (actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

function request(body: Record<string, unknown>) {
  return new Request('https://oohearth.app/api/functions/funnelMetrics', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://oohearth.app' },
    body: JSON.stringify(body),
  });
}

function deps(caller: any = null) {
  const rows: any[] = [];
  const entity = {
    async filter(query: any) {
      if (query.day?.$lt) return [];
      return rows.filter((row) => Object.entries(query).every(([key, value]) => row[key] === value));
    },
    async create(record: any) {
      const row = { ...record, id: `row-${rows.length + 1}` };
      rows.push(row);
      return row;
    },
    async update(id: string, update: any) {
      const row = rows.find((item) => item.id === id);
      for (const [key, value] of Object.entries(update.$inc || {})) row[key] = (row[key] || 0) + Number(value);
      return row;
    },
    async delete(id: string) {
      const index = rows.findIndex((row) => row.id === id);
      if (index >= 0) rows.splice(index, 1);
    },
  };
  return {
    rows,
    createClientFromRequest: () => ({
      auth: { me: async () => caller },
      asServiceRole: { entities: { FunnelAggregate: entity } },
    }),
    now: () => new Date('2026-08-28T12:00:00.000Z'),
  };
}

Deno.test('funnel ingest stores only bounded aggregate counters', async () => {
  const d = deps();
  const response = await handleFunnelMetrics(
    request({
      event_name: 'map_engaged',
      source: 'github',
      medium: 'referral',
      campaign: 'github_readme',
      landing_path: '/blog/transit-advertising-public-space-evidence',
      email: 'must-be-rejected',
    }),
    d,
  );
  assertEquals(response.status, 400);
  assertEquals(d.rows.length, 0);

  const accepted = await handleFunnelMetrics(
    request({
      event_name: 'map_engaged',
      source: 'github',
      medium: 'referral',
      campaign: 'github_readme',
      landing_path: '/blog/transit-advertising-public-space-evidence',
    }),
    d,
  );
  assertEquals(accepted.status, 200);
  assertEquals(d.rows[0].count, 1);
  assertEquals(d.rows[0].synthetic_count, 0);
  assertEquals(
    (await handleFunnelMetrics(
      request({ event_name: 'unknown', source: 'github', medium: 'referral', campaign: 'github_readme' }),
      d,
    )).status,
    400,
  );
});

Deno.test('anonymous aggregate read is denied and synthetic counts stay separate', async () => {
  const anonymous = deps();
  assertEquals((await handleFunnelMetrics(request({ action: 'read' }), anonymous)).status, 403);

  const d = deps({ role: 'admin' });

  const accepted = await handleFunnelMetrics(
    request({
      event_name: 'qualified_visit',
      source: 'synthetic_test',
      medium: 'verification',
      campaign: 'aggregate_roundtrip',
      landing_path: '/map',
    }),
    d,
  );
  assertEquals(accepted.status, 200);
  const read = await handleFunnelMetrics(request({ action: 'read' }), d);
  assertEquals(read.status, 200);
  assertEquals((await read.json()).records[0].qualified_visits, 0);
  assertEquals((await handleFunnelMetrics(request({ event_name: 'payment_confirmed', source: 'github', medium: 'referral', campaign: 'github_readme' }), d)).status, 400);
});
