import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// SubvertisingPanel previously always showed just a generic, unfiltered
// "View Media Corps registry" link whenever a location named an
// ooh_operator -- even though the MediaCorp entity (a real, structured
// registry of OOH media operators) might already have a matching record.
// It now cross-references the operator name against MediaCorp.list() and
// shows real scope/hq data inline when a match is found, falling back to
// just the link (unchanged behavior) for an unrecognized operator name.

function trackConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

test.describe('SubvertisingPanel — MediaCorp operator cross-reference', () => {
  test('shows real operator scope/hq when the name matches a MediaCorp record', async ({
    page,
  }) => {
    const consoleErrors = trackConsoleErrors(page);
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-operator-match': {
          id: 'loc-operator-match',
          title: 'Billboard · Operator Match Check',
          type: 'billboard',
          address: '1 Test St, Testville',
          lat: 13.75,
          lng: 100.5,
          image_url: '',
          adbust_type: 'subverted',
          adbust_image_url: 'https://example.com/after.jpg',
          status: 'verified',
          status_updated_at: null,
          access_key: 'none',
          ooh_operator: 'JCDecaux',
        },
      },
      locationPhotos: [],
    });
    // Registered after mockBase44 so it takes precedence -- Playwright
    // matches the most-recently-registered overlapping route first.
    await page.route('**/entities/MediaCorp**', (route) =>
      route.fulfill({
        json: [
          {
            id: 'mc-1',
            name: 'JCDecaux',
            hq: 'Paris, France',
            scope: 'global',
            countries: 80,
          },
        ],
      }),
    );

    await page.goto('/location/loc-operator-match');
    await expect(page.getByText('Paris, France')).toBeVisible();
    await expect(page.getByRole('link', { name: /View Media Corps registry/i })).toBeVisible();

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });

  test('falls back to just the registry link for an unrecognized operator', async ({ page }) => {
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-operator-unknown': {
          id: 'loc-operator-unknown',
          title: 'Billboard · Unknown Operator Check',
          type: 'billboard',
          address: '2 Test St, Testville',
          lat: 13.76,
          lng: 100.51,
          image_url: '',
          adbust_type: 'subverted',
          adbust_image_url: 'https://example.com/after.jpg',
          status: 'verified',
          status_updated_at: null,
          access_key: 'none',
          ooh_operator: 'Totally Unknown Local Operator Co',
        },
      },
      locationPhotos: [],
    });
    await page.route('**/entities/MediaCorp**', (route) =>
      route.fulfill({
        json: [{ id: 'mc-1', name: 'JCDecaux', hq: 'Paris, France', scope: 'global' }],
      }),
    );

    await page.goto('/location/loc-operator-unknown');
    await expect(page.getByRole('link', { name: /View Media Corps registry/i })).toBeVisible();
    await expect(page.getByText('Paris, France')).toHaveCount(0);
  });
});
