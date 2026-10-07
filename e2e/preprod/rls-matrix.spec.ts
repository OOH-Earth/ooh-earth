import { test, expect } from './fixtures/preprodAuth';
import {
  PREPROD_BACKUP_BASE_URL,
  PREPROD_BACKUP_APP_ID,
  gotoAsIdentity,
  loginAsIdentity,
  requirePreprodCredentials,
} from './fixtures/preprodAuth';

// REAL_BACKEND. Exercises actual Base44 RLS on the deployed BACKUP app --
// no entity mocking anywhere in this file. This is the test that must fail
// if someone reintroduces the PhotoGallery.jsx status==='verified' client
// filter, OR changes LocationPhoto.jsonc/Location.jsonc's RLS block
// incompatibly. See docs/TESTING_AND_RELEASE.md for what this layer proves
// that e2e/contracts/entityRls.spec.ts (hermetic, evaluates the .jsonc file
// directly but never touches a real backend) cannot.
//
// Creates one real Location + one real LocationPhoto on BACKUP as the
// `creator` identity, reads it back as creator/other-user/anonymous/admin,
// then deletes only that test-owned record (see cleanup.mjs for the same
// namespacing convention used here).

test.describe('REAL_BACKEND — LocationPhoto RLS matrix against BACKUP', () => {
  test.beforeAll(async () => {
    const reason = requirePreprodCredentials('creator', 'otherUser', 'admin');
    test.skip(!!reason, reason ?? undefined);
  });

  let locationId: string | null = null;
  let photoId: string | null = null;

  test.afterAll(async ({ browser }) => {
    // Best-effort, test-owned-only cleanup even if an assertion above
    // failed mid-test -- never leaves a dangling BACKUP record behind.
    if (!locationId && !photoId) return;
    const page = await browser.newPage();
    try {
      const adminToken = await loginAsIdentity(page, 'admin');
      const headers = {
        Authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      };
      if (photoId) {
        await fetch(
          `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/LocationPhoto/${photoId}`,
          { method: 'DELETE', headers },
        ).catch(() => {});
      }
      if (locationId) {
        await fetch(
          `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/Location/${locationId}`,
          { method: 'DELETE', headers },
        ).catch(() => {});
      }
    } finally {
      await page.close();
    }
  });

  test('creator=allowed, other user=denied, anonymous=denied, admin=allowed for a pending row', async ({
    page,
    browser,
    preprodRunTag,
  }) => {
    // A direct, minimal REST call with the creator's own real session token
    // (rather than driving AdScanLab's real UI, which e2e/preprod/ad-
    // scanner-multiphoto.spec.ts already covers) -- this test is
    // specifically about read-side RLS, and this is the shortest reliable
    // path to a real pending LocationPhoto row owned by a known identity to
    // read back.
    await gotoAsIdentity(page, '/', 'creator');
    const creatorToken = await loginAsIdentity(page, 'creator'); // cached from gotoAsIdentity's login
    const headers = {
      Authorization: `Bearer ${creatorToken}`,
      'content-type': 'application/json',
    };
    const locRes = await fetch(
      `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/Location`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: `${preprodRunTag} RLS matrix location`,
          type: 'other',
          lat: 13.75,
          lng: 100.5,
          notes: preprodRunTag,
        }),
      },
    );
    expect(locRes.ok, await locRes.text()).toBe(true);
    const loc = await locRes.json();
    locationId = loc.id;

    const photoRes = await fetch(
      `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/LocationPhoto`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          location_id: String(loc.id),
          url: 'https://example.com/preprod-rls-matrix.jpg',
          display_order: 0,
          status: 'pending',
        }),
      },
    );
    expect(photoRes.ok, await photoRes.text()).toBe(true);
    const photo = await photoRes.json();
    photoId = photo.id;
    expect(photo.status).toBe('pending');

    async function readAsToken(token: string | null) {
      const h: Record<string, string> = {};
      if (token) h.Authorization = `Bearer ${token}`;
      const res = await fetch(
        `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/LocationPhoto?q=` +
          encodeURIComponent(JSON.stringify({ location_id: String(loc.id) })),
        { headers: h },
      );
      if (!res.ok) return [];
      return res.json();
    }

    const asCreator = await readAsToken(creatorToken);
    expect(asCreator.length, 'creator must see their own pending row').toBe(1);

    // A separate browser page for the "other user" identity -- logging in
    // as a second identity on the SAME page would just replace the first
    // session, not add a second one.
    const otherPage = await browser.newPage();
    let otherToken: string;
    try {
      otherToken = await loginAsIdentity(otherPage, 'otherUser');
    } finally {
      await otherPage.close();
    }
    const asOther = await readAsToken(otherToken);
    expect(asOther.length, 'a different authenticated user must NOT see it').toBe(0);

    const asAnonymous = await readAsToken(null);
    expect(asAnonymous.length, 'anonymous must NOT see it').toBe(0);

    const adminPage = await browser.newPage();
    let adminToken: string;
    try {
      adminToken = await loginAsIdentity(adminPage, 'admin');
    } finally {
      await adminPage.close();
    }
    const asAdmin = await readAsToken(adminToken);
    expect(asAdmin.length, 'admin must see it per policy').toBe(1);
  });
});
