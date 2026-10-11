import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// MOCKED-backend tests (mockBase44) in headless Chromium emulation. They prove
// the UI logic only -- not live Base44 behaviour, real camera, or a real phone.

async function denyGeolocation(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: (_ok: unknown, err: Function) => err({ code: 1 }) },
    });
  });
}

test('denied location shows a message and keeps manual entry usable', async ({ page }) => {
  await mockBase44(page, { user: null, locations: {} });
  await denyGeolocation(page);
  await page.goto('/report');
  await page.getByRole('button', { name: /locate me/i }).click();
  await expect(page.getByRole('alert').filter({ hasText: /permission was denied/i })).toBeVisible();
  await page.getByText('Enter coordinates manually', { exact: true }).click();
  await page.getByPlaceholder('Latitude').fill('51.4545');
  await page.getByPlaceholder('Longitude').fill('-2.5879');
  await expect(page.getByTestId('location-confirmation')).toContainText('51.4545, -2.5879');
});

test('step 1 cannot be passed without valid coordinates', async ({ page }) => {
  await mockBase44(page, { user: null, locations: {} });
  await page.goto('/report');
  await page.getByRole('button', { name: /^continue$/i }).click();
  await expect(page.getByText(/set the location first/i)).toBeVisible();
  await expect(page.getByText('// Step 1 of 4')).toBeVisible();
  await page.getByText('Enter coordinates manually', { exact: true }).click();
  await page.getByPlaceholder('Latitude').fill('95');
  await page.getByPlaceholder('Longitude').fill('10');
  await page.getByRole('button', { name: /^continue$/i }).click();
  await expect(page.getByText('// Step 1 of 4')).toBeVisible();
});

async function fillAndSubmit(page: import('@playwright/test').Page) {
  await page.getByText('Enter coordinates manually', { exact: true }).click();
  await page.getByPlaceholder('Latitude').fill('51.4545');
  await page.getByPlaceholder('Longitude').fill('-2.5879');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /^continue$/i }).click();
  await page.getByRole('button', { name: /transmit report/i }).click();
}

test('anonymous success states pending review and does not claim public visibility', async ({
  page,
}) => {
  await mockBase44(page, { user: null, locations: {} });
  await page.goto('/report');
  await fillAndSubmit(page);
  await expect(page.getByRole('heading', { name: 'Submitted for review' })).toBeVisible();
  await expect(page.getByText(/not public yet/i)).toBeVisible();
  await expect(page.getByText(/renders on the live map immediately/i)).toHaveCount(0);
  await expect(page.getByRole('link', { name: /create an account to track it/i })).toHaveAttribute(
    'href',
    '/register?returnTo=/dashboard',
  );
  await expect(page.getByRole('link', { name: /view your report/i })).toHaveCount(0);
});

test('server failure is reported as saved-on-device, not as submitted', async ({ page }) => {
  await mockBase44(page, { user: null, locations: {} });
  await page.route('**/functions/submitOffline', (route) =>
    route.fulfill({ status: 503, json: { error: 'Submission unavailable' } }),
  );
  await page.goto('/report');
  await fillAndSubmit(page);
  await expect(page.getByRole('heading', { name: 'Saved on this device' })).toBeVisible();
  await expect(page.getByText(/has not been submitted yet/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Submitted for review' })).toHaveCount(0);
});
