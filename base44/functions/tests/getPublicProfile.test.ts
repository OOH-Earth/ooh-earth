import { assert, assertEquals } from 'jsr:@std/assert@1';
import { FIELD_RECORD_MAX, handleGetPublicProfile } from '../getPublicProfile/handler.ts';

// Fake store that honours the same filter the handler sends, so a test
// fails if the handler ever stops constraining by owner + verified status.
type Row = Record<string, unknown>;

function fakeEntity(rows: Row[], calls: unknown[][]) {
  return {
    filter: async (query: Row, sort?: string, limit?: number) => {
      calls.push([query, sort, limit]);
      let out = rows.filter((r) => Object.entries(query).every(([k, v]) => r[k] === v));
      if (sort === '-created_date') {
        out = [...out].sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)));
      }
      return typeof limit === 'number' ? out.slice(0, limit) : out;
    },
  };
}

function setup({ users = [] as Row[], locations = [] as Row[], fieldChecks = [] as Row[] } = {}) {
  const locationCalls: unknown[][] = [];
  const client = {
    auth: { me: async () => null },
    asServiceRole: {
      entities: {
        User: fakeEntity(users, []),
        Location: fakeEntity(locations, locationCalls),
        FieldCheck: fakeEntity(fieldChecks, []),
      },
    },
  };
  return { deps: { createClientFromRequest: () => client }, locationCalls };
}

const post = (body: unknown) =>
  new Request('https://example.test/getPublicProfile', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const PUBLIC_USER = {
  id: 'u1',
  handle: 'ada',
  full_name: 'Ada',
  email: 'ada@example.test',
  role: 'admin',
  access: 'x',
  agency: 'y',
  disabled: false,
  is_verified: true,
  collaborator_role: 'editor',
  profile_public: true,
  created_date: '2026-01-02T03:04:05.000Z',
};

function loc(n: number, extra: Row = {}): Row {
  return {
    id: `loc${n}`,
    title: `Place ${n}`,
    type: 'mural',
    status: 'verified',
    created_by_id: 'u1',
    created_date: `2026-05-${String(10 + n).padStart(2, '0')}T12:34:56.000Z`,
    lat: 51.5 + n,
    lng: -0.1,
    address: 'secret street',
    moderation_notes: 'internal',
    ...extra,
  };
}

Deno.test('private profile is indistinguishable from a missing one', async () => {
  const { deps, locationCalls } = setup({
    users: [{ ...PUBLIC_USER, profile_public: false }],
    locations: [loc(1)],
  });
  const res = await handleGetPublicProfile(post({ handle: 'ada' }), deps);
  assertEquals(await res.json(), { found: false });
  assertEquals(locationCalls.length, 0, 'no location query before the profile_public gate');
});

Deno.test('public profile with no contributions returns an empty field record', async () => {
  const { deps } = setup({ users: [PUBLIC_USER] });
  const body = await (await handleGetPublicProfile(post({ handle: '@ada' }), deps)).json();
  assertEquals(body.found, true);
  assertEquals(body.recent_verified_places, []);
  assertEquals(body.contributions, { verified_reports: 0, verified_rechecks: 0 });
});

Deno.test('returns newest verified places first, projected to the allowlist', async () => {
  const { deps } = setup({ users: [PUBLIC_USER], locations: [loc(1), loc(2)] });
  const body = await (await handleGetPublicProfile(post({ handle: 'ada' }), deps)).json();
  assertEquals(body.recent_verified_places, [
    { id: 'loc2', title: 'Place 2', type: 'mural', created_date: '2026-05-12' },
    { id: 'loc1', title: 'Place 1', type: 'mural', created_date: '2026-05-11' },
  ]);
  for (const rec of body.recent_verified_places) {
    assertEquals(Object.keys(rec).sort(), ['created_date', 'id', 'title', 'type']);
  }
});

Deno.test('pending, rejected and other users’ places are excluded', async () => {
  const { deps, locationCalls } = setup({
    users: [PUBLIC_USER],
    locations: [
      loc(1),
      loc(2, { status: 'pending' }),
      loc(3, { status: 'rejected' }),
      loc(4, { created_by_id: 'someone-else' }),
    ],
  });
  const body = await (await handleGetPublicProfile(post({ handle: 'ada' }), deps)).json();
  assertEquals(
    body.recent_verified_places.map((r: Row) => r.id),
    ['loc1'],
  );
  assertEquals(body.contributions.verified_reports, 1);
  assertEquals(locationCalls, [
    [{ created_by_id: 'u1', status: 'verified' }, '-created_date', 500],
  ]);
});

Deno.test(
  'defence in depth: a non-verified row leaking from the store is still dropped',
  async () => {
    const leaky = {
      auth: { me: async () => null },
      asServiceRole: {
        entities: {
          User: { filter: async () => [PUBLIC_USER] },
          Location: { filter: async () => [loc(1, { status: 'pending' }), loc(2)] },
          FieldCheck: { filter: async () => [] },
        },
      },
    };
    const body = await (
      await handleGetPublicProfile(post({ handle: 'ada' }), {
        createClientFromRequest: () => leaky,
      })
    ).json();
    assertEquals(
      body.recent_verified_places.map((r: Row) => r.id),
      ['loc2'],
    );
  },
);

Deno.test('field record is capped while the verified count is not', async () => {
  const many = Array.from({ length: 12 }, (_, i) => loc(i + 1));
  const { deps } = setup({ users: [PUBLIC_USER], locations: many });
  const body = await (await handleGetPublicProfile(post({ handle: 'ada' }), deps)).json();
  assertEquals(FIELD_RECORD_MAX, 5);
  assertEquals(body.recent_verified_places.length, 5);
  assertEquals(body.recent_verified_places[0].id, 'loc12');
  assertEquals(body.contributions.verified_reports, 12);
});

Deno.test('response never carries private user or location fields', async () => {
  const { deps } = setup({ users: [PUBLIC_USER], locations: [loc(1)] });
  const raw = await (await handleGetPublicProfile(post({ handle: 'ada' }), deps)).text();
  for (const needle of [
    '"id":"u1"',
    'ada@example.test',
    '"role"',
    '"access"',
    '"agency"',
    '"disabled"',
    '"is_verified"',
    '"collaborator_role"',
    '"profile_public"',
    '"lat"',
    '"lng"',
    'secret street',
    'moderation_notes',
    'created_by_id',
    '12:34:56',
  ]) {
    assert(!raw.includes(needle), `response leaked ${needle}`);
  }
});

Deno.test('existing profile fields and counts are unchanged', async () => {
  const { deps } = setup({
    users: [{ ...PUBLIC_USER, bio: 'b', region: 'r', focus_areas: ['f'], founding_member: true }],
    locations: [loc(1)],
    fieldChecks: [
      { created_by_id: 'u1', status: 'verified', created_date: '2026-05-01' },
      { created_by_id: 'u1', status: 'pending', created_date: '2026-05-02' },
    ],
  });
  const body = await (await handleGetPublicProfile(post({ handle: 'ada' }), deps)).json();
  assertEquals(body.profile, {
    handle: 'ada',
    full_name: 'Ada',
    avatar_url: '',
    bio: 'b',
    region: 'r',
    focus_areas: ['f'],
    founding_member: true,
    member_since: '2026-01-02T03:04:05.000Z',
  });
  assertEquals(body.contributions, { verified_reports: 1, verified_rechecks: 1 });
  assertEquals(Object.keys(body).sort(), [
    'contributions',
    'found',
    'profile',
    'recent_verified_places',
  ]);
});

Deno.test('malformed location rows are tolerated', async () => {
  const { deps } = setup({
    users: [PUBLIC_USER],
    locations: [loc(1, { title: 42, type: null, created_date: 'garbage' }), loc(2, { id: '' })],
  });
  const body = await (await handleGetPublicProfile(post({ handle: 'ada' }), deps)).json();
  assertEquals(body.recent_verified_places, [
    { id: 'loc1', title: '', type: '', created_date: null },
  ]);
});

Deno.test('location query failure degrades to zero, not an error', async () => {
  const broken = {
    auth: { me: async () => null },
    asServiceRole: {
      entities: {
        User: { filter: async () => [PUBLIC_USER] },
        Location: {
          filter: async () => {
            throw new Error('boom');
          },
        },
        FieldCheck: { filter: async () => [] },
      },
    },
  };
  const res = await handleGetPublicProfile(post({ handle: 'ada' }), {
    createClientFromRequest: () => broken,
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.recent_verified_places, []);
  assertEquals(body.contributions.verified_reports, 0);
});

Deno.test('check mode still returns only taken/mine', async () => {
  const { deps } = setup({ users: [PUBLIC_USER], locations: [loc(1)] });
  const body = await (
    await handleGetPublicProfile(post({ handle: 'ada', mode: 'check' }), deps)
  ).json();
  assertEquals(body, { taken: true, mine: false });
});

Deno.test('method and input guards are unchanged', async () => {
  const { deps } = setup();
  const get = await handleGetPublicProfile(new Request('https://example.test/x'), deps);
  assertEquals(get.status, 405);
  const opt = await handleGetPublicProfile(
    new Request('https://example.test/x', { method: 'OPTIONS' }),
    deps,
  );
  assertEquals(opt.status, 204);
  const empty = await handleGetPublicProfile(post({ handle: '  ' }), deps);
  assertEquals(empty.status, 400);
});
