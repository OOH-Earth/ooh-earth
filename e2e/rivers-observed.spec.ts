import { test, expect, type Page } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';
import { stubEnvironmentNetwork } from './fixtures/environmentNetwork';
import { stubHydroApis, USGS_SITE_NAME, type HydroMode } from './fixtures/hydroApis';

// RIVERS-2: observed stations (USGS, UK Environment Agency). Providers are stubbed so CI never
// depends on a live government API; real-network QA is recorded in the PR.

const US = '/rivers?lat=39.2&lng=-76.7&z=9';
const UK = '/rivers?lat=51.42&lng=-0.25&z=9';

async function open(page: Page, path: string, opts: { usgs?: HydroMode; ea?: HydroMode } = {}) {
  await mockBase44(page, { user: null, locations: {} });
  await stubEnvironmentNetwork(page, 'grid');
  const api = await stubHydroApis(page, opts);
  await page.goto(path);
  const map = page.getByTestId('env-map');
  await expect(map).toBeVisible({ timeout: 20_000 });
  await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
  return { api, map };
}

const statusButton = (page: Page) => page.getByRole('button', { name: /observed station status/ });
async function statusText(page: Page) {
  const btn = statusButton(page);
  await expect(btn).toBeVisible({ timeout: 15_000 });
  if ((await btn.getAttribute('aria-expanded')) !== 'true') await btn.click();
  return page.getByTestId('station-status');
}

test.describe('Rivers — observed stations (USGS)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('zoomed-out world view makes no provider requests', async ({ page }) => {
    const { api } = await open(page, '/rivers');
    await page.waitForTimeout(1500);
    expect(api.usgsRequests).toHaveLength(0);
    expect(api.eaStationRequests).toHaveLength(0);
    expect(api.eaReadingRequests).toHaveLength(0);
  });

  test('a US view asks USGS only (one projected, bounded request) and lists observed stations', async ({
    page,
  }) => {
    const { api } = await open(page, US);
    await expect(page.getByRole('button', { name: /USGS-01589100/ })).toBeVisible({
      timeout: 15_000,
    });
    expect(api.usgsRequests).toHaveLength(1);
    expect(api.eaStationRequests).toHaveLength(0); // outside the EA's coverage: not queried
    const q = api.usgsRequests[0].searchParams;
    expect(q.get('parameter_code')).toBe('00060,00065');
    expect(q.get('properties')).toContain('value');
    expect(q.get('bbox')!.split(',').map(Number)).toHaveLength(4);
  });

  test('selecting a fresh multi-measurement station answers where / what / value / unit / when / who / how fresh / source', async ({
    page,
  }) => {
    const { api } = await open(page, US);
    await page.getByRole('button', { name: /USGS-01589100/ }).click();
    const detail = page.getByTestId('env-detail');
    await expect(detail).toBeVisible();
    await expect(detail).toContainText('Observed');
    await expect(detail).toContainText('River flow (discharge)');
    await expect(detail).toContainText('12.5 ft^3/s');
    await expect(detail).toContainText('River level (gage height)');
    await expect(detail).toContainText('2.31 ft');
    await expect(detail).toContainText('Current');
    await expect(detail).toContainText('min ago');
    await expect(detail).toContainText('Provisional');
    await expect(detail).toContainText('U.S. Geological Survey');
    await expect(detail.getByRole('link', { name: 'View on provider site' })).toHaveAttribute(
      'href',
      'https://waterdata.usgs.gov/monitoring-location/01589100/',
    );
    // Unknown stays unknown: USGS does not name a waterbody separately.
    await expect(detail).toContainText('Not named by provider');
    // The station name is fetched for the selected station only, once.
    await expect(
      page.getByRole('region', { name: new RegExp(`${USGS_SITE_NAME} details`) }),
    ).toBeVisible({ timeout: 10_000 });
    expect(api.usgsSiteRequests).toHaveLength(1);
  });

  test('a decades-old latest value is shown as STALE with its age, never as current', async ({
    page,
  }) => {
    await open(page, US);
    const card = page.getByRole('button', { name: /USGS-01111111/ });
    await expect(card).toContainText('Stale');
    await expect(card).toContainText('years ago');
    await card.click();
    const detail = page.getByTestId('env-detail');
    await expect(detail).toContainText('DISCONTINUED');
    await expect(detail).not.toContainText('Current');
  });

  test('a measurement with no value says so and shows no number', async ({ page }) => {
    await open(page, US);
    const card = page.getByRole('button', { name: /USGS-02222222/ });
    await expect(card).toContainText('No recent observation');
    await card.click();
    await expect(page.getByTestId('env-detail')).toContainText('no observation from the provider');
  });

  test('a provider error is reported as PROVIDER UNAVAILABLE, not as no coverage', async ({
    page,
  }) => {
    await open(page, US, { usgs: 'error' });
    await expect(page.getByText(/PROVIDER UNAVAILABLE: USGS returned an error/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/NO OBSERVATION COVERAGE/)).toHaveCount(0);
    // The page stays usable.
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
  });

  test('a hung provider times out and says so', async ({ page }) => {
    test.setTimeout(90_000);
    await open(page, US, { usgs: 'timeout' });
    await expect(page.getByText(/PROVIDER UNAVAILABLE: USGS did not respond in time/)).toBeVisible({
      timeout: 30_000,
    });
  });

  test('an empty viewport says NO OBSERVATION COVERAGE without claiming anything about the water', async ({
    page,
  }) => {
    await open(page, US, { usgs: 'empty' });
    const status = await statusText(page);
    await expect(status).toContainText('NO OBSERVATION COVERAGE in this view');
    await expect(status).toContainText('Not evidence of anything about the water');
  });

  test('outside provider coverage says so instead of querying', async ({ page }) => {
    const { api } = await open(page, '/rivers?lat=-1.3&lng=36.8&z=9'); // Nairobi
    const status = await statusText(page);
    await expect(status).toContainText('USGS: NO OBSERVATION COVERAGE here');
    await expect(status).toContainText('UK Environment Agency: NO OBSERVATION COVERAGE here');
    expect(api.usgsRequests).toHaveLength(0);
    expect(api.eaStationRequests).toHaveLength(0);
  });

  const centre = async (page: Page) =>
    (await page.getByTestId('env-map').getAttribute('data-center'))!.split(',').map(Number);

  async function drag(page: Page, fromX: number, toX: number) {
    const box = (await page.locator('canvas.maplibregl-canvas').boundingBox())!;
    await page.mouse.move(box.x + box.width * fromX, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * toX, box.y + box.height * 0.5, { steps: 1 });
    await page.mouse.up();
  }

  test('rapid panning is debounced: no request fires while the view is still moving', async ({
    page,
  }) => {
    const { api } = await open(page, US);
    await expect(page.getByRole('button', { name: /USGS-01589100/ })).toBeVisible({
      timeout: 15_000,
    });
    const before = api.usgsRequests.length;
    const [, lng0] = await centre(page);
    // Timing-independent: however slowly this machine renders, a request may only fire once the
    // view has been still for the debounce window (700 ms; 600 ms allows for clock jitter).
    const moveEnds: number[] = [];
    for (let i = 0; i < 3; i += 1) {
      await drag(page, 0.8, 0.5);
      moveEnds.push(Date.now());
    }
    await expect
      .poll(async () => (await centre(page))[1], { timeout: 10_000 })
      .toBeGreaterThan(lng0 + 0.5);
    await expect.poll(() => api.usgsRequests.length, { timeout: 15_000 }).toBeGreaterThan(before);
    await page.waitForTimeout(1800);
    const lastMove = moveEnds[moveEnds.length - 1];
    for (const t of api.usgsTimes.slice(before)) {
      const latestMoveBefore = Math.max(...moveEnds.filter((m) => m <= t), 0);
      if (latestMoveBefore) expect(t - latestMoveBefore).toBeGreaterThanOrEqual(600);
    }
    // And the settled view was requested.
    expect(api.usgsTimes[api.usgsTimes.length - 1]).toBeGreaterThanOrEqual(lastMove);
  });

  test('a pan inside an already-loaded area is served from cache (no request)', async ({
    page,
  }) => {
    const { api } = await open(page, US);
    await expect(page.getByRole('button', { name: /USGS-01589100/ })).toBeVisible({
      timeout: 15_000,
    });
    const before = api.usgsRequests.length;
    const [, lng0] = await centre(page);
    await drag(page, 0.52, 0.5); // a few tens of pixels: inside the same 0.5-degree snapped cell
    await expect
      .poll(async () => Math.abs((await centre(page))[1] - lng0), { timeout: 10_000 })
      .toBeGreaterThan(0.001);
    await page.waitForTimeout(2000);
    expect(api.usgsRequests.length).toBe(before);
  });

  test('a superseded in-flight request is cancelled when the view changes', async ({ page }) => {
    // Record page-side aborts: a route-intercepted request does not reliably raise requestfailed.
    await page.addInitScript(() => {
      const w = window as any;
      w.__aborts = 0;
      const orig = window.fetch.bind(window);
      window.fetch = (input: any, init?: any) => {
        let host = '';
        try {
          host = new URL(String(input), location.href).hostname;
        } catch {
          /* relative or invalid: not a provider call */
        }
        if (host === 'api.waterdata.usgs.gov')
          init?.signal?.addEventListener('abort', () => (w.__aborts += 1));
        return orig(input, init);
      };
    });
    // A request that never answers is guaranteed to still be in flight when the view changes.
    const { api } = await open(page, US, { usgs: 'timeout' });
    await expect.poll(() => api.usgsRequests.length, { timeout: 15_000 }).toBe(1);
    const canvas = page.locator('canvas.maplibregl-canvas');
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.5, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => api.usgsRequests.length, { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
    await expect
      .poll(() => page.evaluate(() => (window as any).__aborts), { timeout: 10_000 })
      .toBeGreaterThanOrEqual(1);
  });

  test('nothing is fetched while the tab is hidden; it resumes when visible', async ({ page }) => {
    const { api } = await open(page, '/rivers?lat=39.2&lng=-76.7&z=7');
    expect(api.usgsRequests).toHaveLength(0);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.waitForTimeout(1800);
    expect(api.usgsRequests).toHaveLength(0);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => api.usgsRequests.length, { timeout: 15_000 }).toBe(1);
  });

  test('keyboard: a station card opens its details and Escape closes them', async ({ page }) => {
    await open(page, US);
    const card = page.getByRole('button', { name: /USGS-01589100/ });
    await card.focus();
    await page.keyboard.press('Enter');
    const detail = page.getByTestId('env-detail');
    await expect(detail).toBeVisible();
    // The card's name changes once the station name loads, so find it by pressed state.
    await expect(page.locator('[role="button"][aria-pressed="true"]')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(detail).toHaveCount(0);
  });
});

test.describe('Rivers — observed stations (UK Environment Agency)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('a UK view uses EA only; waterbody comes from the provider; one national readings call', async ({
    page,
  }) => {
    const { api } = await open(page, UK);
    await expect(page.getByRole('button', { name: /Kingston/ })).toBeVisible({ timeout: 15_000 });
    expect(api.usgsRequests).toHaveLength(0);
    expect(api.eaStationRequests).toHaveLength(1);
    expect(api.eaReadingRequests).toHaveLength(1);
    expect(api.eaReadingRequests[0].searchParams.has('lat')).toBe(false);
    await page.getByRole('button', { name: /Kingston/ }).click();
    const detail = page.getByTestId('env-detail');
    await expect(detail).toContainText('River Thames');
    await expect(detail).toContainText('1.25 mAOD');
    await expect(detail).toContainText('Environment Agency');
    // The flow measure has no reading: unknown stays unknown, no neighbour value is borrowed.
    await expect(detail).toContainText('River flow: no observation from the provider');
  });

  test('a station with no river name and a 3-day-old reading is STALE and unnamed', async ({
    page,
  }) => {
    await open(page, UK);
    const card = page.getByRole('button', { name: /Unnamed-river gauge/ });
    await expect(card).toContainText('Stale');
    await expect(card).toContainText('Waterbody not named by provider');
  });

  test('panning to another UK area reuses the cached national readings', async ({ page }) => {
    const { api } = await open(page, UK);
    await expect(page.getByRole('button', { name: /Kingston/ })).toBeVisible({ timeout: 15_000 });
    const canvas = page.locator('canvas.maplibregl-canvas');
    const box = (await canvas.boundingBox())!;
    for (let i = 0; i < 2; i += 1) {
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.5, { steps: 8 });
      await page.mouse.up();
    }
    await expect
      .poll(() => api.eaStationRequests.length, { timeout: 15_000 })
      .toBeGreaterThanOrEqual(2);
    expect(api.eaReadingRequests).toHaveLength(1);
  });

  test('EA provider error is reported and USGS wording does not leak in', async ({ page }) => {
    await open(page, UK, { ea: 'error' });
    await expect(
      page.getByText(/PROVIDER UNAVAILABLE: UK Environment Agency returned an error/),
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test('attribution required by the EA is shown with the layer', async ({ page }) => {
    await open(page, UK);
    const status = await statusText(page);
    await expect(status).toContainText(
      'Environment Agency flood and river level data from the real-time data API (Beta)',
    );
  });
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 844, height: 390 },
]) {
  test(`observed stations are usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await open(page, US);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    // Map view: the status control is reachable and touch-sized.
    const btn = statusButton(page);
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.scrollIntoViewIfNeeded();
    const b = (await btn.boundingBox())!;
    expect(Math.min(b.width, b.height)).toBeGreaterThanOrEqual(40);
    // List view (phones): pick the station, then see its details on the map.
    const list = page.getByRole('button', { name: 'List', exact: true });
    if (await list.isVisible()) await list.click();
    const card = page.getByRole('button', { name: /USGS-01589100/ });
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.scrollIntoViewIfNeeded();
    await card.click();
    const map = page.getByRole('button', { name: 'Map', exact: true }).first();
    if (await map.isVisible()) await map.click();
    const detail = page.getByTestId('env-detail');
    await expect(detail).toBeVisible();
    await detail.scrollIntoViewIfNeeded();
    const d = (await detail.boundingBox())!;
    expect(d.x).toBeGreaterThanOrEqual(0);
    expect(d.x + d.width).toBeLessThanOrEqual(viewport.width + 1);
  });
}
