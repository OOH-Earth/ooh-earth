import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// AdvertiserInfo.jsx previously only showed a Location's industry_sector
// when that field was explicitly filled in during reporting -- if the
// reporter named a recognized parent corp (e.g. "Shell plc") but skipped
// the separate sector picker, the sector silently never appeared even
// though it's knowable. advertiserRegistry.js's PARENT_CORP_SECTOR_GROUPS
// (derived from the same data already used for datalist suggestions) now
// backs a lookupParentCorpSector() suggestion shown as
// "Sector (from registry)" in that gap. A location with an unrecognized
// parent corp, or one where industry_sector was explicitly set, is
// unaffected -- covered by the second/third assertions below.

function trackConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

test.describe('AdvertiserInfo — sector inferred from a recognized parent corp', () => {
  test('shows "Sector (from registry)" when industry_sector was left blank', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-sector-infer': {
          id: 'loc-sector-infer',
          title: 'Billboard · Sector Inference Check',
          type: 'billboard',
          address: '1 Test St, Testville',
          lat: 13.75,
          lng: 100.5,
          image_url: '',
          status: 'verified',
          status_updated_at: null,
          access_key: 'none',
          parent_corp: 'Shell plc',
          // industry_sector intentionally omitted.
        },
      },
      locationPhotos: [],
    });

    await page.goto('/location/loc-sector-infer');
    await expect(page.getByText('Sector (from registry)')).toBeVisible();
    await expect(page.getByText('Fossil Fuel')).toBeVisible();

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });

  test('does not show an inferred sector for an unrecognized parent corp', async ({ page }) => {
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-sector-unknown': {
          id: 'loc-sector-unknown',
          title: 'Billboard · Unknown Parent Corp',
          type: 'billboard',
          address: '2 Test St, Testville',
          lat: 13.76,
          lng: 100.51,
          image_url: '',
          status: 'verified',
          status_updated_at: null,
          access_key: 'none',
          parent_corp: 'Totally Unknown Local Co',
        },
      },
      locationPhotos: [],
    });

    await page.goto('/location/loc-sector-unknown');
    await expect(page.getByText('Totally Unknown Local Co')).toBeVisible();
    await expect(page.getByText(/Sector \(from registry\)/)).toHaveCount(0);
  });

  test('an explicitly-set industry_sector wins over the registry suggestion', async ({ page }) => {
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-sector-explicit': {
          id: 'loc-sector-explicit',
          title: 'Billboard · Explicit Sector',
          type: 'billboard',
          address: '3 Test St, Testville',
          lat: 13.77,
          lng: 100.52,
          image_url: '',
          status: 'verified',
          status_updated_at: null,
          access_key: 'none',
          parent_corp: 'Shell plc',
          industry_sector: 'automotive',
        },
      },
      locationPhotos: [],
    });

    await page.goto('/location/loc-sector-explicit');
    // The confirmed field, not the (different) registry-inferred one.
    await expect(page.getByText('Sector', { exact: true })).toBeVisible();
    await expect(page.getByText('Automotive', { exact: true })).toBeVisible();
    await expect(page.getByText(/Sector \(from registry\)/)).toHaveCount(0);
  });
});
