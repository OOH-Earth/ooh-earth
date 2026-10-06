import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

const location = {
  id: 'research-place-1',
  title: 'Research Place · Test Square',
  type: 'billboard',
  address: '1 Test Square, Testville',
  lat: 51.5074,
  lng: -0.1278,
  status: 'verified',
  image_url: '',
  access_key: 'none',
};

test.describe('bounded place research', () => {
  test('loads only on request and keeps fixtures distinct from live reporting', async ({
    page,
  }) => {
    let usgsRequests = 0;
    await page.route('https://earthquake.usgs.gov/**', async (route) => {
      usgsRequests += 1;
      await route.fulfill({
        json: {
          type: 'FeatureCollection',
          features: [
            {
              id: 'test-event-1',
              properties: {
                title: 'M 2.9 — 4 km SW of Testville',
                mag: 2.9,
                time: Date.now() - 60_000,
                url: 'https://earthquake.usgs.gov/test-event-1',
              },
              geometry: { type: 'Point', coordinates: [-0.2, 51.5, 8.2] },
            },
          ],
        },
      });
    });
    await mockBase44(page, { user: null, locations: { [location.id]: location }, fieldChecks: {} });
    await page.goto(`/location/${location.id}`);
    const researchButton = page
      .locator('button')
      .filter({ hasText: 'Research this place' })
      .first();
    await expect(researchButton).toBeVisible();
    expect(usgsRequests).toBe(0);
    await researchButton.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'Research this place', exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId('research-fixture-card')).toContainText(
      'Fixture · not live intelligence',
    );
    await expect(page.getByTestId('research-live-card')).toContainText('External reporting');
    await expect(page.getByText('Open field check')).toBeVisible();
    expect(usgsRequests).toBe(1);
  });

  test('isolates a provider outage and preserves the fixture experience', async ({ page }) => {
    await page.route('https://earthquake.usgs.gov/**', (route) =>
      route.fulfill({ status: 503, body: 'offline' }),
    );
    await mockBase44(page, { user: null, locations: { [location.id]: location }, fieldChecks: {} });
    await page.goto(`/location/${location.id}`);
    await page.locator('button').filter({ hasText: 'Research this place' }).first().click();
    await expect(page.getByTestId('research-fixture-card')).toBeVisible();
    await expect(page.getByRole('status')).toContainText('external source is unavailable');
    await expect(page.getByText('OOH-verified evidence')).toBeVisible();
  });
});
