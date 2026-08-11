import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG1 = path.join(__dirname, 'fixtures', 'test-image.png');
const IMG2 = path.join(__dirname, 'fixtures', 'test-image-2.png');

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
  name: string
) {
  await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/${name}.png`, fullPage: true });
}

test.describe('FieldReport (/report) — multi-photo upload', () => {
  test('additional-photos picker: add, preview, and remove locally', async ({ page }, testInfo) => {
    const consoleErrors = trackConsoleErrors(page);
    await mockBase44(page, { user: null });

    await page.goto('/report');
    await expect(page.getByRole('heading', { name: /Log an/i })).toBeVisible();

    const extraInput = page.locator('input[type="file"][multiple]');
    await extraInput.setInputFiles([IMG1, IMG2]);

    // Two local thumbnail previews + a remove (X) button on each.
    const thumbs = page.locator('div:has(> button[aria-label="Remove photo"])');
    await expect(thumbs).toHaveCount(2);

    await shot(page, testInfo, 'field-report-extra-photos-added');

    await page.getByRole('button', { name: 'Remove photo' }).first().click();
    await expect(thumbs).toHaveCount(1);

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });

  test('full submit: cover photo + extra photos sync as LocationPhoto rows', async ({ page }, testInfo) => {
    const consoleErrors = trackConsoleErrors(page);
    await mockBase44(page, { user: null, locations: {}, locationPhotos: [] });

    const photoCreates: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/entities/LocationPhoto')) {
        photoCreates.push(req.url());
      }
    });

    await page.goto('/report');

    // Cover photo — the single, non-multiple file input (existing flow).
    await page.locator('input[type="file"]:not([multiple])').setInputFiles(IMG1);
    await expect(page.getByText(/Replace photo/i)).toBeVisible();

    // Extra gallery photos.
    await page.locator('input[type="file"][multiple]').setInputFiles([IMG1, IMG2]);
    await expect(page.locator('div:has(> button[aria-label="Remove photo"])')).toHaveCount(2);

    await page.getByPlaceholder('Street, district, city').fill('900 Test Ave, Testville');
    await page.getByPlaceholder('Latitude').fill('13.75');
    await page.getByPlaceholder('Longitude').fill('100.50');

    await shot(page, testInfo, 'field-report-filled-form');

    await page.getByRole('button', { name: /Transmit report/i }).click();
    await expect(page.getByText(/Transmission received/i)).toBeVisible({ timeout: 10_000 });

    await shot(page, testInfo, 'field-report-transmission-received');

    // uploadLocationPhotos() fires after the Location record exists — give
    // it a moment to land (it's not awaited by the UI transition).
    await expect.poll(() => photoCreates.length, { timeout: 5000 }).toBe(2);

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
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
