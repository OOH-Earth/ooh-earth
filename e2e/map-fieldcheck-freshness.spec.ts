import { test, expect, type Page } from '@playwright/test';
import { mockBase44, filterCrashes, type MockDb } from './fixtures/mockBase44';

// Propagates the "Last confirmed" freshness signal already established by
// FieldCheckPanel (src/lib/fieldCheckFreshness.js, shared by both surfaces)
// into the map's LocationCard -- reusing the exact same semantics (most
// recent VERIFIED confirmation wins, "newer re-check pending verification"
// only when genuinely newer, never a fabricated stale/fresh verdict). No
// new fetch: Map.jsx's reloadLocations() already fetched all verified
// FieldChecks globally for the "living record" pin flag; the fetch was
// widened (not duplicated) to also cover pending checks, which the
// freshness signal needs.

const DAY = 86_400_000;

function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

// Map.jsx renders its results list twice (desktop cards panel + mobile
// MapBottomSheet), both always in the DOM -- same duplication
// map-my-discoveries.spec.ts already documents and works around.
function card(page: Page, title: string) {
  return page.locator('[role="button"]').filter({ hasText: title }).first();
}

async function openMap(page: Page) {
  await page.addInitScript(() => localStorage.setItem('ooh-map-view', JSON.stringify('flat')));
  await page.goto('/map');
  await page.waitForSelector('.leaflet-container', { timeout: 15_000 });
}

test.describe('Map — FieldCheck freshness on LocationCard', () => {
  test('verified intake, no re-checks: the card shows a real elapsed-time confirmation', async ({
    page,
  }) => {
    const db: MockDb = {
      user: null,
      locations: {
        'loc-a': {
          id: 'loc-a',
          title: 'Billboard · Intake Only',
          type: 'billboard',
          lat: 13.75,
          lng: 100.5,
          status: 'verified',
          status_updated_at: new Date(Date.now() - 5 * DAY).toISOString(),
        },
      },
    };
    await mockBase44(page, db);
    await openMap(page);

    const c = card(page, 'Billboard · Intake Only');
    await expect(c).toBeVisible({ timeout: 15_000 });
    await expect(c.getByText(/^\d+[smhd]$/)).toBeVisible();
  });

  test('a later verified re-check wins over a stale original intake date', async ({ page }) => {
    const db: MockDb = {
      user: null,
      locations: {
        'loc-b': {
          id: 'loc-b',
          title: 'Billboard · Rechecked Recently',
          type: 'billboard',
          lat: 13.76,
          lng: 100.51,
          status: 'verified',
          status_updated_at: new Date(Date.now() - 400 * DAY).toISOString(),
        },
      },
      fieldChecks: {
        'check-1': {
          id: 'check-1',
          location_id: 'loc-b',
          status: 'verified',
          created_date: new Date(Date.now() - 2 * 60_000).toISOString(),
        },
      },
    };
    await mockBase44(page, db);
    await openMap(page);

    const c = card(page, 'Billboard · Rechecked Recently');
    const tag = c.getByText(/^\d+[smhd]$/);
    await expect(tag).toBeVisible({ timeout: 15_000 });
    // A 400-day-old intake would render as a multi-digit day count -- the
    // 2-minutes-old re-check must be what's shown instead.
    await expect(tag).not.toHaveText(/^\d+d$/);
  });

  test('a genuinely newer pending check is flagged; an older one is not', async ({ page }) => {
    const db: MockDb = {
      user: null,
      locations: {
        'loc-c': {
          id: 'loc-c',
          title: 'Billboard · Newer Pending',
          type: 'billboard',
          lat: 13.77,
          lng: 100.52,
          status: 'verified',
          status_updated_at: new Date(Date.now() - 10 * DAY).toISOString(),
        },
        'loc-d': {
          id: 'loc-d',
          title: 'Billboard · Older Pending',
          type: 'billboard',
          lat: 13.78,
          lng: 100.53,
          status: 'verified',
          status_updated_at: new Date(Date.now() - 1 * DAY).toISOString(),
        },
      },
      fieldChecks: {
        // Submitted AFTER loc-c's intake -> genuinely newer, must be flagged.
        'check-newer': {
          id: 'check-newer',
          location_id: 'loc-c',
          status: 'pending',
          created_date: new Date(Date.now() - 60_000).toISOString(),
        },
        // Submitted BEFORE loc-d's (later) intake -> not newer, must not be
        // flagged, even though a pending check exists.
        'check-older': {
          id: 'check-older',
          location_id: 'loc-d',
          status: 'pending',
          created_date: new Date(Date.now() - 5 * DAY).toISOString(),
        },
      },
    };
    await mockBase44(page, db);
    await openMap(page);

    const newer = card(page, 'Billboard · Newer Pending');
    await expect(newer).toBeVisible({ timeout: 15_000 });
    await expect(newer.getByText('re-check pending')).toBeVisible();

    const older = card(page, 'Billboard · Older Pending');
    await expect(older).toBeVisible();
    await expect(older.getByText('re-check pending')).toHaveCount(0);
  });

  test('no genuine confirmation at all: nothing is fabricated', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    const db: MockDb = {
      user: null,
      locations: {
        'loc-e': {
          id: 'loc-e',
          title: 'Billboard · Never Confirmed',
          type: 'billboard',
          lat: 13.79,
          lng: 100.54,
          status: 'pending',
        },
      },
    };
    await mockBase44(page, db);
    await openMap(page);

    const c = card(page, 'Billboard · Never Confirmed');
    await expect(c).toBeVisible({ timeout: 15_000 });
    await expect(c.getByText(/^\d+[smhd]$/)).toHaveCount(0);
    await expect(c.getByText('re-check pending')).toHaveCount(0);

    expect(filterCrashes(errors), errors.join('\n')).toEqual([]);
  });
});
