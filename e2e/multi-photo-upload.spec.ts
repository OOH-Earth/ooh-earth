import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG1 = path.join(__dirname, 'fixtures', 'test-image.png');
const IMG2 = path.join(__dirname, 'fixtures', 'test-image-2.png');
const IMAGE_BYTES = fs.readFileSync(IMG1);

function imageBatch(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    name: `field-photo-${index + 1}.png`,
    mimeType: 'image/png',
    buffer: IMAGE_BYTES,
  }));
}

function trackConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

async function shot(
  page: import('@playwright/test').Page,
  testInfo: import('@playwright/test').TestInfo,
  name: string,
) {
  await page.screenshot({
    path: `e2e/screenshots/${testInfo.project.name}/${name}.png`,
    fullPage: true,
  });
}

test.describe('FieldReport (/report) — multi-photo upload', () => {
  test('real FileList path supports 11 photos and additive 3 + 4 + 4 selection', async ({
    page,
  }) => {
    await mockBase44(page, { user: null });
    await page.goto('/report');

    const input = page.locator('input[type="file"][multiple]');
    const files = imageBatch(11);
    await input.setInputFiles(files.slice(0, 3));
    await input.setInputFiles(files.slice(3, 7));
    await input.setInputFiles(files.slice(7));

    await expect(page.locator('button[aria-label="Remove photo"]')).toHaveCount(11);
    await expect(page.getByText('11 / 11 selected')).toBeVisible();
    await expect(page.getByText(/add from gallery or camera repeatedly/i)).toBeVisible();
  });

  test('camera and library actions keep distinct mobile input semantics', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/report');

    const gallery = page.locator('input[type="file"][multiple]');
    const camera = page.locator('input[type="file"][capture="environment"]').last();
    await expect(gallery).toHaveCount(1);
    await expect(camera).toHaveCount(1);
    await expect(gallery).not.toHaveAttribute('capture', /.+/);
    await expect(camera).not.toHaveAttribute('multiple', /.+/);
    await expect(page.getByRole('button', { name: 'Choose photos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Take photo' })).toBeVisible();
  });

  test('adds camera photos after gallery photos without replacing the set', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/report');
    await page.locator('input[type="file"][multiple]').setInputFiles(IMG1);
    await page.locator('input[type="file"][capture="environment"]').last().setInputFiles(IMG2);
    await expect(page.locator('button[aria-label="Remove photo"]')).toHaveCount(2);
    await expect(page.getByText('2 / 11 selected')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });

  test('explains the cap when a later selection exceeds eleven additional photos', async ({
    page,
  }) => {
    await mockBase44(page, { user: null });
    await page.goto('/report');
    const input = page.locator('input[type="file"][multiple]');
    await input.setInputFiles(imageBatch(11));
    await input.setInputFiles({
      name: 'field-photo-over-cap.png',
      mimeType: 'image/png',
      buffer: IMAGE_BYTES,
    });
    await expect(page.locator('button[aria-label="Remove photo"]')).toHaveCount(11);
    await expect(page.getByText(/maximum 11 additional photos reached/i)).toBeVisible();
  });

  test('does not duplicate a photo selected again in a later batch', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/report');
    const input = page.locator('input[type="file"][multiple]');
    await input.setInputFiles(IMG1);
    await input.setInputFiles([IMG1, IMG2]);
    await expect(page.locator('button[aria-label="Remove photo"]')).toHaveCount(2);
    await expect(page.getByText('Already selected photos were skipped.')).toBeVisible();
  });

  test('uploads an 11-photo documentation batch to one Location with bounded workers', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {}, locationPhotos: [] });
    const photoCreates: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/entities/LocationPhoto')) {
        photoCreates.push(req.url());
      }
    });

    await page.goto('/report');
    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles(IMG1);
    await expect(page.getByText(/Replace/i)).toBeVisible();
    await page.locator('input[type="file"][multiple]').setInputFiles(imageBatch(11));
    await expect(page.locator('button[aria-label="Remove photo"]')).toHaveCount(11);
    await page.getByPlaceholder('Street, district, city').fill('900 Documentation Ave');
    await page.getByText('Enter coordinates manually').click();
    await page.getByPlaceholder('Latitude').fill('13.75');
    await page.getByPlaceholder('Longitude').fill('100.50');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await submitBtn.click();
    await submitBtn.click();
    await expect(submitBtn).toHaveText(/Transmit report/i);
    await submitBtn.click();
    await expect(page.getByText(/Transmission received/i)).toBeVisible({ timeout: 10_000 });
    await expect.poll(() => photoCreates.length, { timeout: 20_000 }).toBe(11);
  });

  test('additional-photos picker: add, preview, and remove locally', async ({ page }, testInfo) => {
    const consoleErrors = trackConsoleErrors(page);
    await mockBase44(page, { user: null });

    await page.goto('/report');
    await expect(page.getByRole('heading', { name: /Adbusting/i })).toBeVisible();

    const extraInput = page.locator('input[type="file"][multiple]');
    await extraInput.setInputFiles([IMG1, IMG2]);

    // Two local thumbnail previews + a remove (X) button on each.
    const thumbs = page.locator('div:has(> button[aria-label="Remove photo"])');
    await expect(thumbs).toHaveCount(2);

    await shot(page, testInfo, 'field-report-extra-photos-added');

    await page.getByRole('button', { name: 'Remove photo' }).first().click();
    await expect(thumbs).toHaveCount(1);
    await expect(page.getByText('1 / 11 selected')).toBeVisible();

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });

  test('full submit: cover photo + extra photos sync as LocationPhoto rows', async ({
    page,
  }, testInfo) => {
    const consoleErrors = trackConsoleErrors(page);
    await mockBase44(page, { user: null, locations: {}, locationPhotos: [] });

    const photoCreates: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/entities/LocationPhoto')) {
        photoCreates.push(req.url());
      }
    });

    await page.goto('/report');

    // Cover photo — "Upload" is the file-picker input; "Capture live" is the
    // camera-capture one, same non-multiple type, disambiguate by label.
    // The trigger label is now itself a keyboard-focusable role="button"
    // (see useKeyboardFilePicker) with its own accessible name, so
    // getByLabel('Upload') matches both it and the input it wraps -- scope
    // to the input inside that labelled group instead of the ambiguous bare
    // getByLabel query.
    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles(IMG1);
    await expect(page.getByText(/Replace/i)).toBeVisible();

    // Extra gallery photos.
    await page.locator('input[type="file"][multiple]').setInputFiles([IMG1, IMG2]);
    await expect(page.locator('div:has(> button[aria-label="Remove photo"])')).toHaveCount(2);

    await page.getByPlaceholder('Street, district, city').fill('900 Test Ave, Testville');
    await page.getByText('Enter coordinates manually').click();
    await page.getByPlaceholder('Latitude').fill('13.75');
    await page.getByPlaceholder('Longitude').fill('100.50');

    await shot(page, testInfo, 'field-report-filled-form');

    // 4-step wizard (Document/Identify/Classify/Respond) — only step 1
    // (Document) needs anything for a valid submit; the rest are optional
    // brand/harm-tag fields. Click through with defaults.
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click(); // -> step 2
    await submitBtn.click(); // -> step 3
    await submitBtn.click(); // -> step 4
    await expect(submitBtn).toHaveText(/Transmit report/i);
    await submitBtn.click(); // submit
    await expect(page.getByText(/Transmission received/i)).toBeVisible({ timeout: 10_000 });

    await shot(page, testInfo, 'field-report-transmission-received');

    // uploadLocationPhotos() fires after the Location record exists — give
    // it a moment to land (it's not awaited by the UI transition).
    await expect.poll(() => photoCreates.length, { timeout: 5000 }).toBe(2);

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });

  test('partial extra-photo failure stays visible and retries without duplicating the Location', async ({
    page,
  }) => {
    const db = { user: null, locations: {}, locationPhotos: [], locationPhotoFailuresRemaining: 1 };
    await mockBase44(page, db);
    await page.goto('/report');

    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles(IMG1);
    await page.locator('input[type="file"][multiple]').setInputFiles([IMG1, IMG2]);
    await page.getByPlaceholder('Street, district, city').fill('900 Retry Ave, Testville');
    await page.getByText('Enter coordinates manually').click();
    await page.getByPlaceholder('Latitude').fill('13.75');
    await page.getByPlaceholder('Longitude').fill('100.50');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await submitBtn.click();
    await submitBtn.click();
    await expect(submitBtn).toHaveText(/Transmit report/i);
    await submitBtn.click();

    await expect(page.getByText(/additional photo/i).filter({ hasText: /failed/i })).toBeVisible({
      timeout: 10_000,
    });
    expect(Object.keys(db.locations)).toHaveLength(1);
    expect(db.locationPhotos).toHaveLength(1);

    await page.getByRole('button', { name: 'Retry failed photos' }).click();
    await expect.poll(() => db.locationPhotos.length, { timeout: 10_000 }).toBe(2);
    expect(Object.keys(db.locations)).toHaveLength(1);
    expect(db.locationPhotos.map((photo) => photo.location_id)).toEqual([
      'mock-location-1',
      'mock-location-1',
    ]);
  });
});

test.describe('QuickCapture modal (/map) — multi-photo upload widget', () => {
  test('Additional photos picker renders inside the capture modal', async ({ page }, testInfo) => {
    const consoleErrors = trackConsoleErrors(page);
    await mockBase44(page, { user: null, locations: {}, locationPhotos: [] });

    await page.goto('/map');
    await page.getByRole('button', { name: /Capture/i }).click();
    await expect(page.getByText(/Anonymous field capture/i)).toBeVisible();

    const extraInput = page.locator('input[type="file"][multiple]');
    await extraInput.setInputFiles([IMG1]);
    await expect(page.locator('div:has(> button[aria-label="Remove photo"])')).toHaveCount(1);

    await shot(page, testInfo, 'quickcapture-additional-photos');

    // Map.jsx pulls in maplibre + geolocation + live location data — those
    // are unrelated surfaces this feature doesn't touch, so we only assert
    // no client-side crash here, not a clean console (matches e2e/smoke.spec.ts).
    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });
});
