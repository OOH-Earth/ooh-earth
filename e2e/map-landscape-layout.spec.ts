import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

const LANDSCAPE_VIEWPORTS = [
  { width: 844, height: 390 },
  { width: 915, height: 412 },
];

for (const viewport of LANDSCAPE_VIEWPORTS) {
  test.describe(`Map landscape layout ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('keeps a usable map canvas and its controls above the mobile navigation', async ({
      page,
    }) => {
      await page.addInitScript(() => localStorage.clear());
      await mockBase44(page, {
        user: null,
        locations: {
          landscape: {
            id: 'landscape',
            title: 'Landscape regression marker',
            type: 'billboard',
            status: 'verified',
            lat: 13.7563,
            lng: 100.5018,
            address: 'Bangkok, Thailand',
          },
        },
      });

      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });

      await page.goto('/map');
      await page.getByRole('button', { name: 'Flat map' }).dispatchEvent('click');

      const map = page.locator('[data-tour="map"]');
      await expect(map).toBeVisible({ timeout: 10_000 });
      const mapBox = await map.boundingBox();
      const navBox = await page.locator('nav.fixed').boundingBox();

      expect(mapBox, 'map container should be measurable').not.toBeNull();
      expect(navBox, 'mobile navigation should be measurable').not.toBeNull();
      expect(mapBox!.height, 'landscape map canvas should remain useful').toBeGreaterThanOrEqual(
        200,
      );
      expect(
        mapBox!.y + mapBox!.height,
        'bottom navigation must not cover the map',
      ).toBeLessThanOrEqual(navBox!.y + 1);
      await expect(page.getByRole('button', { name: 'Flat map' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Globe view' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Fullscreen map' }).first()).toBeVisible();
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <= window.innerWidth &&
            document.body.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      expect(filterCrashes(errors), errors.join('\n')).toEqual([]);
    });
  });
}
