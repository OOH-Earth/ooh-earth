import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// FieldReport's and ArLens's "View on map" links used to drop a user into a
// generic /map with no indication of which pin was theirs. Now both pass
// ?highlight=<locationId>, which Map.jsx picks up on load and runs through
// the exact same select+detail-sheet action a normal pin click already
// triggers (handleExpandPin) -- no new map architecture, just reusing
// existing selectedId-driven fly-to/visual-highlight behavior already built
// into LocationMap.jsx and Globe3D.jsx.

test.describe("Map — a user's own new contribution is highlighted via ?highlight=", () => {
  test('opens the pin detail for the matching location on load', async ({ page }) => {
    // MapBottomSheet (where detail-mode surfaces) is mobile-only -- the
    // desktop equivalent is the results-sidebar LocationCard's selected
    // border, a much less robust thing to assert on. Both share the same
    // underlying selectedId/detailItem state this fix actually sets.
    await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await mockBase44(page, {
      user: null,
      locations: {
        'loc-other': {
          id: 'loc-other',
          title: 'Some Other Billboard',
          type: 'billboard',
          address: '1 Other St',
          lat: 13.7,
          lng: 100.4,
          image_url: '',
          status: 'verified',
          access_key: 'none',
        },
        'loc-mine': {
          id: 'loc-mine',
          title: 'My New Contribution',
          type: 'billboard',
          address: '10 Test St',
          lat: 13.7563,
          lng: 100.5018,
          image_url: '',
          status: 'pending',
          access_key: 'none',
        },
      },
      locationPhotos: [],
    });

    await page.goto('/map?highlight=loc-mine');
    await expect(page.getByText('// pin detail')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Close detail' })).toBeVisible();
    await expect(page.locator('text=My New Contribution >> visible=true').first()).toBeVisible();

    expect(filterCrashes(errors), errors.join('\n')).toEqual([]);
  });

  test('does nothing when the id in the URL does not match any marker', async ({ page }) => {
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-other': {
          id: 'loc-other',
          title: 'Some Other Billboard',
          type: 'billboard',
          address: '1 Other St',
          lat: 13.7,
          lng: 100.4,
          image_url: '',
          status: 'verified',
          access_key: 'none',
        },
      },
      locationPhotos: [],
    });

    await page.goto('/map?highlight=does-not-exist');
    await page.waitForTimeout(1500);
    await expect(page.getByText('// pin detail')).not.toBeVisible();
  });
});
