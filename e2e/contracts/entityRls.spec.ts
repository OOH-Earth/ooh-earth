import { test, expect } from '@playwright/test';
import { canReadEntity, loadReadRls } from '../fixtures/rlsEngine';
import { mockBase44, ADMIN_USER } from '../fixtures/mockBase44';

// Contract tests for base44/entities/*.jsonc read RLS. These do NOT drive a
// browser for most cases -- they evaluate the actual parsed .jsonc rule
// against a golden creator/other-user/anonymous/admin x pending/verified/
// rejected matrix. No page, no mock, no app code: if this file goes red,
// either a .jsonc RLS block changed incompatibly or rlsEngine.ts's
// interpretation of it is wrong -- either way, something that gates real
// user data visibility changed, and this is the file meant to catch it
// before a PhotoGallery.jsx-style client bug can hide behind it silently.
//
// Context: the Ad Scanner multi-photo regression (production location
// 6aabfdc021a942360f9b7e4a, 2026-09-17) happened because PhotoGallery.jsx
// re-filtered LocationPhoto rows to status==='verified' on top of RLS that
// already correctly gated them, and e2e/fixtures/mockBase44.ts had no RLS
// concept at all to disagree with that client bug. This file exists so a
// *future* incompatible RLS change, or a future reintroduction of that
// class of client bug, has somewhere structural to fail.

const CREATOR = { id: 'creator-1', role: 'user', access: 'member' };
const OTHER_USER = { id: 'other-2', role: 'user', access: 'member' };
const ANONYMOUS = null;
const MODERATOR_ACCESS_ONLY = { id: 'mod-3', role: 'user', access: 'moderator' };

const MODERATED_ENTITIES = ['Location', 'LocationPhoto', 'FieldCheck', 'DigitalBust'] as const;

function recordWithStatus(status: string, ownerId: string) {
  return { id: 'rec-1', status, created_by_id: ownerId };
}

test.describe('Entity read RLS contract — base44/entities/*.jsonc', () => {
  for (const entity of MODERATED_ENTITIES) {
    test.describe(entity, () => {
      test('creator can read their own pending record', () => {
        const rec = recordWithStatus('pending', CREATOR.id);
        expect(canReadEntity(entity, rec, CREATOR)).toBe(true);
      });

      test('creator can read their own rejected record', () => {
        const rec = recordWithStatus('rejected', CREATOR.id);
        expect(canReadEntity(entity, rec, CREATOR)).toBe(true);
      });

      test('anonymous cannot read a pending record', () => {
        const rec = recordWithStatus('pending', CREATOR.id);
        expect(canReadEntity(entity, rec, ANONYMOUS)).toBe(false);
      });

      test('anonymous cannot read a rejected record', () => {
        const rec = recordWithStatus('rejected', CREATOR.id);
        expect(canReadEntity(entity, rec, ANONYMOUS)).toBe(false);
      });

      test('anonymous CAN read a verified record — public visibility', () => {
        const rec = recordWithStatus('verified', CREATOR.id);
        expect(canReadEntity(entity, rec, ANONYMOUS)).toBe(true);
      });

      test("a different authenticated user cannot read another creator's pending record", () => {
        const rec = recordWithStatus('pending', CREATOR.id);
        expect(canReadEntity(entity, rec, OTHER_USER)).toBe(false);
      });

      test("a different authenticated user cannot read another creator's rejected record", () => {
        const rec = recordWithStatus('rejected', CREATOR.id);
        expect(canReadEntity(entity, rec, OTHER_USER)).toBe(false);
      });

      test('a different authenticated user CAN read a verified record — public visibility', () => {
        const rec = recordWithStatus('verified', CREATOR.id);
        expect(canReadEntity(entity, rec, OTHER_USER)).toBe(true);
      });

      test('role:admin can read a pending record regardless of ownership', () => {
        const rec = recordWithStatus('pending', CREATOR.id);
        expect(canReadEntity(entity, rec, ADMIN_USER)).toBe(true);
      });

      test('role:admin can read a rejected record regardless of ownership', () => {
        const rec = recordWithStatus('rejected', CREATOR.id);
        expect(canReadEntity(entity, rec, ADMIN_USER)).toBe(true);
      });

      // This is the precise nuance that a hand-rolled "isAdmin" predicate
      // got wrong in an earlier version of this mock: the actual RLS rule's
      // user_condition only checks role==='admin', not data.access. A
      // moderator/operative (access-level clearance, not the in-app User
      // role) sees the moderation queue through the `moderate` function's
      // service-role bypass, not through raw entity RLS -- so a
      // moderator-access, non-admin-role user must NOT be able to read a
      // pending record via a raw entity fetch.
      test("access:moderator without role:admin cannot read another creator's pending record via raw entity RLS", () => {
        const rec = recordWithStatus('pending', CREATOR.id);
        expect(canReadEntity(entity, rec, MODERATOR_ACCESS_ONLY)).toBe(false);
      });

      test('the read rule is a real $or with exactly the expected three branches', () => {
        const rule = loadReadRls(entity) as { $or?: Record<string, unknown>[] } | null;
        expect(rule).not.toBeNull();
        expect(rule?.$or).toBeDefined();
        expect(rule?.$or?.length).toBe(3);
        const flat = rule!.$or!.map((branch) => JSON.stringify(branch));
        expect(flat).toContain(JSON.stringify({ 'data.status': 'verified' }));
        expect(flat).toContain(JSON.stringify({ created_by_id: '{{user.id}}' }));
        expect(flat).toContain(JSON.stringify({ user_condition: { role: 'admin' } }));
      });
    });
  }
});

test.describe('mockBase44 LocationPhoto fidelity — mock must agree with the RLS engine', () => {
  // Unlike the pure-engine tests above, these drive the mock's actual network
  // route handler end to end (via a page + real entity SDK call), proving
  // mockBase44.ts's LocationPhoto GET handler doesn't just claim to use
  // canReadEntity() but actually enforces it over the wire.
  test('creator sees their own pending row; a different user and anonymous do not', async ({
    page,
  }) => {
    const pendingRow = {
      id: 'photo-1',
      location_id: 'loc-1',
      status: 'pending',
      created_by_id: CREATOR.id,
      url: 'https://example.com/pending.jpg',
      display_order: 0,
    };

    async function fetchAsUser(user: Record<string, unknown> | null) {
      // page.route() handlers run most-recently-registered-first, so each
      // call here overrides the previous scenario's mock for this page.
      await mockBase44(page, { user, locations: {}, locationPhotos: [pendingRow] });
      return page.evaluate(async () => {
        const res = await fetch(
          '/api/apps/mock-app/entities/LocationPhoto?q=' +
            encodeURIComponent(JSON.stringify({ location_id: 'loc-1' })),
        );
        return res.json();
      });
    }

    // mockBase44 must be registered before the app's own boot-time fetches
    // fire, so the initial navigation itself doesn't hit a real network.
    await mockBase44(page, { user: CREATOR, locations: {}, locationPhotos: [pendingRow] });
    await page.goto('/');

    const asCreator = await fetchAsUser(CREATOR);
    expect(asCreator).toHaveLength(1);

    const asOther = await fetchAsUser(OTHER_USER);
    expect(asOther).toHaveLength(0);

    const asAnonymous = await fetchAsUser(null);
    expect(asAnonymous).toHaveLength(0);

    const asAdmin = await fetchAsUser(ADMIN_USER);
    expect(asAdmin).toHaveLength(1);
  });
});
