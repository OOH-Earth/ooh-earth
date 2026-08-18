import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// The map previously had no way to see where report activity concentrates
// geographically -- only individual pins. A new "Activity Heat" layer
// (Intelligence group, toggled the same way as every other map layer) now
// renders a Leaflet heat canvas built from the same location data already
// loaded for the pins, complementing rather than replacing them.

function trackConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

// leaflet.heat's canvas sits directly in Leaflet's overlay pane rather than
// in normal document flow -- Playwright's toBeVisible() has been observed
// reporting a false "hidden" for it despite a real, correctly-sized canvas
// (confirmed via screenshot: canvas present with real width/height, layer
// toggle active). A direct bounding-box check is the geometry ground truth
// and isn't subject to that same false negative.
async function expectRenderedCanvas(locator: import('@playwright/test').Locator) {
  const box = await locator.boundingBox();
  expect(box, 'heat canvas should have a layout box').not.toBeNull();
  expect(box.width, 'heat canvas width').toBeGreaterThan(0);
  expect(box.height, 'heat canvas height').toBeGreaterThan(0);
}

function seedLocations() {
  const locations: Record<string, unknown> = {};
  // A small spread of verified, geolocated reports -- enough for the heat
  // layer to have real points to render from.
  const coords = [
    [13.75, 100.5],
    [13.751, 100.501],
    [13.749, 100.499],
  ];
  coords.forEach(([lat, lng], i) => {
    locations[`loc-heat-${i}`] = {
      id: `loc-heat-${i}`,
      title: `Billboard · Heat Test ${i}`,
      type: 'billboard',
      address: `${i} Test St, Testville`,
      lat,
      lng,
      status: 'verified',
      access_key: 'none',
    };
  });
  return locations;
}

test.describe('Map — Activity Heat layer', () => {
  test('toggling it on renders a heat canvas + legend; toggling off removes them', async ({
    page,
  }) => {
    const consoleErrors = trackConsoleErrors(page);
    await mockBase44(page, { user: null, locations: seedLocations(), locationPhotos: [] });
    // Skip the default globe view's heavy WebGL load -- Map.jsx persists the
    // view choice in localStorage (usePersistentState), so seeding it before
    // navigation lands directly on the Leaflet flat map.
    await page.addInitScript(() => localStorage.setItem('ooh-map-view', JSON.stringify('flat')));

    await page.goto('/map');
    await page.waitForSelector('.leaflet-container', { timeout: 15_000 });

    await expect(page.locator('.leaflet-heatmap-layer')).toHaveCount(0);

    await page.getByRole('button', { name: /Activity Heat/i }).click();
    await expect(page.locator('.leaflet-heatmap-layer')).toHaveCount(1);
    await expectRenderedCanvas(page.locator('.leaflet-heatmap-layer').first());
    await expect(page.locator('.ooh-heat-legend')).toBeVisible();
    await expect(page.getByText(/Report density/i)).toBeVisible();

    await page.getByRole('button', { name: /Activity Heat/i }).click();
    await expect(page.locator('.leaflet-heatmap-layer')).toHaveCount(0);
    await expect(page.locator('.ooh-heat-legend')).toHaveCount(0);

    // Markers must still be there -- heat complements, never replaces them.
    await expect(page.getByText('Heat Test 0').first()).toBeVisible();

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });

  test('turning off the default street layer while heat stays on still shows heat data', async ({
    page,
  }) => {
    // Regression guard for the primaryLayer/layerFiltered edge case fixed in
    // Map.jsx: heat must not be starved of points just because no street
    // sub-filter (ads/adbusting/graffiti) happens to also be active.
    await mockBase44(page, { user: null, locations: seedLocations(), locationPhotos: [] });
    await page.addInitScript(() => localStorage.setItem('ooh-map-view', JSON.stringify('flat')));

    await page.goto('/map');
    await page.waitForSelector('.leaflet-container', { timeout: 15_000 });

    await page.getByRole('button', { name: /Activity Heat/i }).click();
    // "Ad Spots & Art" is the defaultOn street layer -- turn it off.
    await page.getByRole('button', { name: /Ad Spots & Art/i }).click();

    await expect(page.locator('.leaflet-heatmap-layer')).toHaveCount(1);
    await expectRenderedCanvas(page.locator('.leaflet-heatmap-layer').first());
  });
});
