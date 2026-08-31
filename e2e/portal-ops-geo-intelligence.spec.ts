import { test, expect } from '@playwright/test';
import { mockBase44, type MockDb } from './fixtures/mockBase44';

// PortalOps.jsx's "Geospatial Intelligence" tab wires the deterministic
// primitives in src/lib/geospatialIntelligence.js / src/lib/locationQuality.js
// (bounded Location + FieldCheck reads -> quality/freshness classification,
// verification queue, coverage, possible-duplicate detection) into a real,
// admin-facing decision surface. This asserts it renders real classifications
// derived from fixture data, not placeholder/fabricated numbers.

test.describe('PortalOps — Geospatial Intelligence', () => {
  test('classifies verified/stale/pending evidence and flags a coordinate-proximity duplicate', async ({
    page,
  }) => {
    test.setTimeout(30_000);

    const now = Date.now();
    const recent = new Date(now - 60_000).toISOString();
    const old = '2020-01-01T00:00:00.000Z';

    const db: MockDb = {
      user: { id: 'admin-1', role: 'admin', email: 'admin@example.com' },
      locations: {
        'loc-verified-fresh': {
          id: 'loc-verified-fresh',
          lat: 1,
          lng: 2,
          status: 'verified',
          status_updated_at: recent,
          created_date: recent,
        },
        'loc-stale': {
          id: 'loc-stale',
          lat: 1,
          lng: 2,
          status: 'verified',
          status_updated_at: old,
          created_date: old,
        },
        'loc-pending': {
          id: 'loc-pending',
          lat: 3,
          lng: 4,
          status: 'pending',
          status_updated_at: recent,
          created_date: recent,
        },
      },
      fieldChecks: {
        'fc-1': { id: 'fc-1', location_id: 'loc-verified-fresh', created_date: recent },
      },
    };
    await mockBase44(page, db);

    await page.goto('/portal/ops?access_token=mock-admin-token');
    await page.getByRole('button', { name: 'Geospatial Intelligence' }).click();

    // Evidence profile description embeds the exact bounded counts read
    // (3 Location, 1 FieldCheck) -- proves this is derived from the fixture
    // data, not a static placeholder.
    await expect(page.getByText('3 Location, 1 FieldCheck rows')).toBeVisible();

    // Verification queue: the stale-but-verified record outranks the
    // unverified pending record (P1 before P2); the fresh/verified/checked
    // record has no open reasons and is excluded entirely (2 rows, not 3).
    const queueRows = page.locator('table tbody tr');
    await expect(queueRows).toHaveCount(2);
    await expect(queueRows.nth(0)).toContainText('P1');
    await expect(queueRows.nth(0)).toContainText('evidence is stale');
    await expect(queueRows.nth(1)).toContainText('P2');
    await expect(queueRows.nth(1)).toContainText('location is not verified');

    // Coverage: 2 of 3 valid-coordinate records carry status=verified.
    await expect(page.getByText('Geographic Coverage')).toBeVisible();
    await expect(page.getByText('Verified coords')).toBeVisible();

    // Possible duplicates: loc-verified-fresh and loc-stale share coordinates.
    await expect(page.getByText('Possible Duplicate Evidence')).toBeVisible();
    await expect(page.getByText(/coordinates within bounded proximity/)).toBeVisible();
  });
});
