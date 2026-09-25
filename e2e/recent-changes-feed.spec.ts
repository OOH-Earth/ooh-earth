import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, type MockDb } from './fixtures/mockBase44';

// "Recently Changed" (src/components/ooh/RecentChangesFeed.jsx +
// src/hooks/useRecentFieldChanges.js) turns the existing per-location
// "What changed" derivation (detectChanges(), already shared via
// src/lib/fieldCheckFreshness.js and used by FieldCheckPanel) into a
// platform-wide feed -- the first place a genuine, verified-re-check-
// confirmed change is visible anywhere other than one /location/:id at a
// time. Deliberately conservative: only locations with 2+ VERIFIED
// re-checks are eligible; a single check compared against original intake
// is a per-location-page-only signal, not surfaced here. Public, not
// gated behind login -- this is accountability data, not a personal stat.

const DAY = 86_400_000;

function loc(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    title: `Billboard · ${id}`,
    type: 'billboard',
    lat: 13.75,
    lng: 100.55,
    status: 'verified',
    image_url: '',
    ...overrides,
  };
}

function feedSection(page: import('@playwright/test').Page) {
  return page.getByText('Recently Changed').locator('../..');
}

test.describe('Recently Changed — platform-wide field intelligence feed', () => {
  test('a location with 2 verified checks and a genuine brand change appears in the feed', async ({
    page,
  }) => {
    const db: MockDb = {
      user: null,
      locations: { 'loc-a': loc('loc-a') },
      fieldChecks: {
        'check-new': {
          id: 'check-new',
          location_id: 'loc-a',
          status: 'verified',
          brand_name: 'BP',
          created_date: new Date(Date.now() - 60_000).toISOString(),
        },
        'check-old': {
          id: 'check-old',
          location_id: 'loc-a',
          status: 'verified',
          brand_name: 'Shell',
          created_date: new Date(Date.now() - 5 * DAY).toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/operative');
    const section = feedSection(page);
    await expect(section).toBeVisible({ timeout: 20_000 });
    await expect(section.getByText('Shell')).toBeVisible();
    await expect(section.getByText('BP')).toBeVisible();
    await expect(section.getByRole('link', { name: /loc-a/i })).toHaveAttribute(
      'href',
      '/location/loc-a',
    );
  });

  test('two verified checks with no genuine difference never appear', async ({ page }) => {
    const db: MockDb = {
      user: null,
      locations: { 'loc-b': loc('loc-b') },
      fieldChecks: {
        'check-1': {
          id: 'check-1',
          location_id: 'loc-b',
          status: 'verified',
          brand_name: 'Nike',
          created_date: new Date(Date.now() - 60_000).toISOString(),
        },
        'check-2': {
          id: 'check-2',
          location_id: 'loc-b',
          status: 'verified',
          brand_name: 'Nike',
          created_date: new Date(Date.now() - 5 * DAY).toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/operative');
    await expect(page.getByText(/Authentication Required/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Recently Changed')).toHaveCount(0);
  });

  test('a location with only one verified check is never included (2+ required)', async ({
    page,
  }) => {
    const db: MockDb = {
      user: null,
      locations: { 'loc-c': loc('loc-c', { brand_name: 'Shell' }) },
      fieldChecks: {
        'check-only': {
          id: 'check-only',
          location_id: 'loc-c',
          status: 'verified',
          brand_name: 'BP',
          created_date: new Date().toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/operative');
    await expect(page.getByText(/Authentication Required/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Recently Changed')).toHaveCount(0);
  });

  test('a pending check does not count toward the 2-verified-checks threshold', async ({
    page,
  }) => {
    const db: MockDb = {
      user: null,
      locations: { 'loc-d': loc('loc-d') },
      fieldChecks: {
        'check-verified': {
          id: 'check-verified',
          location_id: 'loc-d',
          status: 'verified',
          brand_name: 'Shell',
          created_date: new Date(Date.now() - 5 * DAY).toISOString(),
        },
        'check-pending': {
          id: 'check-pending',
          location_id: 'loc-d',
          status: 'pending',
          brand_name: 'BP',
          created_date: new Date().toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/operative');
    await expect(page.getByText(/Authentication Required/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Recently Changed')).toHaveCount(0);
  });

  test('a rejected location is excluded even with qualifying verified checks', async ({ page }) => {
    const db: MockDb = {
      user: null,
      locations: { 'loc-e': loc('loc-e', { status: 'rejected' }) },
      fieldChecks: {
        'check-new': {
          id: 'check-new',
          location_id: 'loc-e',
          status: 'verified',
          brand_name: 'BP',
          created_date: new Date(Date.now() - 60_000).toISOString(),
        },
        'check-old': {
          id: 'check-old',
          location_id: 'loc-e',
          status: 'verified',
          brand_name: 'Shell',
          created_date: new Date(Date.now() - 5 * DAY).toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/operative');
    await expect(page.getByText(/Authentication Required/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Recently Changed')).toHaveCount(0);
  });

  test('the feed is public: visible to anonymous visitors even though the rest of the page is auth-gated', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const db: MockDb = {
      user: null,
      locations: { 'loc-f': loc('loc-f') },
      fieldChecks: {
        'check-new': {
          id: 'check-new',
          location_id: 'loc-f',
          status: 'verified',
          condition: 'damaged',
          created_date: new Date(Date.now() - 60_000).toISOString(),
        },
        'check-old': {
          id: 'check-old',
          location_id: 'loc-f',
          status: 'verified',
          condition: 'functional',
          created_date: new Date(Date.now() - 5 * DAY).toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/operative');
    // Both true simultaneously: the feed renders for real, AND the
    // personal section below it still shows its own auth gate unchanged.
    await expect(feedSection(page)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Authentication Required/i)).toBeVisible();

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });
});
