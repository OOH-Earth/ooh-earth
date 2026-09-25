import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, ADMIN_USER } from './fixtures/mockBase44';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_IMAGE = path.join(__dirname, 'fixtures', 'test-image.png');

// The shared shadcn-style toast (src/components/ui/toast.jsx +
// src/components/ui/use-toast.jsx, rendered by <Toaster/> in App.jsx) had
// its close "x" rendered with NO onClick handler at all -- Toaster.jsx spread
// {title, description, action, ...props} into <Toast>, but never passed
// props.onOpenChange (the toast's own dismiss callback, already created in
// use-toast.jsx's toast()) down to <ToastClose/>. Tapping/clicking the x did
// nothing on any device; TOAST_REMOVE_DELAY (1,000,000ms) meant nothing else
// removed it either. The x was ALSO invisible by default (opacity-0,
// group-hover:opacity-100/focus:opacity-100 only) -- unusable on touch,
// which has no persistent :hover. AdScanLab's "Cataloged to atlas" toast
// (the flow this shipped with) is used here as the representative real
// trigger, since the fix itself lives entirely in the shared Toaster/Toast
// components used by every toast in the app.

test.describe('Toast — close control actually dismisses the toast', () => {
  test('Cataloged to atlas: the toast x is an accessible, clickable control that dismisses only the toast', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    await page.route('**/functions/scanAd', (route) =>
      route.fulfill({
        json: {
          detection: {
            response: {
              is_advertising: true,
              surface_type: 'billboard',
              brand_name: 'Shell',
              industry_sector: 'fossil_fuel',
            },
          },
        },
      }),
    );

    await page.goto('/lab/scanner?access_token=mock-admin-token');

    await page.locator('input[type="file"]').setInputFiles(REAL_IMAGE);
    await expect(page.getByRole('button', { name: /Run detection/i })).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole('button', { name: /Run detection/i }).click();
    await expect(page.getByText('Shell').first()).toBeVisible({ timeout: 10_000 });

    // No GPS in the test fixture image -> the catalog button stays disabled
    // until coordinates are supplied manually.
    await page.getByText('Enter coordinates manually').click();
    await page.getByPlaceholder('Latitude').fill('13.75');
    await page.getByPlaceholder('Longitude').fill('100.5');

    await expect(page.getByRole('button', { name: /Catalog to atlas/i })).toBeEnabled();
    await page.getByRole('button', { name: /Catalog to atlas/i }).click();

    // Both the toast AND AdScanLab's own permanent success panel say
    // "Cataloged to atlas" once cataloging succeeds -- confirm both showed
    // up (2 occurrences), then use the count dropping to 1 as proof that
    // dismissal removed only the toast, not the real on-page confirmation.
    await expect(page.getByText('Cataloged to atlas')).toHaveCount(2, { timeout: 10_000 });

    const closeButton = page.getByRole('button', { name: 'Dismiss' });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(page.getByText('Cataloged to atlas')).toHaveCount(1);
    await expect(closeButton).toHaveCount(0);

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });

  test('clicking inside the toast body (not the close control) does not dismiss it', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    await page.route('**/functions/scanAd', (route) =>
      route.fulfill({
        json: { detection: { response: { is_advertising: true, brand_name: 'Nike' } } },
      }),
    );

    await page.goto('/lab/scanner?access_token=mock-admin-token');
    await page.locator('input[type="file"]').setInputFiles(REAL_IMAGE);
    await page.getByRole('button', { name: /Run detection/i }).click();
    await expect(page.getByText('Nike').first()).toBeVisible({ timeout: 10_000 });
    await page.getByText('Enter coordinates manually').click();
    await page.getByPlaceholder('Latitude').fill('13.75');
    await page.getByPlaceholder('Longitude').fill('100.5');
    await page.getByRole('button', { name: /Catalog to atlas/i }).click();

    await expect(page.getByRole('button', { name: 'Dismiss' })).toBeVisible({ timeout: 10_000 });
    // Click the toast's own title text -- a real interaction inside the
    // toast that is not the close control.
    await page.getByText('Cataloged to atlas').first().click();
    await expect(page.getByRole('button', { name: 'Dismiss' })).toBeVisible();
  });
});
