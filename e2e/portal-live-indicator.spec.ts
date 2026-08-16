import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// AdbustingPortal/GraffitiPortal silently fall back to hardcoded seed
// markers (src/components/ooh/mapSeed.js) when the real Location list is
// empty, so a first-time visitor never sees a blank map -- reasonable. But
// the resulting "live: false" flag was computed and then discarded: nothing
// in the UI distinguished sample placeholder locations from real public
// reports, so a new user landing on the primary adbusting-discovery surface
// had no way to tell "24 results" was demo data, not the live archive.
// PortalShell now renders the same live/sample indicator pattern MapToolbar
// already used on /map's desktop toolbar (but wired to both portals, and
// visible on every viewport, not desktop-only).

test.describe('Adbusting/Graffiti portals — sample vs. live data is disclosed', () => {
  test('shows "sample data" when the Location list is empty (seed fallback)', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await mockBase44(page, { user: null, locations: {} });

    await page.goto('/adbusting');
    await expect(page.getByText('sample data', { exact: true })).toBeVisible();
    await expect(page.getByText('live', { exact: true })).not.toBeVisible();

    await page.goto('/graffiti');
    await expect(page.getByText('sample data', { exact: true })).toBeVisible();

    expect(filterCrashes(errors), errors.join('\n')).toEqual([]);
  });

  test('shows "live" (not "sample data") once real reports exist', async ({ page }) => {
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-live-1': {
          id: 'loc-live-1',
          title: 'Billboard · Real Field Report',
          type: 'billboard',
          address: '10 Test St, Testville',
          lat: 13.75,
          lng: 100.5,
          image_url: '',
          status: 'verified',
          access_key: 'none',
        },
      },
      locationPhotos: [],
    });

    await page.goto('/adbusting');
    await expect(page.getByText('live', { exact: true })).toBeVisible();
    await expect(page.getByText('sample data', { exact: true })).not.toBeVisible();
  });
});
