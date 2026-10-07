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

const secondLocation = {
  ...location,
  id: 'research-place-2',
  title: 'Research Place · Second Square',
  lat: 0,
  lng: 0,
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
                time: Date.parse('2026-10-01T12:00:00Z'),
                url: 'https://earthquake.usgs.gov/earthquakes/eventpage/test-event-1',
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
    expect(usgsRequests).toBe(0);
    const loadLive = page.getByTestId('load-live-research');
    await loadLive.click();
    await loadLive.click();
    await expect.poll(() => usgsRequests).toBe(1);
    await expect(
      page.getByTestId('research-live-card').or(page.getByText(/No matching events returned/)),
    ).toBeVisible();
    await expect(page.getByText('External reporting').first()).toBeVisible();
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
    await page.getByTestId('load-live-research').click();
    await expect(page.getByTestId('research-fixture-card')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'USGS returned 503' })).toContainText(
      'USGS returned 503',
    );
    await expect(page.getByText('OOH-verified evidence')).toBeVisible();
  });

  test('does not render a pending response after switching locations', async ({ page }) => {
    let release;
    await page.route('https://earthquake.usgs.gov/**', async (route) => {
      await new Promise((resolve) => {
        release = resolve;
      });
      await route.fulfill({
        json: {
          type: 'FeatureCollection',
          features: [
            {
              id: 'old-location-event',
              properties: {
                title: 'Old location event',
                time: Date.parse('2026-10-01T12:00:00Z'),
                url: 'https://earthquake.usgs.gov/earthquakes/eventpage/old-location-event',
              },
              geometry: { type: 'Point', coordinates: [0, 0, 4] },
            },
          ],
        },
      });
    });
    await mockBase44(page, {
      user: null,
      locations: { [location.id]: location, [secondLocation.id]: secondLocation },
      fieldChecks: {},
    });
    await page.goto(`/location/${location.id}`);
    await page.locator('button').filter({ hasText: 'Research this place' }).first().click();
    await page.getByTestId('load-live-research').click();
    await expect.poll(() => Boolean(release)).toBe(true);
    await page.goto(`/location/${secondLocation.id}`);
    await expect(page.getByText(secondLocation.title)).toBeVisible();
    release();
    await expect(page.getByText('Old location event')).toHaveCount(0);
  });
});
