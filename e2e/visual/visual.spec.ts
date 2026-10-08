import { test, expect, type Page } from '@playwright/test';
import { mockBase44 } from '../fixtures/mockBase44';
import { stubEnvironmentNetwork, stubEcologyApis } from '../fixtures/environmentNetwork';
import { stubHydroApis } from '../fixtures/hydroApis';

// Visual reference for the application at the qualified BACKUP candidate 4fb6cad (pre-migration).
// Offline and deterministic: fonts blocked (system fallback), every non-local request aborted unless
// stubbed, clock fixed, motion reduced, map canvases masked (GPU raster varies), live counters masked.

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
];
const FIXED_TIME = new Date('2026-10-08T00:00:00Z');
const TILE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const PLACE = {
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
const PINS = Object.fromEntries(
  [
    [13.75, 100.5],
    [13.752, 100.503],
    [13.748, 100.497],
  ].map(([lat, lng], i) => [
    `loc-vis-${i}`,
    {
      id: `loc-vis-${i}`,
      title: `Billboard · Visual Ref ${i}`,
      type: 'billboard',
      address: `${i} Test St, Testville`,
      lat,
      lng,
      status: 'verified',
      access_key: 'none',
    },
  ]),
);

async function stable(page: Page) {
  await page.clock.setFixedTime(FIXED_TIME);
  // Catch-all first: later (more specific) routes win.
  await page.route(
    (url) => !['localhost', '127.0.0.1'].includes(url.hostname),
    (route) => route.abort(),
  );
  await page.route(
    (url) => ['basemaps.cartocdn.com', 'arcgisonline.com'].some((h) => url.hostname.endsWith(h)),
    (route) => route.fulfill({ status: 200, contentType: 'image/png', body: TILE_PNG }),
  );
  await page.route(
    (url) => url.hostname === 'fonts.googleapis.com',
    (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
  );
  await page.addInitScript(() => {
    localStorage.setItem('ooh-map-view', JSON.stringify('flat'));
    localStorage.setItem('ooh-tour-complete', 'true');
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: (_s: unknown, e: Function) => e({ code: 1 }) },
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: () => Promise.reject(new Error('Camera unavailable')) },
    });
  });
}

async function shoot(page: Page, name: string, opts: { fullPage?: boolean } = {}) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  const v = page.viewportSize()!;
  await expect(page).toHaveScreenshot(`${name}-${v.width}x${v.height}.png`, {
    fullPage: opts.fullPage ?? false,
    mask: [page.locator('canvas.maplibregl-canvas'), page.locator('[data-visual-mask]')],
  });
}

for (const viewport of VIEWPORTS) {
  test.describe(`visual reference ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('main map with disabled generated layers', async ({ page }) => {
      await stable(page);
      await mockBase44(page, { user: null, locations: PINS });
      await page.goto('/map');
      await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20_000 });
      await shoot(page, 'main-map');
    });

    test('capture dialog with manual coordinates and focus', async ({ page }) => {
      await stable(page);
      await mockBase44(page, { user: null, locations: {} });
      await page.goto('/map');
      const capture = page.getByRole('button', { name: 'Capture photo', exact: true });
      await expect(capture).toBeVisible({ timeout: 20_000 });
      await capture.click();
      await page
        .getByLabel(/longitude/i)
        .first()
        .focus();
      await shoot(page, 'capture-dialog');
    });

    test('location detail', async ({ page }) => {
      await stable(page);
      await mockBase44(page, { user: null, locations: { [PLACE.id]: PLACE }, fieldChecks: {} });
      await page.goto(`/location/${PLACE.id}`);
      await expect(
        page.locator('button').filter({ hasText: 'Research this place' }).first(),
      ).toBeVisible({ timeout: 20_000 });
      await shoot(page, 'location-detail');
    });

    test('location research panel (fixture, no live request)', async ({ page }) => {
      await stable(page);
      await mockBase44(page, { user: null, locations: { [PLACE.id]: PLACE }, fieldChecks: {} });
      await page.goto(`/location/${PLACE.id}`);
      await page.locator('button').filter({ hasText: 'Research this place' }).first().click();
      await expect(page.getByTestId('research-fixture-card')).toBeVisible();
      await shoot(page, 'location-research');
    });

    test('ecology with observations', async ({ page }) => {
      await stable(page);
      await mockBase44(page, { user: null, locations: {} });
      await stubEnvironmentNetwork(page, 'ecology');
      await stubEcologyApis(page);
      const observed = page.waitForResponse((r) => r.url().includes('api.inaturalist.org'));
      await page.goto('/ecology?lat=13.75&lng=100.5&z=7');
      await observed;
      const toMap = page.getByRole('button', { name: 'Map', exact: true }).first();
      if (await toMap.isVisible()) await toMap.click();
      await expect(page.getByTestId('env-map')).toHaveAttribute('data-status', 'ready', {
        timeout: 20_000,
      });
      await shoot(page, 'ecology');
    });

    test('rivers with observed stations and a station detail', async ({ page }) => {
      await stable(page);
      await mockBase44(page, { user: null, locations: {} });
      await stubEnvironmentNetwork(page, 'grid');
      await stubHydroApis(page);
      await page.goto('/rivers?lat=39.2&lng=-76.7&z=9');
      await expect(page.getByTestId('env-map')).toHaveAttribute('data-status', 'ready', {
        timeout: 20_000,
      });
      const list = page.getByRole('button', { name: 'List', exact: true });
      if (await list.isVisible()) await list.click();
      const card = page.getByRole('button', { name: /USGS-01589100/ });
      await expect(card).toBeVisible({ timeout: 20_000 });
      await card.click();
      const map = page.getByRole('button', { name: 'Map', exact: true }).first();
      if (await map.isVisible()) await map.click();
      await expect(page.getByTestId('env-detail')).toBeVisible();
      await shoot(page, 'rivers');
    });

    test('field route with a saved route', async ({ page }) => {
      await stable(page);
      await mockBase44(page, { user: null, locations: {} });
      await page.addInitScript(() => {
        sessionStorage.setItem(
          'ooh-field-mission-v1',
          JSON.stringify({
            version: 1,
            cap: 20,
            reference: null,
            ordering: 'PRIORITY THEN LOCATION ID',
            progress: {},
            items: [
              {
                id: 'loc-a',
                title: 'Billboard · North Gate',
                type: 'billboard',
                address: '10 North Rd',
                lat: 13.76,
                lng: 100.52,
                distance_m: 420,
              },
              {
                id: 'loc-b',
                title: 'Adbusting · River Wall',
                type: 'adbusting',
                address: '2 River St',
                lat: 13.75,
                lng: 100.5,
                distance_m: null,
              },
            ],
          }),
        );
      });
      await page.goto('/field-route');
      await expect(page.getByTestId('field-route-count')).toBeVisible({ timeout: 20_000 });
      await shoot(page, 'field-route', { fullPage: true });
    });

    test('hackers club', async ({ page }) => {
      await stable(page);
      await mockBase44(page, { user: null, locations: {} });
      await page.goto('/hackers-club');
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Hackers Club.', {
        timeout: 20_000,
      });
      await shoot(page, 'hackers-club', { fullPage: true });
    });
  });
}
