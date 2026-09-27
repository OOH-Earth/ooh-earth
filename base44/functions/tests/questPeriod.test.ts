import { assert, assertEquals } from 'jsr:@std/assert@1';
import * as server from '../claimQuest/period.ts';
import * as client from '../../../src/lib/questPeriod.js';
import { handleClaimQuest } from '../claimQuest/handler.ts';

// One period definition: the server's (authoritative) and the browser's
// display copy must agree on every instant, in every timezone.

const HOUR = 3_600_000;

Deno.test('server and client period modules agree across two years of instants', () => {
  const start = Date.UTC(2025, 11, 20);
  for (let t = start; t < start + 400 * 24 * HOUR; t += 7 * HOUR + 13 * 60_000) {
    for (const type of ['daily', 'weekly']) {
      assertEquals(client.periodKey(type, t), server.periodKey(type, t), `${type} @ ${t}`);
      assertEquals(client.periodBounds(type, t), server.periodBounds(type, t));
    }
  }
});

Deno.test('offset-less Base44 timestamps are UTC, not local time', () => {
  for (const mod of [server, client]) {
    assertEquals(mod.parseUtc('2026-09-23T06:39:15.543000'), Date.UTC(2026, 8, 23, 6, 39, 15, 543));
    assertEquals(mod.parseUtc('2026-09-23T06:39:15Z'), Date.UTC(2026, 8, 23, 6, 39, 15));
    assertEquals(mod.parseUtc('2026-09-23T08:39:15+02:00'), Date.UTC(2026, 8, 23, 6, 39, 15));
    assert(Number.isNaN(mod.parseUtc('')));
    assert(Number.isNaN(mod.parseUtc(null)));
    assert(Number.isNaN(mod.parseUtc('garbage')));
  }
});

Deno.test('daily period flips exactly at 00:00 UTC', () => {
  assertEquals(server.periodKey('daily', '2026-09-27T23:59:59.999Z'), '2026-09-27');
  assertEquals(server.periodKey('daily', '2026-09-28T00:00:00.000Z'), '2026-09-28');
  // 23:30 in UTC-5 is already the next UTC day; 07:00 in UTC+9 is still the previous.
  assertEquals(server.periodKey('daily', '2026-09-27T23:30:00-05:00'), '2026-09-28');
  assertEquals(server.periodKey('daily', '2026-09-28T07:00:00+09:00'), '2026-09-27');
});

Deno.test('weekly period is the ISO week, Monday 00:00 UTC', () => {
  // Sun 2026-09-27 is in ISO week 39; Mon 2026-09-28 starts week 40.
  assertEquals(server.periodKey('weekly', '2026-09-27T23:59:59.999Z'), '2026-W39');
  assertEquals(server.periodKey('weekly', '2026-09-28T00:00:00.000Z'), '2026-W40');
  const b = server.periodBounds('weekly', '2026-09-30T12:00:00Z')!;
  assertEquals(new Date(b.start).toISOString(), '2026-09-28T00:00:00.000Z');
  assertEquals(new Date(b.end).toISOString(), '2026-10-05T00:00:00.000Z');
  // Year edges: ISO week-year differs from the calendar year.
  assertEquals(server.periodKey('weekly', '2026-12-31T12:00:00Z'), '2026-W53');
  assertEquals(server.periodKey('weekly', '2027-01-03T12:00:00Z'), '2026-W53');
  assertEquals(server.periodKey('weekly', '2027-01-04T00:00:00Z'), '2027-W01');
  assertEquals(server.periodKey('weekly', '2024-12-30T00:00:00Z'), '2025-W01');
});

Deno.test('the old Saturday rollover is gone', () => {
  // Under the previous formula a week rolled over at Saturday 00:00; now
  // Friday and Saturday of the same ISO week share a period.
  assertEquals(
    server.periodKey('weekly', '2026-10-02T23:00:00Z'),
    server.periodKey('weekly', '2026-10-03T01:00:00Z'),
  );
});

Deno.test('completion membership is decided by created_date, key only as fallback', () => {
  const now = '2026-09-30T12:00:00Z'; // ISO 2026-W40
  // Old-formula key "2026-W40" minted on Sat 2026-09-26 (ISO W39) must NOT
  // block this week, even though the key string matches.
  const stale = {
    quest_id: 'weekly_reports',
    period_key: '2026-W40',
    created_date: '2026-09-26T10:00:00.000000',
  };
  assertEquals(server.isCompletionInPeriod(stale, 'weekly_reports', 'weekly', now), false);
  assertEquals(client.isCompletionInPeriod(stale, 'weekly_reports', 'weekly', now), false);
  // A claim earlier this ISO week under any key blocks a re-claim.
  const thisWeek = {
    quest_id: 'weekly_reports',
    period_key: 'anything',
    created_date: '2026-09-28T00:00:01.000000',
  };
  assertEquals(server.isCompletionInPeriod(thisWeek, 'weekly_reports', 'weekly', now), true);
  // No timestamp → fall back to the key.
  assertEquals(
    server.isCompletionInPeriod(
      { quest_id: 'weekly_reports', period_key: '2026-W40' },
      'weekly_reports',
      'weekly',
      now,
    ),
    true,
  );
  assertEquals(server.isCompletionInPeriod(thisWeek, 'daily_report', 'weekly', now), false);
  assertEquals(server.isCompletionInPeriod(null, 'weekly_reports', 'weekly', now), false);
});

Deno.test('msUntilReset counts down to the next UTC boundary', () => {
  assertEquals(server.msUntilReset('daily', '2026-09-27T23:00:00Z'), HOUR);
  assertEquals(client.msUntilReset('weekly', '2026-10-04T22:00:00Z'), 2 * HOUR);
});

function claimClient(user: unknown, rows: { Location?: any[]; QuestCompletion?: any[] }) {
  const created: any[] = [];
  const completions = rows.QuestCompletion ?? [];
  return {
    created,
    client: {
      auth: { me: async () => user },
      asServiceRole: {
        entities: {
          QuestCompletion: {
            filter: async (q: any) =>
              completions
                .filter((c) => Object.entries(q).every(([k, v]) => c[k] === v))
                .sort((a, b) => String(b.created_date).localeCompare(String(a.created_date))),
            create: async (v: any) => created.push(v),
          },
          Location: { filter: async () => rows.Location ?? [] },
          DigitalBust: { filter: async () => [] },
          Mint: { filter: async () => [] },
        },
      },
    },
  };
}

const post = (body: unknown) =>
  new Request('https://example.test', { method: 'POST', body: JSON.stringify(body) });

Deno.test('claimQuest counts a report by its UTC day, not the runtime timezone', async () => {
  // Report at 23:30 UTC Sunday; claim at 00:30 UTC Monday → new day and new week.
  const report = { created_date: '2026-09-27T23:30:00.000000' };
  const { client: c1 } = claimClient({ id: 'u' }, { Location: [report] });
  const monday = await handleClaimQuest(post({ quest_id: 'daily_report' }), {
    createClientFromRequest: () => c1,
    now: () => new Date('2026-09-28T00:30:00Z'),
    inFlight: new Map(),
  });
  assertEquals(monday.status, 403, 'yesterday (UTC) does not satisfy today');

  const { client: c2, created } = claimClient({ id: 'u' }, { Location: [report] });
  const sunday = await handleClaimQuest(post({ quest_id: 'daily_report' }), {
    createClientFromRequest: () => c2,
    now: () => new Date('2026-09-27T23:45:00Z'),
    inFlight: new Map(),
  });
  assertEquals(sunday.status, 200);
  assertEquals(created[0].period_key, '2026-09-27');
  assertEquals(created[0].xp_awarded, 50);
});

Deno.test('claimQuest blocks a re-claim this week made under an old-format key', async () => {
  const reports = Array.from({ length: 5 }, (_, i) => ({
    created_date: `2026-09-2${8 + (i % 2)}T10:00:00.000000`,
  }));
  const { client, created } = claimClient(
    { id: 'u' },
    {
      Location: reports,
      QuestCompletion: [
        {
          quest_id: 'weekly_reports',
          period_key: '2026-W41',
          created_by_id: 'u',
          created_date: '2026-09-29T09:00:00.000000',
        },
      ],
    },
  );
  const res = await handleClaimQuest(post({ quest_id: 'weekly_reports' }), {
    createClientFromRequest: () => client,
    now: () => new Date('2026-09-30T12:00:00Z'),
    inFlight: new Map(),
  });
  assertEquals((await res.json()).already, true);
  assertEquals(created.length, 0);
});

Deno.test(
  'claimQuest allows this week when the only prior claim is a colliding stale key',
  async () => {
    const reports = Array.from({ length: 5 }, () => ({
      created_date: '2026-09-29T10:00:00.000000',
    }));
    const { client, created } = claimClient(
      { id: 'u' },
      {
        Location: reports,
        QuestCompletion: [
          {
            quest_id: 'weekly_reports',
            period_key: '2026-W40',
            created_by_id: 'u',
            created_date: '2026-09-26T09:00:00.000000',
          },
        ],
      },
    );
    const res = await handleClaimQuest(post({ quest_id: 'weekly_reports' }), {
      createClientFromRequest: () => client,
      now: () => new Date('2026-09-30T12:00:00Z'),
      inFlight: new Map(),
    });
    assertEquals(res.status, 200);
    assertEquals(created.length, 1);
    assertEquals(created[0].period_key, '2026-W40');
    assertEquals(created[0].xp_awarded, 200);
  },
);
