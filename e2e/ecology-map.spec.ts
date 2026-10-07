import { test, expect, type Page } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';
import {
  stubEnvironmentNetwork,
  stubEcologyApis,
  INAT_FIXTURE,
  type ApiMode,
} from './fixtures/environmentNetwork';

// Ecology portal: reference layers explain themselves, observations are real dated records (never
// generated), and every state (zoomed out, loading, empty, error) says what it knows and what it
// does not. Third-party services are stubbed; real-network QA is recorded in the PR.

async function openEcology(page: Page, opts: { inat?: ApiMode; weather?: ApiMode } = {}) {
  await mockBase44(page, { user: null, locations: {} });
  const net = await stubEnvironmentNetwork(page, 'ecology');
  const api = await stubEcologyApis(page, opts);
  await page.goto('/ecology');
  const map = page.getByTestId('env-map');
  await expect(map).toBeVisible({ timeout: 20_000 });
  return { net, api, map };
}

const num = async (loc: ReturnType<Page['getByTestId']>, attr: string) =>
  Number(await loc.getAttribute(attr));

async function zoomTo(page: Page, map: ReturnType<Page['getByTestId']>, min: number) {
  for (let i = 0; i < 8 && Number(await map.getAttribute('data-zoom')) < min; i += 1) {
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.waitForTimeout(350);
  }
  await expect.poll(() => num(map, 'data-zoom'), { timeout: 15_000 }).toBeGreaterThanOrEqual(min);
}

async function openLayers(page: Page) {
  const legend = page.getByTestId('env-legend');
  if (!(await legend.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: 'Show layers and legend' }).click();
  }
  await expect(legend).toBeVisible();
  return legend;
}

test.describe('Ecology — deep-linked view', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('?lat=&lng=&z= opens the map there and loads observations without zooming', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    await stubEnvironmentNetwork(page, 'ecology');
    const api = await stubEcologyApis(page);
    await page.goto('/ecology?lat=13.75&lng=100.5&z=7');
    const map = page.getByTestId('env-map');
    await expect(map).toHaveAttribute('data-zoom', '7', { timeout: 20_000 });
    await expect.poll(() => api.inatRequests.length, { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
    const bbox = api.inatRequests[0].searchParams;
    expect(Number(bbox.get('swlat'))).toBeLessThan(13.75);
    expect(Number(bbox.get('nelat'))).toBeGreaterThan(13.75);
  });

  test('a malformed deep link is ignored instead of breaking the map', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await stubEnvironmentNetwork(page, 'ecology');
    await stubEcologyApis(page);
    await page.goto('/ecology?lat=banana&lng=999&z=40');
    await expect(page.getByTestId('env-map')).toHaveAttribute('data-status', 'ready', {
      timeout: 20_000,
    });
    expect(Number(await page.getByTestId('env-map').getAttribute('data-zoom'))).toBeLessThan(5);
  });
});

test.describe('Ecology — layers and observations', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('layers explain themselves: type badges, sources and per-layer guidance', async ({
    page,
  }) => {
    const { map } = await openEcology(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    const legend = await openLayers(page);
    for (const name of [
      'Water bodies',
      'Natural cover',
      'Parks & protected areas',
      'Plants observations',
      'Fungi observations',
    ]) {
      await expect(legend.getByRole('button', { name: new RegExp(name) })).toBeVisible();
    }
    await expect(legend).toContainText('Reference');
    await expect(legend).toContainText('Recent observation');
    await expect(legend).toContainText('not the official WDPA register');
    await expect(legend).toContainText('OpenStreetMap');
    await expect(legend).toContainText('iNaturalist');
    // Zoomed out: say what is needed, do not pretend there is no data.
    await expect(legend).toContainText('Zoom in to load observations');
  });

  test('world view makes no observation, detail-tile or LLM requests', async ({ page }) => {
    const { map, net, api } = await openEcology(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await page.waitForTimeout(1500);
    expect(api.inatRequests).toHaveLength(0);
    expect(net.tileRequests).toHaveLength(0);
    expect(api.stats.llmCalls).toBe(0);
  });

  test('zooming in loads real recent observations with provenance and freshness', async ({
    page,
  }) => {
    const { map, api } = await openEcology(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await zoomTo(page, map, 6.5);
    await expect.poll(() => api.inatRequests.length, { timeout: 15_000 }).toBeGreaterThanOrEqual(2);

    const plants = api.inatRequests.find((u) => u.searchParams.get('iconic_taxa') === 'Plantae')!;
    expect(plants.searchParams.get('quality_grade')).toBe('research');
    expect(plants.searchParams.get('per_page')).toBe('100');
    expect(plants.searchParams.get('d1')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(plants.searchParams.get('fields')).toContain('taxon.name');
    expect(api.inatRequests.some((u) => u.searchParams.get('taxon_id') === '47169')).toBe(true);

    // 3 listed: obscured records are excluded, not shown with a fake location.
    await expect(page.getByRole('button', { name: /crown flower/ })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: /sensitive plant/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /turkey tail/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /rare orchid/ })).toHaveCount(0);

    const legend = await openLayers(page);
    await expect(legend).toContainText('Showing the latest 2 of 57 in view');
    await expect(legend).toContainText('Newest: ');
    expect(api.stats.llmCalls).toBe(0);
  });

  test('selecting an observation shows a labelled recent-observation record with a source link', async ({
    page,
  }) => {
    const { map } = await openEcology(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await zoomTo(page, map, 6.5);
    const card = page.getByRole('button', { name: /crown flower/ });
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.focus();
    await expect(card).toBeFocused();
    await card.press('Enter');
    await expect(card).toHaveAttribute('aria-pressed', 'true');
    const detail = page.getByRole('region', { name: 'crown flower details' });
    await expect(detail).toBeVisible();
    await expect(detail).toContainText('Recent observation');
    await expect(detail).toContainText('Calotropis gigantea');
    await expect(detail).toContainText('3 days ago');
    await expect(detail).toContainText('Research grade');
    await expect(detail).toContainText('iNaturalist');
    await expect(detail.getByRole('link', { name: 'View on iNaturalist' })).toHaveAttribute(
      'href',
      'https://www.inaturalist.org/observations/p1',
    );
    await page.keyboard.press('Escape');
    await expect(detail).toHaveCount(0);
  });

  test('turning a group off stops fetching and removes it', async ({ page }) => {
    const { map, api } = await openEcology(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    const legend = await openLayers(page);
    const fungi = legend.getByRole('button', { name: /Fungi observations/ });
    await expect(fungi).toHaveAttribute('aria-pressed', 'true');
    await fungi.click();
    await expect(fungi).toHaveAttribute('aria-pressed', 'false');
    await zoomTo(page, map, 6.5);
    await expect(page.getByRole('button', { name: /crown flower/ })).toBeVisible({
      timeout: 15_000,
    });
    expect(api.inatRequests.every((u) => u.searchParams.get('taxon_id') !== '47169')).toBe(true);
    await expect(page.getByRole('button', { name: /turkey tail/ })).toHaveCount(0);
  });

  test('no observations in view says so without claiming nothing lives there', async ({ page }) => {
    const { map } = await openEcology(page, { inat: 'empty' });
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await zoomTo(page, map, 6.5);
    const legend = await openLayers(page);
    await expect(legend).toContainText('not evidence that nothing lives here', { timeout: 15_000 });
  });

  test('provider failure is reported and the map stays usable', async ({ page }) => {
    const { map } = await openEcology(page, { inat: 'error' });
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await zoomTo(page, map, 6.5);
    const legend = await openLayers(page);
    await expect(legend).toContainText('iNaturalist is unavailable right now', { timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
  });

  test('reference layers are inspectable and labelled as map geography', async ({ page }) => {
    const { map } = await openEcology(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await zoomTo(page, map, 6.5);
    await expect.poll(() => num(map, 'data-segments'), { timeout: 15_000 }).toBeGreaterThan(0);
    const inspect = page.getByRole('button', {
      name: /Inspect the feature nearest the map centre/,
    });
    await inspect.focus();
    await page.keyboard.press('Enter');
    const detail = page.getByRole('region', { name: 'Fixture Reserve details' });
    await expect(detail).toBeVisible();
    await expect(detail).toContainText('Park / protected area');
    await expect(detail).toContainText('Reference');
    await expect(detail).toContainText('OpenStreetMap');
    await expect(detail).toContainText('not the official WDPA register');
    await page.keyboard.press('Escape');
    await expect(inspect).toBeFocused();
  });

  test('conditions are on demand, modelled, timestamped and sourced', async ({ page }) => {
    const { map, api } = await openEcology(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    // The nav already has its own small air-quality widget; count only this card's requests.
    const mine = () =>
      api.weatherRequests.filter(
        (u) =>
          u.hostname === 'api.open-meteo.com' || u.searchParams.get('current')?.includes('us_aqi'),
      );
    expect(mine()).toHaveLength(0);
    await page.getByRole('button', { name: /modelled conditions at the map centre/ }).click();
    const card = page.getByRole('region', { name: 'Conditions at map centre' });
    await expect(card).toContainText('16.9 µg/m³', { timeout: 15_000 });
    await expect(card).toContainText('24.3 °C');
    await expect(card).toContainText('Derived');
    await expect(card).toContainText('not a station reading');
    await expect(card).toContainText('2026-10-06T18:00 UTC');
    await expect(card).toContainText('Open-Meteo');
    expect(mine()).toHaveLength(2);
    expect(Number(mine()[0].searchParams.get('latitude'))).toBeCloseTo(13.75, 0);
    expect(Number(mine()[0].searchParams.get('longitude'))).toBeCloseTo(100.5, 0);
    await page.getByRole('button', { name: 'Close conditions' }).click();
    await expect(card).toHaveCount(0);
  });

  test('conditions failure is reported honestly', async ({ page }) => {
    const { map } = await openEcology(page, { weather: 'error' });
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await page.getByRole('button', { name: /modelled conditions at the map centre/ }).click();
    await expect(page.getByText('Current conditions are unavailable right now')).toBeVisible();
  });

  test('fixture sanity: obscured records exist in the stub so exclusion is real', () => {
    expect(INAT_FIXTURE.plants.some((p) => p.obscured)).toBe(true);
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
  test(`Ecology layout is usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const { map } = await openEcology(page);
    await expect(map).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });

    const box = (await page.locator('canvas.maplibregl-canvas').boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(viewport.height <= 500 ? 280 : 320);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );

    const toggle = page.getByRole('button', { name: /layers and legend/ });
    await toggle.scrollIntoViewIfNeeded();
    await expect(toggle).toBeVisible();
    const tb = (await toggle.boundingBox())!;
    expect(Math.min(tb.width, tb.height)).toBeGreaterThanOrEqual(40);

    const legend = await openLayers(page);
    const first = legend.getByRole('button').first();
    await first.scrollIntoViewIfNeeded();
    const fb = (await first.boundingBox())!;
    expect(fb.height).toBeGreaterThanOrEqual(40);
    // The legend never extends past the map on any viewport.
    const lb = (await legend.boundingBox())!;
    expect(lb.x).toBeGreaterThanOrEqual(0);
    expect(lb.x + lb.width).toBeLessThanOrEqual(viewport.width);

    const cond = page.getByRole('button', { name: /modelled conditions/ });
    await cond.scrollIntoViewIfNeeded();
    await expect(cond).toBeVisible();
  });
}
