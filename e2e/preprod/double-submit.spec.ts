import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures/preprodAuth';
import {
  PREPROD_BACKUP_BASE_URL,
  PREPROD_BACKUP_APP_ID,
  gotoAsIdentity,
  loginAsIdentity,
  requirePreprodCredentials,
} from './fixtures/preprodAuth';

// REAL_BACKEND regression test for the double-submit defect fixed in PR
// #257 (a useRef reentrancy guard in AdScanLab.jsx's catalogLocation()).
// The hermetic version (e2e/ad-scanner-resilience.spec.ts) proved the
// client-side guard closes the race by dispatching two native click events
// in the same task against a mocked backend. This file proves the same
// scenario end to end against the actually-deployed BACKUP app: real
// upload, real scanAd-shaped response (scanAd itself mocked -- see
// ad-scanner-multiphoto.spec.ts's file comment for why), and a real
// Location.create() race against BACKUP's actual API, not a mock route
// handler.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG1 = path.join(__dirname, 'fixtures', 'test-image.png');

test.describe('REAL_BACKEND — double-submit does not create duplicate Locations', () => {
  test.beforeAll(async () => {
    const reason = requirePreprodCredentials('creator');
    test.skip(!!reason, reason ?? undefined);
  });

  let locationIds: string[] = [];

  test.afterAll(async ({ browser }) => {
    if (!locationIds.length) return;
    const page = await browser.newPage();
    const creatorToken = await loginAsIdentity(page, 'creator').finally(() => page.close());
    await Promise.all(
      locationIds.map((id) =>
        fetch(
          `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/Location/${id}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${creatorToken}` },
          },
        ).catch(() => {}),
      ),
    );
  });

  test('two native clicks on "Catalog to atlas" in the same task create exactly one real Location on BACKUP', async ({
    page,
    preprodRunTag,
  }) => {
    await page.route('**/functions/scanAd', (route) =>
      route.fulfill({
        json: {
          detection: {
            is_advertising: true,
            brand_name: `${preprodRunTag} double-submit brand`,
            surface_type: 'billboard',
            industry_sector: 'other',
            confidence: 0.9,
          },
        },
      }),
    );

    await gotoAsIdentity(page, '/lab/scanner', 'creator');
    await expect(page.getByRole('heading', { name: /Ad Scanner/i })).toBeVisible();

    await page
      .getByRole('button', { name: 'Upload images' })
      .locator('input[type="file"]')
      .setInputFiles([IMG1]);
    await page.getByRole('button', { name: /Run detection/i }).click();
    await expect(page.getByLabel('Brand', { exact: true })).toHaveValue(
      `${preprodRunTag} double-submit brand`,
    );
    await page.getByText('Enter coordinates manually').click();
    await page.getByPlaceholder('Latitude').fill('13.75');
    await page.getByPlaceholder('Longitude').fill('100.50');

    // Same technique as the hermetic version: two native click events
    // dispatched synchronously in one task, so both reach React's onClick
    // before a re-render can apply disabled={cataloging}. This is the
    // realistic "fast double-click/double-tap" scenario, not an artificial
    // one -- see e2e/ad-scanner-resilience.spec.ts for the full reasoning.
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find((el) =>
        /Catalog to atlas/i.test(el.textContent || ''),
      );
      if (!button) throw new Error('Catalog to atlas button not found');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    await expect(page.getByText('Cataloged to atlas').first()).toBeVisible({ timeout: 20_000 });

    const creatorToken = await loginAsIdentity(page, 'creator');
    // Query the real backend directly for every Location this run's tag
    // could have produced -- proves the assertion against BACKUP's actual
    // stored state, not just what the UI displays.
    const found = await fetch(
      `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/Location?q=` +
        encodeURIComponent(JSON.stringify({ brand_name: `${preprodRunTag} double-submit brand` })),
      { headers: { Authorization: `Bearer ${creatorToken}` } },
    ).then((r) => r.json());
    locationIds = found.map((rec: { id: string }) => rec.id);

    expect(found.length, 'exactly one real Location must exist for this run, not two').toBe(1);

    const photos = await fetch(
      `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/LocationPhoto?q=` +
        encodeURIComponent(JSON.stringify({ location_id: String(found[0].id) })),
      { headers: { Authorization: `Bearer ${creatorToken}` } },
    ).then((r) => r.json());
    expect(photos.length, 'no duplicate gallery rows from the double dispatch').toBe(0); // single-photo submission here, no extras expected
  });
});
