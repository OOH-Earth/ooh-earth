import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures/preprodAuth';
import {
  PREPROD_BACKUP_BASE_URL,
  PREPROD_BACKUP_APP_ID,
  gotoAsIdentity,
  preprodToken,
  requirePreprodTokens,
} from './fixtures/preprodAuth';

// REAL_BACKEND golden journey: /report (FieldReport.jsx) multi-photo submit
// against the actually-deployed BACKUP app. No entity mocking. This proves
// what e2e/multi-photo-upload.spec.ts (hermetic) cannot: that the real
// Base44 backend actually persists a cover + extras the way the mock
// assumes it does, and that real RLS actually grants/denies the way
// e2e/contracts/entityRls.spec.ts assumes it does.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG1 = path.join(__dirname, '..', 'fixtures', 'test-image.png');
const IMG2 = path.join(__dirname, '..', 'fixtures', 'test-image-2.png');

test.describe('REAL_BACKEND — /report multi-photo golden journey', () => {
  test.beforeAll(async () => {
    const reason = requirePreprodTokens('creator', 'otherUser');
    test.skip(!!reason, reason ?? undefined);
  });

  let locationId: string | null = null;

  test.afterAll(async () => {
    const creatorToken = preprodToken('creator');
    if (!creatorToken || !locationId) return;
    // Photos cascade-delete is not guaranteed by the API; clean up what we
    // can reach with the creator's own token (LocationPhoto delete is
    // admin-only per LocationPhoto.jsonc, so extras created here are left
    // for an admin-token cleanup pass -- see e2e/preprod/cleanup.mjs, which
    // is the sanctioned mechanism for that, run out-of-band with an admin
    // token rather than duplicated inline here).
    await fetch(
      `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/Location/${locationId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${creatorToken}` },
      },
    ).catch(() => {});
  });

  test('creator: cover + extras persist, creator sees pending extras after reload; other user does not', async ({
    page,
    preprodRunTag,
  }) => {
    await gotoAsIdentity(page, '/report', 'creator');
    await expect(page.getByRole('heading', { name: /Adbusting/i })).toBeVisible();

    // Cover photo.
    const coverInput = page.locator('input[type="file"]:not([multiple])').first();
    await coverInput.setInputFiles(IMG1);

    // Extras.
    await page.locator('input[type="file"][multiple]').setInputFiles([IMG2]);

    // Minimum required fields to submit -- see FieldReport.jsx's own
    // validation; exact field labels kept in sync with that form.
    await page.getByLabel(/Notes/i).fill(`${preprodRunTag} real-backend report multi-photo test`);
    // Location/coordinates: reuse whatever default the form seeds (GPS
    // permission is not available in CI) via its manual-entry path.
    const manualEntry = page.getByText(/Enter coordinates manually/i);
    if (await manualEntry.isVisible().catch(() => false)) {
      await manualEntry.click();
      await page.getByPlaceholder('Latitude').fill('13.75');
      await page.getByPlaceholder('Longitude').fill('100.50');
    }

    await page.getByRole('button', { name: /Submit|Transmit|File report/i }).click();
    await expect(page.getByText(/received|submitted|transmission/i).first()).toBeVisible({
      timeout: 20_000,
    });

    // Find the created Location by its unique tag in notes (real backend --
    // no client-side request interception to read the POST body from).
    const creatorToken = preprodToken('creator')!;
    const found = await fetch(
      `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/Location?q=` +
        encodeURIComponent(
          JSON.stringify({ notes: `${preprodRunTag} real-backend report multi-photo test` }),
        ),
      { headers: { Authorization: `Bearer ${creatorToken}` } },
    ).then((r) => r.json());
    expect(found.length, 'the submitted Location must exist').toBe(1);
    locationId = found[0].id;
    expect(found[0].image_url).toBeTruthy();

    // Extras attach asynchronously after the Location exists (FieldReport's
    // own documented behavior) -- poll briefly for the LocationPhoto row.
    let photos: unknown[] = [];
    for (let attempt = 0; attempt < 10; attempt += 1) {
      photos = await fetch(
        `${PREPROD_BACKUP_BASE_URL}/api/apps/${PREPROD_BACKUP_APP_ID}/entities/LocationPhoto?q=` +
          encodeURIComponent(JSON.stringify({ location_id: String(locationId) })),
        { headers: { Authorization: `Bearer ${creatorToken}` } },
      ).then((r) => r.json());
      if (photos.length > 0) break;
      await new Promise((r) => setTimeout(r, 1000));
    }
    expect(photos.length, 'the extra photo must persist as a real LocationPhoto row').toBe(1);
    expect((photos[0] as { status: string }).status).toBe('pending');

    // Creator reloads and sees the extra in the gallery (the exact
    // behavior PR #256 fixed).
    await page.goto(
      `${PREPROD_BACKUP_BASE_URL}/location/${locationId}?access_token=${creatorToken}`,
    );
    await expect(page.getByTestId('photo-gallery').locator('img')).toHaveCount(2, {
      timeout: 15_000,
    });

    // A different authenticated user reloading the same page must NOT see
    // the pending extra (only the cover, via loc.image_url which isn't
    // gated the same way).
    const otherToken = preprodToken('otherUser')!;
    await page.goto(`${PREPROD_BACKUP_BASE_URL}/location/${locationId}?access_token=${otherToken}`);
    await expect(page.getByTestId('photo-gallery').locator('img')).toHaveCount(1, {
      timeout: 15_000,
    });
  });
});
