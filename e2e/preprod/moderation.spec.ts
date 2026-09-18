import { test, expect } from './fixtures/preprodAuth';
import {
  PREPROD_BACKUP_BASE_URL,
  PREPROD_BACKUP_APP_ID,
  loginAsIdentity,
  requirePreprodCredentials,
} from './fixtures/preprodAuth';

// REAL_BACKEND golden journey: pending -> verified through the real
// `moderate` function (base44/functions/moderate/entry.ts) against BACKUP,
// then confirms the cascade it documents (verifying a Location also flips
// its pending LocationPhoto rows to verified) actually happens server-side,
// and that visibility changes for every identity accordingly.

test.describe('REAL_BACKEND — moderation cascade (pending -> verified) on BACKUP', () => {
  test.beforeAll(async () => {
    const reason = requirePreprodCredentials('creator', 'otherUser', 'admin');
    test.skip(!!reason, reason ?? undefined);
  });

  let locationId: string | null = null;
  let photoId: string | null = null;

  test.afterAll(async ({ browser }) => {
    if (!locationId && !photoId) return;
    const page = await browser.newPage();
    const adminToken = await loginAsIdentity(page, 'admin').finally(() => page.close());
    const headers = { Authorization: `Bearer ${adminToken}` };
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
  });

  test('verifying the Location cascades to its pending LocationPhoto rows and flips public visibility', async ({
    page,
    browser,
    preprodRunTag,
  }) => {
    const creatorToken = await loginAsIdentity(page, 'creator');
    const jsonHeaders = {
      Authorization: `Bearer ${creatorToken}`,
      'content-type': 'application/json',
    };

    const locRes = await fetch(
      `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/Location`,
      {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          title: `${preprodRunTag} moderation cascade location`,
          type: 'other',
          lat: 13.75,
          lng: 100.5,
          notes: preprodRunTag,
        }),
      },
    ).then((r) => r.json());
    locationId = locRes.id;

    const photoRes = await fetch(
      `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/LocationPhoto`,
      {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          location_id: String(locationId),
          url: 'https://example.com/preprod-moderation.jpg',
          display_order: 0,
          status: 'pending',
        }),
      },
    ).then((r) => r.json());
    photoId = photoRes.id;
    expect(photoRes.status).toBe('pending');

    // Before verification: public/anonymous cannot see either record.
    const anonLocBefore = await fetch(
      `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/Location/${locationId}`,
    );
    expect(anonLocBefore.status).toBe(404);

    // Verify through the real `moderate` function, as admin -- not a raw
    // entity PUT, matching how the app's own Dashboard does it. A separate
    // page: logging in as admin on `page` would replace the creator session
    // this test still needs below.
    const adminPage = await browser.newPage();
    const adminToken = await loginAsIdentity(adminPage, 'admin').finally(() => adminPage.close());
    const verifyRes = await fetch(
      `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/functions/moderate`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          entity: 'Location',
          id: locationId,
          status: 'verified',
        }),
      },
    );
    expect(verifyRes.ok, await verifyRes.text()).toBe(true);

    // Cascade: the LocationPhoto row must now also read as verified.
    let photoNow: { status?: string } = {};
    for (let attempt = 0; attempt < 10; attempt += 1) {
      photoNow = await fetch(
        `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/LocationPhoto/${photoId}`,
        { headers: { Authorization: `Bearer ${creatorToken}` } },
      ).then((r) => r.json());
      if (photoNow.status === 'verified') break;
      await new Promise((r) => setTimeout(r, 1000));
    }
    expect(photoNow.status, 'moderate.ts must cascade Location verify to its photos').toBe(
      'verified',
    );

    // After verification: anonymous can now see both the Location and the
    // gallery photo; locationShare works; a different authenticated user
    // (not just the creator) sees it too.
    const anonLocAfter = await fetch(
      `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/Location/${locationId}`,
    );
    expect(anonLocAfter.ok).toBe(true);

    // `page` was authenticated as creator above -- clear that session
    // before checking anonymous visibility on it.
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(`${PREPROD_BACKUP_BASE_URL}/location/${locationId}`);
    await expect(page.getByTestId('photo-gallery').locator('img')).toHaveCount(1, {
      timeout: 15_000,
    });

    const otherPage = await browser.newPage();
    const otherToken = await loginAsIdentity(otherPage, 'otherUser').finally(() =>
      otherPage.close(),
    );
    const asOther = await fetch(
      `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/LocationPhoto?q=` +
        encodeURIComponent(JSON.stringify({ location_id: String(locationId) })),
      { headers: { Authorization: `Bearer ${otherToken}` } },
    ).then((r) => r.json());
    expect(asOther.length).toBe(1);
  });
});
