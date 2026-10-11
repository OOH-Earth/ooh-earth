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

test('auto-dropped device location is labelled as device location, not a user entry', async ({
  page,
}) => {
  await mockBase44(page, { user: null, locations: {} });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (ok: Function) =>
          ok({ coords: { latitude: 0.001, longitude: 0.001, accuracy: 10 } }),
      },
    });
  });
  await page.goto('/report');
  await expect(page.getByTestId('location-confirmation')).toContainText('your device location');
});

test('late device location never overwrites coordinates the person already typed', async ({
  page,
}) => {
  await mockBase44(page, { user: null, locations: {} });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (ok: Function) =>
          setTimeout(() => ok({ coords: { latitude: 10, longitude: 20, accuracy: 10 } }), 2500),
      },
    });
  });
  await page.goto('/report');
  await page.getByText('Enter coordinates manually', { exact: true }).click();
  await page.getByPlaceholder('Latitude').fill('51.4545');
  await page.getByPlaceholder('Longitude').fill('-2.5879');
  await page.waitForTimeout(4000);
  await expect(page.getByPlaceholder('Latitude')).toHaveValue('51.4545');
  await expect(page.getByPlaceholder('Longitude')).toHaveValue('-2.5879');
  await expect(page.getByTestId('location-confirmation')).toContainText(
    'the coordinates you typed',
  );
});

test('typing coordinates after an auto-dropped device location updates the source label', async ({
  page,
}) => {
  await mockBase44(page, { user: null, locations: {} });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (ok: Function) =>
          ok({ coords: { latitude: 0.001, longitude: 0.001, accuracy: 10 } }),
      },
    });
  });
  await page.goto('/report');
  await expect(page.getByTestId('location-confirmation')).toContainText('your device location');
  await page.getByText('Enter coordinates manually', { exact: true }).click();
  await page.getByPlaceholder('Latitude').fill('51.4545');
  await expect(page.getByTestId('location-confirmation')).toContainText(
    'the coordinates you typed',
  );
  await expect(page.getByTestId('location-confirmation')).not.toContainText('device location');
});

async function stubGeolocation(page: import('@playwright/test').Page, positions: number[]) {
  await page.addInitScript((list: number[]) => {
    let i = 0;
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (ok: Function) => {
          const v = list[Math.min(i++, list.length - 1)];
          ok({ coords: { latitude: v, longitude: v, accuracy: 10 } });
        },
      },
    });
  }, positions);
}

test('an automatic device location must be acknowledged before Continue', async ({ page }) => {
  await mockBase44(page, { user: null, locations: {} });
  await stubGeolocation(page, [0.001]);
  await page.goto('/report');
  await expect(page.getByTestId('location-confirmation')).toContainText('your device location');
  await page.getByRole('button', { name: /^continue$/i }).click();
  await expect(page.getByText(/confirm the location first/i)).toBeVisible();
  await expect(page.getByText('// Step 1 of 4')).toBeVisible();
  await page.getByRole('button', { name: /yes, this is where it is/i }).click();
  await expect(page.getByTestId('location-confirmation')).toContainText('Location confirmed');
  await page.getByRole('button', { name: /^continue$/i }).click();
  await expect(page.getByText('// Step 2 of 4')).toBeVisible();
});

test('a deliberate map tap counts as confirmation', async ({ page }) => {
  await mockBase44(page, { user: null, locations: {} });
  await page.goto('/report');
  await page.locator('.leaflet-container').click({ position: { x: 60, y: 60 } });
  await expect(page.getByTestId('location-confirmation')).toContainText('the map pin');
  await expect(page.getByRole('button', { name: /yes, this is where it is/i })).toHaveCount(0);
  await page.getByRole('button', { name: /^continue$/i }).click();
  await expect(page.getByText('// Step 2 of 4')).toBeVisible();
});

test('an automatic change of location resets a previous confirmation', async ({ page }) => {
  await mockBase44(page, { user: null, locations: {} });
  await stubGeolocation(page, [0.001, 0.002]);
  await page.goto('/report');
  await page.getByRole('button', { name: /yes, this is where it is/i }).click();
  await expect(page.getByTestId('location-confirmation')).toContainText('Location confirmed');
  await page.getByRole('button', { name: /locate me/i }).click();
  await expect(page.getByPlaceholder('Latitude')).toHaveValue('0.00200');
  await expect(page.getByRole('button', { name: /yes, this is where it is/i })).toBeVisible();
});

test('submitting cannot bypass an unconfirmed automatic location via the step tabs', async ({
  page,
}) => {
  await mockBase44(page, { user: null, locations: {} });
  await stubGeolocation(page, [0.001]);
  await page.goto('/report');
  await page.getByRole('button', { name: '04 Respond' }).click();
  await page.getByRole('button', { name: /transmit report/i }).click();
  await expect(page.getByText(/confirm the location first/i)).toBeVisible();
  await expect(page.getByText('// Step 1 of 4')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Submitted for review' })).toHaveCount(0);
});
