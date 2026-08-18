import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// RelatedLocations.jsx previously only cross-referenced other locations by
// exact brand_name match ("same advertiser") -- two differently-branded
// surfaces owned by the same holding company (parent_corp, e.g. two Shell
// plc brands) had no visible link between them at all, even though
// parent_corp is already a real, captured field. It now also surfaces a
// "same parent corporation" group, excluding any location already covered
// by the same-brand group so the two stay meaningfully distinct.

function trackConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

test.describe('RelatedLocations — corporate footprint via parent_corp', () => {
  test('shows a differently-branded location under the same parent corporation', async ({
    page,
  }) => {
    const consoleErrors = trackConsoleErrors(page);
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-shell-a': {
          id: 'loc-shell-a',
          title: 'Billboard · Shell Fuel Ad',
          type: 'billboard',
          address: '1 Test St, Testville',
          lat: 13.75,
          lng: 100.5,
          status: 'verified',
          access_key: 'none',
          brand_name: 'Shell',
          parent_corp: 'Shell plc',
        },
        'loc-shell-b': {
          id: 'loc-shell-b',
          title: 'Billboard · Pennzoil Motor Oil',
          type: 'billboard',
          address: '99 Far Away Rd, Other City',
          lat: -33.87,
          lng: 151.21,
          status: 'verified',
          access_key: 'none',
          // Different brand, same parent -- the case with no visibility before.
          brand_name: 'Pennzoil',
          parent_corp: 'Shell plc',
        },
      },
      locationPhotos: [],
    });

    await page.goto('/location/loc-shell-a');
    await expect(page.getByText(/Same parent corporation/i)).toBeVisible();
    await expect(page.getByText('Pennzoil Motor Oil')).toBeVisible();

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });

  test('does not duplicate a same-brand match into the parent-corp group', async ({ page }) => {
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-mcd-a': {
          id: 'loc-mcd-a',
          title: "Billboard · McDonald's Meal Deal",
          type: 'billboard',
          address: '1 Test St, Testville',
          lat: 13.75,
          lng: 100.5,
          status: 'verified',
          access_key: 'none',
          brand_name: "McDonald's",
          parent_corp: "McDonald's Corporation",
        },
        'loc-mcd-b': {
          id: 'loc-mcd-b',
          title: "Billboard · McDonald's Breakfast",
          type: 'billboard',
          address: '99 Far Away Rd, Other City',
          lat: -33.87,
          lng: 151.21,
          status: 'verified',
          access_key: 'none',
          // Same brand AND same parent -- must land only in "same advertiser".
          brand_name: "McDonald's",
          parent_corp: "McDonald's Corporation",
        },
      },
      locationPhotos: [],
    });

    await page.goto('/location/loc-mcd-a');
    await expect(page.getByText(/Same advertiser/i)).toBeVisible();
    await expect(page.getByText(/Same parent corporation/i)).toHaveCount(0);
  });
});
