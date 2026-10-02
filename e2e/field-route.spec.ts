import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// /field-route is the public view of the session-only "field route" anyone
// (anonymous included) builds via "Add to field route" on Map.jsx and
// LocationDetail.jsx. Before this page existed, the only place that ever
// rendered that list was FieldMissionPanel inside PortalOps, which requires
// agency/admin access -- so an ordinary or anonymous visitor who added
// locations could never see, progress, or clear the list they'd just built.
// These tests exercise the page directly against the real sessionStorage
// shape those flows write, with no entity reads/writes and no auth.

const MISSION = {
  version: 1,
  cap: 20,
  reference: null,
  ordering: 'PRIORITY THEN LOCATION ID',
  progress: {},
  items: [
    {
      id: 'loc-a',
      title: 'Billboard · North Gate',
      type: 'billboard',
      address: '10 North Rd',
      lat: 13.76,
      lng: 100.52,
      distance_m: 420,
    },
    {
      id: 'loc-b',
      title: 'Adbusting · River Wall',
      type: 'adbusting',
      address: '2 River St',
      lat: 13.75,
      lng: 100.5,
      distance_m: null,
    },
  ],
};

test.describe('FieldRoute — public field route page', () => {
  test('anonymous visitor with no saved route sees a clean empty state', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/field-route');
    await expect(page.getByTestId('field-route-empty')).toBeVisible();
    await expect(page.getByTestId('field-route-item')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Open the map/i })).toHaveAttribute('href', '/map');
    expect(filterCrashes(errors), errors.join('\n')).toEqual([]);
  });

  test('anonymous visitor sees their real saved route, can progress and clear it', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.addInitScript((mission) => {
      sessionStorage.setItem('ooh-field-mission-v1', JSON.stringify(mission));
    }, MISSION);
    await page.goto('/field-route');

    await expect(page.getByTestId('field-route-count')).toContainText('2 locations');
    const items = page.getByTestId('field-route-item');
    await expect(items).toHaveCount(2);
    await expect(items.first()).toContainText('North Gate');
    await expect(items.first()).toContainText('420');
    await expect(items.nth(1)).toContainText('River Wall');
    await expect(items.nth(1)).toContainText('DISTANCE UNKNOWN');

    await expect(page.getByRole('link', { name: /View on map/i })).toHaveAttribute(
      'href',
      '/map?mission=loc-a%2Cloc-b',
    );
    await expect(items.first().getByRole('link', { name: 'Open' })).toHaveAttribute(
      'href',
      '/location/loc-a?from=field-route',
    );

    // Progress a real item and confirm it persists in sessionStorage, not
    // just in component state.
    await items.first().getByRole('combobox').selectOption('COMPLETED');
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(sessionStorage.getItem('ooh-field-mission-v1') || 'null')?.progress?.[
              'loc-a'
            ],
        ),
      )
      .toBe('COMPLETED');

    await page.getByRole('button', { name: 'Clear route' }).click();
    await expect(page.getByTestId('field-route-empty')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem('ooh-field-mission-v1')))
      .toBeNull();
  });

  test('no Location/LocationPhoto reads or writes happen on this page -- it is sessionStorage only', async ({
    page,
  }) => {
    // SiteSetting/PageMeta reads are the global app shell's own config
    // fetches, made on every route regardless of page; what this page must
    // never do is fetch or write Location/LocationPhoto data to render a
    // route that already has everything it needs in sessionStorage.
    const locationRequests: string[] = [];
    page.on('request', (request) => {
      if (/\/entities\/Location(Photo)?\b/.test(request.url()))
        locationRequests.push(request.url());
    });
    await mockBase44(page, { user: null, locations: {} });
    await page.addInitScript((mission) => {
      sessionStorage.setItem('ooh-field-mission-v1', JSON.stringify(mission));
    }, MISSION);
    await page.goto('/field-route');
    await expect(page.getByTestId('field-route-item')).toHaveCount(2);
    expect(locationRequests).toEqual([]);
  });
});
