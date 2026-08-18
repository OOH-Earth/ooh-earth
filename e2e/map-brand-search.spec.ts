import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// Map.jsx's search box previously only matched a location's title/address --
// searching "Shell" or "Shell plc" found nothing unless that text happened
// to appear in the title, even though brand_name/parent_corp were already
// captured fields. Extends the same query match to include them, so brand
// and corporate footprint (see RelatedLocations.jsx's "same parent
// corporation" group) are also discoverable via map filtering/search.

function seedLocations() {
  return {
    'loc-shell': {
      id: 'loc-shell',
      title: 'Billboard · Riverside Ave',
      type: 'billboard',
      address: '1 Riverside Ave, Testville',
      lat: 13.75,
      lng: 100.5,
      status: 'verified',
      access_key: 'none',
      brand_name: 'Shell',
      parent_corp: 'Shell plc',
    },
    'loc-mcd': {
      id: 'loc-mcd',
      title: 'Digital · Main Square',
      type: 'digital',
      address: '2 Main Square, Testville',
      lat: 13.76,
      lng: 100.51,
      status: 'verified',
      access_key: 'none',
      brand_name: "McDonald's",
      parent_corp: "McDonald's Corporation",
    },
  };
}

test.describe('Map — search matches brand and parent corporation', () => {
  test('searching a brand name filters the results list to that location', async ({ page }) => {
    await mockBase44(page, { user: null, locations: seedLocations(), locationPhotos: [] });

    await page.goto('/map');
    await expect(page.getByText('Riverside Ave').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Main Square').first()).toBeVisible();

    await page.getByRole('textbox', { name: 'Search map' }).first().fill('shell');

    await expect(page.getByText('Riverside Ave').first()).toBeVisible();
    await expect(page.getByText('Main Square')).toHaveCount(0);
  });

  test('searching a parent corporation name filters to matching locations', async ({ page }) => {
    await mockBase44(page, { user: null, locations: seedLocations(), locationPhotos: [] });

    await page.goto('/map');
    await expect(page.getByText('Riverside Ave').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('textbox', { name: 'Search map' }).first().fill("mcdonald's corporation");

    await expect(page.getByText('Main Square').first()).toBeVisible();
    await expect(page.getByText('Riverside Ave')).toHaveCount(0);
  });
});
