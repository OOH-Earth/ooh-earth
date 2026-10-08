import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';
import { stubEnvironmentNetwork, stubEcologyApis } from './fixtures/environmentNetwork';

function renderedGeometry(
  element: Element,
  { sourceId, layerId }: { sourceId: string; layerId: string },
) {
  let node: Element | null = element;
  let fiber: any;
  while (node && !fiber) {
    const key = Object.keys(node).find((name) => name.startsWith('__reactFiber$'));
    if (key) fiber = (node as any)[key];
    node = node.parentElement;
  }
  for (let hops = 0; fiber && hops < 40; hops++, fiber = fiber.return) {
    let map = fiber.memoizedProps?.map;
    let hook = fiber.memoizedState;
    while (!map && hook) {
      const candidate = hook.memoizedState?.current;
      if (typeof candidate?.getSource === 'function') map = candidate;
      hook = hook.next;
    }
    if (typeof map?.getSource !== 'function') continue;
    const source = map.getSource(sourceId);
    if (!source || !map.getLayer(layerId)) return null;
    return {
      loaded: source.loaded(),
      features: source.serialize().data.features,
      rendered: map.queryRenderedFeatures({ layers: [layerId] }).map((f: any) => f.properties.id),
    };
  }
  return null;
}

test.describe.configure({ retries: 0 });

// Rendering and behaviour are asserted independently from API-200 and canvas presence.
test('Ecology world view visibly marks bundled rivers and explains the observation zoom gate', async ({
  page,
}) => {
  test.setTimeout(45_000);
  await mockBase44(page, { user: null, locations: {} });
  const net = await stubEnvironmentNetwork(page, 'ecology');
  const api = await stubEcologyApis(page);
  await page.goto('/ecology');
  const map = page.getByTestId('env-map');
  await expect
    .poll(async () => Number(await map.getAttribute('data-segments')), { timeout: 20_000 })
    .toBeGreaterThan(0);
  await expect(page.getByTestId('ecology-guidance')).toContainText('Zoom in');
  await expect(page.getByTestId('env-legend')).toHaveCount(0);
  expect(api.inatRequests).toHaveLength(0);
  expect(net.tileRequests).toHaveLength(0);
  // The old 12-second detail-tile timer falsely failed a view that requested no detail tiles.
  await page.waitForTimeout(12_500);
  await expect(map).toHaveAttribute('data-status', 'ready');
  expect(net.tileRequests).toHaveLength(0);
});

test('fauna is a source-linked dated observation with positional uncertainty, not a generated hotspot', async ({
  page,
}) => {
  await mockBase44(page, { user: null, locations: {} });
  await stubEnvironmentNetwork(page, 'ecology');
  const api = await stubEcologyApis(page);
  await page.goto('/ecology?lat=13.75&lng=100.5&z=7');
  const mobileList = (page.viewportSize()?.width ?? 1280) < 1024;
  await expect(page.getByRole('button', { name: /^Animals 1$/ })).toBeVisible({
    timeout: 20_000,
  });
  if (mobileList) await page.getByRole('button', { name: 'List', exact: true }).click();
  const card = page.getByRole('button', { name: /Eurasian tree sparrow/ });
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.click();
  if (mobileList) await page.getByRole('button', { name: 'Map', exact: true }).click();
  const detail = page.getByTestId('env-detail');
  await expect(detail).toContainText('Animals');
  await expect(detail).toContainText('Position accuracy');
  await expect(detail).toContainText('Unknown; not an exact location');
  await expect(detail.getByRole('link', { name: 'View on iNaturalist' })).toHaveAttribute(
    'href',
    'https://www.inaturalist.org/observations/a1',
  );
  await expect
    .poll(
      async () =>
        page
          .getByTestId('env-map')
          .evaluate(renderedGeometry, { sourceId: 'ooh-env-ref', layerId: 'ooh-env-ref-points' }),
      { timeout: 20_000 },
    )
    .not.toBeNull();
  expect(api.inatRequests.some((u) => u.searchParams.get('taxon_id') === '1')).toBe(true);
  await expect
    .poll(
      async () =>
        (
          await page
            .getByTestId('env-map')
            .evaluate(renderedGeometry, { sourceId: 'ooh-env-ref', layerId: 'ooh-env-ref-points' })
        )?.rendered.includes('animals:a1'),
      { timeout: 20_000 },
    )
    .toBe(true);
  const geometry = await page
    .getByTestId('env-map')
    .evaluate(renderedGeometry, { sourceId: 'ooh-env-ref', layerId: 'ooh-env-ref-points' });
  expect(
    geometry?.features.find((f: any) => f.properties.id === 'animals:a1').geometry.coordinates,
  ).toEqual([100.55, 13.746]);
  expect(api.stats.llmCalls).toBe(0);
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 844, height: 390 },
]) {
  test(`shared flat-map Earth layers load real fauna metadata at ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      localStorage.setItem('ooh-map-view', JSON.stringify('flat'));
    });
    await mockBase44(page, { user: null, locations: {} });
    await stubEcologyApis(page);
    await page.goto('/map');
    const flat = page.getByRole('button', { name: 'Flat map', exact: true });
    if (await flat.isVisible()) await flat.click();
    const layers = page.getByTestId('earth-layers');
    await expect(layers).toBeVisible({ timeout: 20_000 });
    await expect(layers).toHaveAttribute('data-engine', 'leaflet');
    await layers.getByRole('button', { name: 'Earth layers', exact: true }).click();
    await layers.getByRole('button', { name: 'Animals · observations', exact: true }).click();
    await expect(layers).toHaveAttribute('data-observations', '1', { timeout: 20_000 });
    await layers.getByRole('button', { name: 'Earth layers', exact: true }).click();
    const marker = page.locator('path.ooh-earth-observation');
    await marker.click();
    await expect(page.locator('.leaflet-popup-content')).toContainText('Eurasian tree sparrow');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
  });
}

test('shared Main Map globe renders sourced rivers without activating observation requests', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('ooh-map-view', JSON.stringify('globe'));
  });
  await mockBase44(page, { user: null, locations: {} });
  await stubEnvironmentNetwork(page);
  const api = await stubEcologyApis(page);
  await page.goto('/map');
  const layers = page.getByTestId('earth-layers');
  await expect(layers).toHaveAttribute('data-engine', 'maplibre', { timeout: 20_000 });
  await expect
    .poll(
      async () =>
        (
          await layers.evaluate(renderedGeometry, {
            sourceId: 'ooh-earth-reference',
            layerId: 'ooh-earth-rivers',
          })
        )?.rendered.length ?? 0,
      { timeout: 20_000 },
    )
    .toBeGreaterThan(0);
  expect(api.inatRequests).toHaveLength(0);
});
