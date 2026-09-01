import { test, expect } from '@playwright/test';
import { mockBase44, type MockDb } from './fixtures/mockBase44';

// PortalOps.jsx's "Geospatial Intelligence" tab wires the deterministic
// primitives in src/lib/geospatialIntelligence.js / src/lib/locationQuality.js
// (bounded Location + FieldCheck reads -> quality/freshness classification,
// verification queue, coverage, true-distance possible-duplicate detection)
// into a real, admin-facing decision surface. This asserts it renders real
// classifications derived from fixture data, not placeholder/fabricated
// numbers, and that the duplicate panel is the meter-based findPossibleDuplicates
// path (PR #207), not the retired degree-bounding-box heuristic.

test.describe('PortalOps — Geospatial Intelligence', () => {
  test('classifies verified/stale/pending evidence and flags a true-distance duplicate candidate', async ({
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
          // ~5.5m from loc-verified-fresh: within the 50m default radius,
          // but not coordinate-identical -- proves true-distance detection
          // rather than an exact-match or degree-bounding-box heuristic.
          lat: 1.00005,
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

    // Possible duplicates: loc-verified-fresh and loc-stale are ~5.5m apart,
    // surfaced by the true-distance findPossibleDuplicates path with a
    // review-only "POSSIBLE DUPLICATE" label (never "confirmed"), a real
    // meter distance, and each record's already-fetched status -- and never
    // an address/notes/image/created_by field the bounded read excludes.
    await expect(page.getByText('Possible Duplicate Evidence')).toBeVisible();
    await expect(page.getByText(/within 50m/)).toBeVisible();
    await expect(page.getByText(/POSSIBLE DUPLICATE/)).toBeVisible();
    await expect(page.getByText(/Distance: 5\.\d+ m/)).toBeVisible();
    await expect(page.getByText('DUPLICATE CONFIRMED')).toHaveCount(0);
  });

  // Bounded Viewport Query wires queryLocationIntelligence (merged, previously
  // zero real consumers) into the same tab: an operator planning a field-work
  // route can scope the already-fetched bounded read to a lat/lng box and an
  // evidence filter, and see each location's existing verification priority
  // in context -- without any additional network read.
  test('Bounded Viewport Query scopes the same bounded read by lat/lng box and evidence filter', async ({
    page,
  }) => {
    test.setTimeout(30_000);

    const now = Date.now();
    const recent = new Date(now - 60_000).toISOString();
    const old = '2020-01-01T00:00:00.000Z';

    const db: MockDb = {
      user: { id: 'admin-1', role: 'admin', email: 'admin@example.com' },
      locations: {
        'loc-in-box-stale': {
          id: 'loc-in-box-stale',
          lat: 10,
          lng: 10,
          status: 'verified',
          status_updated_at: old,
          created_date: old,
        },
        'loc-in-box-fresh': {
          id: 'loc-in-box-fresh',
          lat: 10.2,
          lng: 10.2,
          status: 'verified',
          status_updated_at: recent,
          created_date: recent,
          // Not part of GEO_LOCATION_FIELDS -- proves the viewport panel
          // never leaks it even though the underlying record carries it.
          address: '221B Secret Street',
        },
        'loc-outside-box': {
          id: 'loc-outside-box',
          lat: 50,
          lng: 50,
          status: 'verified',
          status_updated_at: recent,
          created_date: recent,
        },
      },
      fieldChecks: {},
    };
    await mockBase44(page, db);

    await page.goto('/portal/ops?access_token=mock-admin-token');
    await page.getByRole('button', { name: 'Geospatial Intelligence' }).click();
    await expect(page.getByText('Bounded Viewport Query')).toBeVisible();

    // Before any bounds are entered: an explicit input-state message, never
    // conflated with "no inventory" or a silent empty table.
    await expect(page.getByText(/enter all four bounds/)).toBeVisible();

    await page.getByLabel('North').fill('11');
    await page.getByLabel('South').fill('9');
    await page.getByLabel('East').fill('11');
    await page.getByLabel('West').fill('9');

    // Only the two in-box locations appear; the one at (50, 50) does not.
    const vpBlock = page.locator('h2', { hasText: 'Bounded Viewport Query' }).locator('..');
    const vpRows = vpBlock.locator('table tbody tr');
    await expect(vpRows).toHaveCount(2);
    await expect(vpBlock.getByText('50.00000')).toHaveCount(0);

    // The stale in-box record already carries a P1 verification priority
    // from the same Verification Priority Queue computed above -- the
    // viewport query surfaces existing evidence, it does not invent new
    // classifications.
    await expect(vpBlock.getByText('P1')).toBeVisible();

    // Narrowing by status to something no in-box record has -> valid
    // bounds, zero matches: an honest "not in this viewport" message, not
    // an "INSUFFICIENT_DATA" input-state message.
    await page.getByLabel('Status').selectOption('pending');
    await expect(page.getByText(/does not prove no inventory exists/)).toBeVisible();
    await page.getByLabel('Status').selectOption('');

    // Safe projection: the underlying record carries an address, but the
    // bounded read (GEO_LOCATION_FIELDS) never requests it, so it can never
    // reach this panel.
    await expect(page.getByText('221B Secret Street')).toHaveCount(0);
  });
});
