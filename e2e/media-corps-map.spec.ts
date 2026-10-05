import { test, expect, type Page } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// Regression coverage for the Media Corps map found by direct-visit testing:
// - /media-corps is a lazy route, so the Leaflet stylesheet must be imported by the map itself
// - pins need accessible names and must survive re-renders (stable icons)
// - short landscape screens must keep a usable map canvas
// - empty registry / empty filter results need a visible explanation on every viewport
// - the 3D globe must initialise with the coverage layer without MapLibre layer-order errors

const CORPS = [
  {
    id: 'mc1',
    name: 'JCDecaux',
    hq: 'Plaisir, France',
    lat: 48.82,
    lng: 2.01,
    regions: ['Europe'],
    scope: 'global',
    countries: 80,
    panels: 1000000,
  },
  {
    id: 'mc2',
    name: 'Lamar Advertising',
    hq: 'Baton Rouge, USA',
    lat: 30.45,
    lng: -91.18,
    regions: ['North America'],
    scope: 'regional',
    countries: 1,
    panels: 352000,
  },
  {
    id: 'mc3',
    name: 'oOh!media',
    hq: 'Sydney, Australia',
    lat: -33.86,
    lng: 151.2,
    regions: ['Asia-Pacific'],
    scope: 'local',
    countries: 2,
    panels: 37000,
  },
];

// Exact hostnames (not a URL regex) so only the basemap tile CDNs are stubbed.
const TILE_HOSTS = ['basemaps.cartocdn.com', 'arcgisonline.com'];

const TILE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

async function openMediaCorps(page: Page, corps: unknown[] = CORPS) {
  await mockBase44(page, { user: null, locations: {} });
  // Registered after mockBase44 so these win. Tiles are stubbed to keep the test hermetic.
  await page.route(
    (url) => TILE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)),
    (route) => route.fulfill({ status: 200, contentType: 'image/png', body: TILE_PNG }),
  );
  await page.route('**/api/apps/*/entities/MediaCorp*', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ json: corps })
      : route.fulfill({ json: {} }),
  );
  await page.goto('/media-corps');
  await page.locator('.leaflet-container').waitFor({ timeout: 20_000 });
}

test.describe('Media Corps map', () => {
  test('applies the Leaflet stylesheet on a direct visit and renders pins inside the map', async ({
    page,
  }) => {
    await openMediaCorps(page);
    const styles = await page.evaluate(() => ({
      pane: getComputedStyle(document.querySelector('.leaflet-pane')!).position,
      container: getComputedStyle(document.querySelector('.leaflet-container')!).overflow,
    }));
    expect(styles).toEqual({ pane: 'absolute', container: 'hidden' });
    const map = (await page.locator('.leaflet-container').boundingBox())!;
    const pins = page.locator('.ooh-media-corp-pin');
    await expect(pins).toHaveCount(CORPS.length);
    const first = (await pins.first().boundingBox())!;
    expect(first.x).toBeGreaterThanOrEqual(map.x);
    expect(first.x + first.width).toBeLessThanOrEqual(map.x + map.width);
  });

  test('pins have accessible names and open details by keyboard', async ({ page }) => {
    await openMediaCorps(page);
    const pin = page.getByRole('button', { name: 'JCDecaux', exact: true });
    await expect(pin).toHaveCount(1);
    const drawer = page.getByRole('dialog', { name: 'JCDecaux details' });
    for (const key of ['Enter', ' ']) {
      await pin.focus();
      await page.keyboard.press(key);
      await expect(drawer).toContainText('JCDecaux');
      await page.getByRole('button', { name: 'Close details' }).click();
      await expect(drawer).toHaveCount(0);
    }
  });

  test('re-rendering from a filter change keeps the same pin elements', async ({ page }) => {
    await openMediaCorps(page);
    // Leaflet reuses the outer div but rewrites its inner SVG when the icon object changes,
    // which is what drops keyboard focus and popups. A probe on the SVG survives only if
    // the icon is stable.
    await page
      .locator('.ooh-media-corp-pin svg')
      .first()
      .evaluate((el) => el.setAttribute('data-probe', 'kept'));
    await page.getByPlaceholder('Search corps…').fill('a');
    await expect(page.locator('.ooh-media-corp-pin svg[data-probe="kept"]')).toHaveCount(1);
  });

  test('empty registry says so instead of showing a silent blank map', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openMediaCorps(page, []);
    const status = page.getByRole('status');
    await expect(status).toContainText('No media corps published yet');
    await expect(status.getByRole('link', { name: 'File a report' })).toHaveAttribute(
      'href',
      '/report',
    );
  });

  test('filters with no match explain themselves and can be cleared', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openMediaCorps(page);
    await page.getByPlaceholder('Search corps…').fill('zzz-no-such-corp');
    const status = page.getByRole('status');
    await expect(status).toContainText('No corps match these filters');
    await status.getByRole('button', { name: 'Clear filters' }).click();
    await expect(status).toHaveCount(0);
    await expect(page.locator('.ooh-media-corp-pin')).toHaveCount(CORPS.length);
  });

  test('3D globe with coverage initialises without MapLibre layer errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await openMediaCorps(page);
    await page.getByRole('button', { name: /Coverage/ }).click();
    await page.locator('button[title="3D Globe"]').click();
    await expect(page.locator('canvas.maplibregl-canvas')).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(2000);
    expect(
      errors.filter((e) => /mc-coverage-circles|mc-clusters|non-existing layer/.test(e)),
    ).toEqual([]);
  });

  for (const viewport of [
    { width: 844, height: 390 },
    { width: 915, height: 412 },
  ]) {
    test(`keeps a usable map canvas on short landscape ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openMediaCorps(page);
      const map = (await page.locator('.leaflet-container').boundingBox())!;
      expect(map.height).toBeGreaterThanOrEqual(280);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      );
      // The chrome above the map stays reachable by scrolling the page.
      await page.getByPlaceholder('Search corps…').scrollIntoViewIfNeeded();
      await expect(page.getByPlaceholder('Search corps…')).toBeVisible();
      // Leaflet focuses the map on mousedown and only compensates window scroll. The page
      // itself must therefore be the scroller, or the pin moves under the cursor between
      // mousedown and mouseup and the first click is lost.
      const pin = page.locator('.ooh-media-corp-pin[title="JCDecaux"]');
      await pin.scrollIntoViewIfNeeded();
      await pin.click();
      await expect(page.getByRole('dialog', { name: 'JCDecaux details' })).toBeVisible();
    });
  }
});
