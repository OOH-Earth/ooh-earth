import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// The heat layer previously had no interaction of its own -- a user seeing a
// hotspot had to separately toggle the street layer back on, hunt for the
// nearest pin by eye, and click it. Clicking near a real report on the heat
// canvas now opens that report directly, the same way tapping its pin
// already does (onExpandPin), reusing the existing selectedId/detail-sheet
// machinery -- no new UI, no scoring system, no backend query.

function seedOneLocation() {
  return {
    'loc-heat-click': {
      id: 'loc-heat-click',
      title: 'Heat Click Target Billboard',
      type: 'billboard',
      address: '1 Test St, Testville',
      // Keep the fixture inside the deterministic initial Leaflet viewport.
      // Map now uses viewport-bounded retrieval and intentionally does not
      // fit the map to the first result set.
      lat: 13.746,
      lng: 100.55,
      status: 'verified',
      access_key: 'none',
    },
  };
}

// The layer-toggle bar (MapLayerToggle) is desktop-only (`hidden lg:block`
// in Map.jsx) -- there's no way to click "Activity Heat" at a mobile
// viewport, and MapBottomSheet's detail mode is mobile-only, so no single
// viewport can exercise both via UI clicks. Seeding the same
// usePersistentState-backed localStorage key Map.jsx itself writes when a
// layer is toggled sidesteps that mismatch entirely and tests the actual
// click-to-expand behavior directly. Heat only, no street layer (`ads`) --
// with no Marker elements in the DOM at all, a click can only be handled by
// the heat layer's own handler, making this unambiguous about what's being
// exercised.
function seedHeatOnlyLayers(page: import('@playwright/test').Page) {
  return page.addInitScript(() => {
    localStorage.setItem('ooh-map-view', JSON.stringify('flat'));
    localStorage.setItem('ooh-map-layers-v2', JSON.stringify(['heat']));
  });
}

test.describe('Map — clicking a heat hotspot opens the nearest report', () => {
  test('opens the pin detail sheet even with the street/marker layer off', async ({ page }) => {
    // MapBottomSheet's detail mode is mobile-only (see
    // map-contribution-highlight.spec.ts for why this is the robust thing to
    // assert on).
    await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await mockBase44(page, { user: null, locations: seedOneLocation(), locationPhotos: [] });
    await seedHeatOnlyLayers(page);

    await page.goto('/map');
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 15_000 });

    // FitBounds centers the single seeded point in the container.
    await page.waitForTimeout(800);
    const box = await mapContainer.boundingBox();
    if (!box) throw new Error('map container has no layout box');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    await expect(page.getByText('// pin detail')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Close detail' })).toBeVisible();
    await expect(
      page.locator('text=Heat Click Target Billboard >> visible=true').first(),
    ).toBeVisible();

    expect(filterCrashes(errors), errors.join('\n')).toEqual([]);
  });

  test('a click far from any report does nothing', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockBase44(page, { user: null, locations: seedOneLocation(), locationPhotos: [] });
    await seedHeatOnlyLayers(page);

    await page.goto('/map');
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(800);

    const box = await mapContainer.boundingBox();
    if (!box) throw new Error('map container has no layout box');
    // A corner, far in screen-pixels from the centered point above.
    await page.mouse.click(box.x + 5, box.y + 5);

    await expect(page.getByText('// pin detail')).not.toBeVisible();
  });
});
