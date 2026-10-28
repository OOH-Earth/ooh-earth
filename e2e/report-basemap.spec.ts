import { test, expect, type Page } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// /report pin picker basemap states. Provider choice is a BUILD-time configuration, so the spec runs
// against differently built bundles, selected with E2E_BASEMAP_MODE:
//   unconfigured (default): no VITE_CARTO_BASEMAPS_KEY, no fallback opt-in  -> no tiles, honest panel
//   esri:    VITE_REPORT_BASEMAP_FALLBACK=esri (owner opt-in)               -> Esri imagery
//   carto:   VITE_CARTO_BASEMAPS_KEY=<placeholder, not a real key>           -> keyed CARTO tiles
// Limit, by design: an HTTP-200 error image (CARTO without a valid key, or with a rejected/expired
// one: the bytes are identical) cannot be told from a map, and no watermark detector is attempted.

const MODE = (process.env.E2E_BASEMAP_MODE ?? 'unconfigured') as 'unconfigured' | 'esri' | 'carto';
const KEY = 'test-key-not-real';

// 1x1 transparent PNG (stands in for tiles; imagery itself is judged in the browser, see UI-Fixes 13)
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHnOcQAAAAABJRU5ErkJggg==',
  'base64',
);

type Tiles = {
  mode: 'ok' | 'fail' | 'first2fail' | 'reject403';
  urls: string[];
  carto: string[];
  esri: string[];
};

async function open(page: Page, mode: Tiles['mode'] = 'ok') {
  const t: Tiles = { mode, urls: [], carto: [], esri: [] };
  await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
  await mockBase44(page, { user: null });
  await page.route(/(basemaps\.cartocdn\.com|server\.arcgisonline\.com)/, (route) => {
    const u = route.request().url();
    (u.includes('cartocdn') ? t.carto : t.esri).push(u);
    t.urls.push(u);
    const n = t.urls.length;
    if (t.mode === 'fail') return route.fulfill({ status: 503, body: 'down' });
    if (t.mode === 'reject403') return route.fulfill({ status: 403, body: 'rejected' });
    if (t.mode === 'first2fail' && n <= 2) return route.fulfill({ status: 503, body: 'down' });
    return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
  });
  await page.goto('/report');
  await expect(page.locator('[data-tour="report-form"]')).toBeVisible();
  return t;
}

const notice = (page: Page, re: RegExp) => page.getByRole('status').filter({ hasText: re });
const readout = (page: Page) => page.getByText(/-?\d+\.\d{5}, -?\d+\.\d{5}/);

async function dropPin(page: Page) {
  await page.locator('.leaflet-container').scrollIntoViewIfNeeded();
  const box = (await page.locator('.leaflet-container').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2 + 40);
  await expect(readout(page)).toBeVisible();
  return (await readout(page).first().innerText()).trim();
}

for (const vp of [
  { w: 390, h: 844 },
  { w: 320, h: 640 },
]) {
  test.describe(`report basemap [${MODE}] @ ${vp.w}x${vp.h}`, () => {
    test.use({ viewport: { width: vp.w, height: vp.h } });

    test('unconfigured: no tile requests, honest panel, manual coordinates reachable and usable', async ({
      page,
    }) => {
      test.skip(MODE !== 'unconfigured');
      const t = await open(page);
      await expect(notice(page, /basemap unavailable/i)).toBeVisible();
      await expect(page.locator('.leaflet-container')).toHaveCount(0);
      await page.waitForTimeout(800);
      expect(t.urls, 'no provider is contacted without configuration').toEqual([]);
      await page.getByRole('button', { name: /open coordinate fields/i }).click();
      await expect(
        page.locator('details[open]').filter({ hasText: /enter coordinates manually/i }),
      ).toBeVisible();
      await page.getByPlaceholder('Latitude').fill('13.72627');
      await page.getByPlaceholder('Longitude').fill('100.49183');
      await expect(page.getByText('13.72627, 100.49183')).toBeVisible();
    });

    test('esri opt-in: Esri tiles only, credit text shown, pin works', async ({ page }) => {
      test.skip(MODE !== 'esri');
      const t = await open(page);
      await expect.poll(() => t.esri.length).toBeGreaterThan(0);
      expect(t.carto, 'CARTO is never requested without a key').toEqual([]);
      await expect(page.locator('.leaflet-control-attribution')).toContainText(
        'Esri, Vantor, Earthstar Geographics',
      );
      await expect(notice(page, /basemap/i)).toHaveCount(0);
      await dropPin(page);
    });

    test('carto key: every request is CARTO and carries the key; CARTO + OSM attribution', async ({
      page,
    }) => {
      test.skip(MODE !== 'carto');
      const t = await open(page);
      await expect.poll(() => t.carto.length).toBeGreaterThan(0);
      expect(t.esri).toEqual([]);
      for (const u of t.carto) expect(u).toContain(`key=${KEY}`);
      const attr = page.locator('.leaflet-control-attribution');
      await expect(attr).toContainText('OpenStreetMap contributors');
      await expect(attr).toContainText('CARTO');
      await expect(notice(page, /basemap/i)).toHaveCount(0);
    });

    test('carto key: a rejected key that answers HTTP 403 is reported (a 200 error image would not be)', async ({
      page,
    }) => {
      test.skip(MODE !== 'carto');
      await open(page, 'reject403');
      await expect(notice(page, /basemap tiles are not loading/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /retry basemap/i })).toBeVisible();
    });

    test('network failure: notice, manual entry opens, pin and coordinates survive recovery', async ({
      page,
    }) => {
      test.skip(MODE === 'unconfigured');
      const t = await open(page);
      const before = await dropPin(page);
      t.mode = 'fail';
      // force fresh tile requests: zoom changes the tile set
      await page
        .getByRole('button', { name: /zoom out/i })
        .first()
        .click();
      await expect(notice(page, /basemap tiles are not loading/i)).toBeVisible();
      await page.getByRole('button', { name: /open coordinate fields/i }).click();
      await expect(
        page.locator('details[open]').filter({ hasText: /enter coordinates manually/i }),
      ).toBeVisible();
      expect((await readout(page).first().innerText()).trim(), 'coordinates kept while down').toBe(
        before,
      );
      t.mode = 'ok';
      await page.getByRole('button', { name: /retry basemap/i }).click();
      await expect(notice(page, /basemap tiles are not loading/i)).toHaveCount(0);
      expect(
        (await readout(page).first().innerText()).trim(),
        'coordinates kept after recovery',
      ).toBe(before);
    });

    test('partial failure (2 tiles) is not reported as an outage', async ({ page }) => {
      test.skip(MODE === 'unconfigured');
      const t = await open(page, 'first2fail');
      await expect.poll(() => t.urls.length).toBeGreaterThan(3);
      await page.waitForTimeout(800);
      await expect(notice(page, /basemap tiles are not loading/i)).toHaveCount(0);
    });

    test('a tile that loads again clears the notice without a retry press', async ({ page }) => {
      test.skip(MODE === 'unconfigured');
      const t = await open(page, 'fail');
      await expect(notice(page, /basemap tiles are not loading/i)).toBeVisible();
      t.mode = 'ok';
      await page
        .getByRole('button', { name: /zoom in/i })
        .first()
        .click(); // new tiles requested
      await expect(notice(page, /basemap tiles are not loading/i)).toHaveCount(0);
    });
  });
}
