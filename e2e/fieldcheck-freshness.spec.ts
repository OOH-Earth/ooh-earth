import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, type MockDb } from './fixtures/mockBase44';

// FieldCheckPanel's "Last confirmed" freshness line (computeFreshness() in
// src/components/ooh/FieldCheckPanel.jsx). Deliberately NOT a fabricated
// stale/fresh verdict with an invented day threshold -- follows the same
// honest-elapsed-time philosophy as the existing TimeSinceTag component
// (src/components/ooh/TimeSinceTag.jsx, "tagged 3d ago", no editorializing).
// "Confirmed" = the more recent of the location's own verified intake
// (status_updated_at) or a later VERIFIED re-check's created_date -- a
// re-check genuinely re-confirms the spot, so it counts.

const DAY = 86_400_000;

function loc(overrides: Record<string, unknown> = {}) {
  return {
    id: 'loc-fresh-1',
    title: 'Billboard · Freshness Regression',
    type: 'billboard',
    lat: 13.75,
    lng: 100.55,
    status: 'verified',
    image_url: '',
    ...overrides,
  };
}

function lastConfirmed(page: import('@playwright/test').Page) {
  return page.getByText(/Last confirmed/i);
}

test.describe('FieldCheckPanel — freshness (Last confirmed)', () => {
  test('genuinely fresh: a recent verified re-check is the source of "Last confirmed"', async ({
    page,
  }) => {
    const db: MockDb = {
      user: null,
      // Location's own intake is old -- the recent re-check must be what
      // "Last confirmed" reports, not the stale intake date.
      locations: {
        'loc-fresh-1': loc({ status_updated_at: new Date(Date.now() - 300 * DAY).toISOString() }),
      },
      fieldChecks: {
        'check-1': {
          id: 'check-1',
          location_id: 'loc-fresh-1',
          status: 'verified',
          brand_name: 'Nike',
          condition: 'functional',
          created_date: new Date(Date.now() - 2 * 60_000).toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/location/loc-fresh-1');
    await expect(lastConfirmed(page)).toBeVisible({ timeout: 10_000 });
    await expect(lastConfirmed(page)).toContainText('via re-check');
    await expect(page.getByText('never re-checked')).toHaveCount(0);
  });

  test('genuinely stale: verified long ago with zero re-checks ever', async ({ page }) => {
    const db: MockDb = {
      user: null,
      locations: {
        'loc-fresh-1': loc({
          status_updated_at: new Date(Date.now() - 400 * DAY).toISOString(),
        }),
      },
    };
    await mockBase44(page, db);

    await page.goto('/location/loc-fresh-1');
    await expect(lastConfirmed(page)).toBeVisible({ timeout: 10_000 });
    await expect(lastConfirmed(page)).toContainText('at intake');
    await expect(page.getByText('never re-checked')).toBeVisible();
  });

  test('recently re-checked: a fresh verified check outranks an older verified one and the stale intake date', async ({
    page,
  }) => {
    const db: MockDb = {
      user: null,
      locations: {
        'loc-fresh-1': loc({
          status_updated_at: new Date(Date.now() - 400 * DAY).toISOString(),
        }),
      },
      fieldChecks: {
        'check-old': {
          id: 'check-old',
          location_id: 'loc-fresh-1',
          status: 'verified',
          brand_name: 'Shell',
          created_date: new Date(Date.now() - 40 * DAY).toISOString(),
        },
        'check-new': {
          id: 'check-new',
          location_id: 'loc-fresh-1',
          status: 'verified',
          brand_name: 'BP',
          created_date: new Date(Date.now() - 3 * 60_000).toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/location/loc-fresh-1');
    const tag = lastConfirmed(page);
    await expect(tag).toBeVisible({ timeout: 10_000 });
    await expect(tag).toContainText('via re-check');
    // The 40-day-old check must not be what's reported -- a genuinely
    // multi-day-old elapsed label would contain a "d" (days) unit; the
    // 3-minutes-old one only ever renders minutes/seconds.
    const text = await tag.textContent();
    expect(text).not.toMatch(/\d+d\b/);
    await expect(page.getByText('never re-checked')).toHaveCount(0);
  });

  test('a pending (unverified) re-check does not become "Last confirmed", but is flagged as awaiting verification', async ({
    page,
  }) => {
    const db: MockDb = {
      user: null,
      locations: {
        'loc-fresh-1': loc({
          status_updated_at: new Date(Date.now() - 40 * DAY).toISOString(),
        }),
      },
      fieldChecks: {
        'check-pending': {
          id: 'check-pending',
          location_id: 'loc-fresh-1',
          status: 'pending',
          brand_name: 'Adidas',
          created_date: new Date(Date.now() - 60_000).toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/location/loc-fresh-1');
    const tag = lastConfirmed(page);
    await expect(tag).toBeVisible({ timeout: 10_000 });
    // Still sourced from the verified intake -- the pending check's brand
    // must not silently become the confirmed source.
    await expect(tag).toContainText('at intake');
    await expect(page.getByText('newer re-check pending verification')).toBeVisible();
    await expect(page.getByText('never re-checked')).toHaveCount(0);
  });

  test('no FieldChecks at all: freshness still renders from the location record alone', async ({
    page,
  }) => {
    const db: MockDb = {
      user: null,
      locations: {
        'loc-fresh-1': loc({ status_updated_at: new Date(Date.now() - 5 * DAY).toISOString() }),
      },
    };
    await mockBase44(page, db);

    await page.goto('/location/loc-fresh-1');
    await expect(lastConfirmed(page)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('never re-checked')).toBeVisible();
    await expect(page.getByText('newer re-check pending verification')).toHaveCount(0);
  });

  test('anonymous visitor: the freshness line renders identically with no auth and no crash', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const db: MockDb = {
      user: null,
      locations: {
        'loc-fresh-1': loc({ status_updated_at: new Date(Date.now() - 300 * DAY).toISOString() }),
      },
      fieldChecks: {
        'check-1': {
          id: 'check-1',
          location_id: 'loc-fresh-1',
          status: 'verified',
          brand_name: 'Nike',
          created_date: new Date(Date.now() - 90_000).toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/location/loc-fresh-1');
    await expect(lastConfirmed(page)).toBeVisible({ timeout: 10_000 });
    await expect(lastConfirmed(page)).toContainText('via re-check');

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });
});
