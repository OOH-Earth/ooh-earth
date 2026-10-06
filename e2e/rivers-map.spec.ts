import { test, expect, type Page } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';
import { stubEnvironmentNetwork, type NetworkMode } from './fixtures/environmentNetwork';

// Rivers portal: the river network is real map geometry loaded progressively by zoom/viewport,
// reference data is labelled as reference, and every failure mode degrades honestly.
// Network is stubbed so these never depend on third-party services; see the PR for real-network QA.

async function openRivers(page: Page, mode: NetworkMode = 'grid') {
  await mockBase44(page, { user: null, locations: {} });
  const net = await stubEnvironmentNetwork(page, mode);
  await page.goto('/rivers');
  const map = page.getByTestId('env-map');
  await expect(map).toBeVisible({ timeout: 20_000 });
  return { net, map };
}

// Detail (OpenStreetMap) tiles only load from zoom 5; the world view uses bundled major rivers.
async function zoomTo(page: Page, map: ReturnType<Page['getByTestId']>, min: number) {
  for (let i = 0; i < 8 && Number(await map.getAttribute('data-zoom')) < min; i += 1) {
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.waitForTimeout(350);
  }
  await expect.poll(() => num(map, 'data-zoom'), { timeout: 15_000 }).toBeGreaterThanOrEqual(min);
}

const num = async (loc: ReturnType<Page['getByTestId']>, attr: string) =>
  Number(await loc.getAttribute(attr));

test.describe('Rivers — river network map', () => {
  test('direct visit shows major rivers at world scale without requesting any detail tiles', async ({
    page,
  }) => {
    const { map, net } = await openRivers(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await expect.poll(() => num(map, 'data-segments'), { timeout: 15_000 }).toBeGreaterThan(0);

    const legend = page.getByTestId('env-legend');
    await expect(legend).toContainText('River network');
    await expect(legend).toContainText('Reference');
    await expect(legend).toContainText('Illustrative');
    await expect(legend).toContainText('Natural Earth');
    await expect(legend).toContainText('CARTO');
    await expect(legend).toContainText('not a live reading');
    // Performance budget: the world view must not pull the heavy detail tiles at all.
    expect(net.tileRequests).toHaveLength(0);
    await expect.poll(() => num(map, 'data-names'), { timeout: 15_000 }).toBeGreaterThan(5);
  });

  test('detail loads progressively: tiles appear only when zoomed in, within a small budget', async ({
    page,
  }) => {
    const { net, map } = await openRivers(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    expect(net.tileRequests).toHaveLength(0);

    await zoomTo(page, map, 5.5);
    await expect.poll(() => net.tileRequests.length, { timeout: 15_000 }).toBeGreaterThan(0);
    const zBefore = Math.max(...net.tileRequests.map((t) => t.z));
    expect(Math.min(...net.tileRequests.map((t) => t.z))).toBeGreaterThanOrEqual(5);

    await zoomTo(page, map, 7.5);
    await expect
      .poll(() => Math.max(...net.tileRequests.map((t) => t.z)), { timeout: 15_000 })
      .toBeGreaterThan(zBefore);

    // Viewport-bound: nothing close to a world-scale fan-out of requests.
    const unique = new Set(net.tileRequests.map((t) => `${t.z}/${t.x}/${t.y}`));
    expect(unique.size).toBeLessThan(80);
  });

  test('panning at detail zoom requests new tiles for the new viewport', async ({ page }) => {
    const { net, map } = await openRivers(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await zoomTo(page, map, 6.5);
    await page.waitForTimeout(800);
    const before = new Set(net.tileRequests.map((t) => `${t.z}/${t.x}/${t.y}`)).size;

    const canvas = page.locator('canvas.maplibregl-canvas');
    const box = (await canvas.boundingBox())!;
    // MapLibre prefetches a ring of tiles, so pan well beyond it (several full-width drags).
    for (let i = 0; i < 4; i += 1) {
      await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.5, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
    }
    await expect
      .poll(() => new Set(net.tileRequests.map((t) => `${t.z}/${t.x}/${t.y}`)).size, {
        timeout: 15_000,
      })
      .toBeGreaterThan(before);
  });

  test('selecting a river by pointer opens labelled reference details that Escape closes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const { map } = await openRivers(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await zoomTo(page, map, 6);
    await expect.poll(() => num(map, 'data-segments'), { timeout: 15_000 }).toBeGreaterThan(0);

    const canvas = page.locator('canvas.maplibregl-canvas');
    const box = (await canvas.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    const detail = page.getByTestId('env-detail');
    await expect(detail).toBeVisible();
    await expect(detail).toContainText('Fixture River');
    await expect(detail).toContainText('Reference');
    await expect(detail).toContainText('OpenStreetMap');
    await expect(detail).toContainText('Reference');
    // Unknown is data: no live reading is implied for a reference waterway.
    await expect(detail).toContainText('Unknown');

    await page.keyboard.press('Escape');
    await expect(detail).toHaveCount(0);
  });

  test('keyboard users can inspect the nearest river and focus is managed', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const { map } = await openRivers(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await zoomTo(page, map, 6);
    await expect.poll(() => num(map, 'data-segments'), { timeout: 15_000 }).toBeGreaterThan(0);

    const inspect = page.getByRole('button', { name: /Inspect the river nearest the map centre/ });
    await inspect.focus();
    await page.keyboard.press('Enter');
    const detail = page.getByRole('region', { name: 'Fixture River details' });
    await expect(detail).toBeVisible();
    await expect(detail).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(detail).toHaveCount(0);
    await expect(inspect).toBeFocused();
  });

  test('selecting a reference sample from the list opens labelled illustrative details', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const { map } = await openRivers(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    const card = page.getByRole('button', { name: /Kemble Source/ });
    await card.focus();
    await page.keyboard.press('Enter');
    const detail = page.getByRole('region', { name: 'Kemble Source details' });
    await expect(detail).toBeVisible();
    await expect(detail).toContainText('Illustrative');
    await expect(detail).toContainText('not a live reading');
    await expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  test('if the detailed network cannot load, the page says so and keeps major rivers', async ({
    page,
  }) => {
    const { map } = await openRivers(page, 'tilejson-fails');
    await expect(map).toHaveAttribute('data-status', 'error', { timeout: 20_000 });
    await expect(page.getByText(/The detailed river network could not be loaded/)).toBeVisible();
    await expect(page.getByText(/Showing major rivers only/)).toBeVisible();
    // The bundled major rivers still render.
    await expect.poll(() => num(map, 'data-segments'), { timeout: 15_000 }).toBeGreaterThan(0);
    // The page itself stays usable.
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
  });

  test('if every tile fails the page reports the network as unavailable', async ({ page }) => {
    const { map } = await openRivers(page, 'tiles-fail');
    await zoomTo(page, map, 5.5);
    await expect(map).toHaveAttribute('data-status', 'error', { timeout: 20_000 });
    await expect(page.getByText(/The detailed river network could not be loaded/)).toBeVisible();
  });

  test('partial tile failures are reported while coarse geometry keeps working', async ({
    page,
  }) => {
    const { map } = await openRivers(page, 'tiles-fail-detail');
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await zoomTo(page, map, 5.5);
    await page.waitForTimeout(800);
    await zoomTo(page, map, 7.5);
    await expect(page.getByText('Some map tiles failed to load.')).toBeVisible({ timeout: 20_000 });
    await expect(map).not.toHaveAttribute('data-status', 'error');
  });

  test('areas with no waterways say NO COVERAGE instead of implying a clean environment', async ({
    page,
  }) => {
    const { map } = await openRivers(page, 'empty');
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    // At world zoom the bundled major rivers exist; "no coverage" is only claimed where the
    // detailed network should exist (zoomed in).
    await expect(page.getByText(/NO COVERAGE here/)).toHaveCount(0);
    await zoomTo(page, map, 6.5);
    await expect(page.getByText(/NO COVERAGE here/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/not a measurement of the environment/)).toBeVisible();
  });
});

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 387, height: 805 },
  { width: 430, height: 932 },
  { width: 667, height: 375 },
  { width: 844, height: 390 },
  { width: 844, height: 412 },
  { width: 915, height: 412 },
  { width: 932, height: 430 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

for (const viewport of VIEWPORTS) {
  test(`Rivers layout is usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const { map } = await openRivers(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });

    const box = (await page.locator('canvas.maplibregl-canvas').boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(viewport.height <= 500 ? 280 : 320);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );

    // Controls are reachable and touch-sized.
    for (const name of ['Zoom in', 'Zoom out']) {
      const btn = page.getByRole('button', { name });
      await btn.scrollIntoViewIfNeeded();
      await expect(btn).toBeVisible();
      const b = (await btn.boundingBox())!;
      expect(Math.min(b.width, b.height)).toBeGreaterThanOrEqual(40);
    }
    // The map is not covered by the status or legend UI.
    const legendToggle = page.getByRole('button', { name: /legend/i });
    await legendToggle.scrollIntoViewIfNeeded();
    await expect(legendToggle).toBeVisible();
  });
}
