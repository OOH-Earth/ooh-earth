import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';
import { stubEnvironmentNetwork, stubEcologyApis } from './fixtures/environmentNetwork';

// Rendering and behaviour are asserted independently from API-200 and canvas presence.
test('Ecology world view visibly marks bundled rivers and explains the observation zoom gate', async ({
  page,
}) => {
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
});

test('fauna is a source-linked dated observation with positional uncertainty, not a generated hotspot', async ({
  page,
}) => {
  await mockBase44(page, { user: null, locations: {} });
  await stubEnvironmentNetwork(page, 'ecology');
  const api = await stubEcologyApis(page);
  await page.goto('/ecology?lat=13.75&lng=100.5&z=7');
  const card = page.getByRole('button', { name: /Eurasian tree sparrow/ });
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.click();
  const detail = page.getByTestId('env-detail');
  await expect(detail).toContainText('Animals');
  await expect(detail).toContainText('Position accuracy');
  await expect(detail).toContainText('Unknown; not an exact location');
  await expect(detail.getByRole('link', { name: 'View on iNaturalist' })).toHaveAttribute(
    'href',
    'https://www.inaturalist.org/observations/a1',
  );
  expect(api.inatRequests.some((u) => u.searchParams.get('taxon_id') === '1')).toBe(true);
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
    const marker = page.locator('.leaflet-interactive').last();
    await marker.click();
    await expect(page.locator('.leaflet-popup-content')).toContainText('Eurasian tree sparrow');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
  });
}
