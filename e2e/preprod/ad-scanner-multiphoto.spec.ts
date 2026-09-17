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

// REAL_BACKEND golden journey for the Ad Scanner multi-photo flow --
// this is the exact flow behind the production incident PR #256 fixed
// (location 6aabfdc021a942360f9b7e4a). Every entity read/write in this file
// is real, against BACKUP. The one deliberate exception: the scanAd
// function call is intercepted with a fixed, deterministic response.
//
// Why: scanAd calls a real LLM. Running that on every pre-production
// pipeline execution would (a) spend real external money on every merge to
// main, and (b) make this test's pass/fail depend on a nondeterministic AI
// response instead of the thing actually being tested here -- multi-photo
// upload, cover semantics, and LocationPhoto/Location persistence &
// visibility. That AI *contract* (does scanAd still return the shape
// AdScanLab.jsx expects) is a different, narrower concern than this file's
// scope and belongs in its own deliberately-run, cost-aware check if it's
// ever needed -- not folded into every pipeline run silently.
test.describe('REAL_BACKEND — Ad Scanner multi-photo golden journey', () => {
  test.beforeAll(async () => {
    const reason = requirePreprodCredentials('creator');
    test.skip(!!reason, reason ?? undefined);
  });

  let locationId: string | null = null;

  test.afterAll(async ({ browser }) => {
    if (!locationId) return;
    const page = await browser.newPage();
    const creatorToken = await loginAsIdentity(page, 'creator').finally(() => page.close());
    await fetch(
      `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/Location/${locationId}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${creatorToken}` } },
    ).catch(() => {});
  });

  test('cover + 2 extras persist for real, creator sees all 3 after a hard reload, AI review stays editable', async ({
    page,
    browser,
    preprodRunTag,
  }) => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const IMG1 = path.join(__dirname, '..', 'fixtures', 'test-image.png');
    const IMG2 = path.join(__dirname, '..', 'fixtures', 'test-image-2.png');

    // The ONE deliberate mock in this file -- see the file-level comment.
    // Everything else (UploadFile, Location, LocationPhoto) hits BACKUP for
    // real.
    await page.route('**/functions/scanAd', (route) =>
      route.fulfill({
        json: {
          detection: {
            is_advertising: true,
            brand_name: 'Preprod Test Brand',
            campaign_name: preprodRunTag,
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
      .setInputFiles([IMG1, IMG2, IMG1]);
    await expect(page.locator('div:has(> button[aria-label="Remove photo"])')).toHaveCount(3);

    await page.getByRole('button', { name: /Run detection/i }).click();
    await expect(page.getByLabel('Brand', { exact: true })).toHaveValue('Preprod Test Brand');

    // AI review stays editable -- prove it by actually editing before
    // cataloging, and that the edit (not the AI value) is what persists.
    await page.getByLabel('Brand', { exact: true }).fill(`${preprodRunTag} edited brand`);

    await page.getByText('Enter coordinates manually').click();
    await page.getByPlaceholder('Latitude').fill('13.75');
    await page.getByPlaceholder('Longitude').fill('100.50');
    await page.getByRole('button', { name: /Catalog to atlas/i }).click();
    await expect(page.getByText('Cataloged to atlas').first()).toBeVisible({ timeout: 20_000 });

    const detailHref = await page.getByRole('link', { name: /page ·/i }).getAttribute('href');
    expect(detailHref).toBeTruthy();
    locationId = detailHref!.split('/').pop()!;

    const creatorToken = await loginAsIdentity(page, 'creator'); // cached, already logged in
    const loc = await fetch(
      `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/Location/${locationId}`,
      { headers: { Authorization: `Bearer ${creatorToken}` } },
    ).then((r) => r.json());
    // The edited value won, not the AI's original "Preprod Test Brand".
    expect(loc.brand_name).toBe(`${preprodRunTag} edited brand`);

    let photos: unknown[] = [];
    for (let attempt = 0; attempt < 10; attempt += 1) {
      photos = await fetch(
        `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/LocationPhoto?q=` +
          encodeURIComponent(JSON.stringify({ location_id: String(locationId) })),
        { headers: { Authorization: `Bearer ${creatorToken}` } },
      ).then((r) => r.json());
      if (photos.length >= 2) break;
      await new Promise((r) => setTimeout(r, 1000));
    }
    expect(photos.length, 'both extras must persist as real LocationPhoto rows').toBe(2);

    // Hard reload (not a client-side Link navigation) as the already-
    // authenticated creator -- proves persistence against the backend
    // itself, and proves the exact regression PR #256 fixed stays fixed on
    // the real deployed code.
    await page.goto(`${PREPROD_BACKUP_BASE_URL}/location/${locationId}`);
    await expect(page.getByTestId('photo-gallery').locator('img')).toHaveCount(3, {
      timeout: 15_000,
    });

    // Stronger persistence proof: a brand-new browser context (no shared
    // cookies/localStorage with `page` at all -- not just a fresh
    // navigation) logging in from scratch sees the identical state. This is
    // what "the data survived, this wasn't just client-side cache" actually
    // means.
    const freshContext = await browser.newContext();
    try {
      const freshPage = await freshContext.newPage();
      await gotoAsIdentity(freshPage, `/location/${locationId}`, 'creator');
      await expect(freshPage.getByTestId('photo-gallery').locator('img')).toHaveCount(3, {
        timeout: 15_000,
      });
    } finally {
      await freshContext.close();
    }
  });
});
