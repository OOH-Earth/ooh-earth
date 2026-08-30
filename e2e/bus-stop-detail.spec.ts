import { test, expect } from '@playwright/test';
import { mockBase44, type MockDb } from './fixtures/mockBase44';

// BusStopDetail.jsx's bulk verified-Location lookup was migrated from
// useState+useEffect to useQuery, keyed by the fetch's own parameters
// (not this page's :id), so the cache is shared across different bus
// stops, not just revisits of the same one.

test.describe('BusStopDetail — react-query migration regression', () => {
  test('fetches the verified-locations list exactly once across two different bus stop pages', async ({
    page,
  }) => {
    test.setTimeout(30_000);

    const db: MockDb = {
      user: null,
      locations: {
        'loc-near-bs-001': {
          id: 'loc-near-bs-001',
          title: 'Billboard near British Library',
          type: 'billboard',
          // bs-001 is at 51.5289784, -0.1268918 -- ~5m away, well within the
          // page's own 50m linking radius.
          lat: 51.528975,
          lng: -0.126895,
          status: 'verified',
          access_key: 'none',
        },
      },
      locationPhotos: [],
    };
    await mockBase44(page, db);

    let verifiedListCalls = 0;
    page.on('request', (req) => {
      const url = new URL(req.url());
      if (
        url.pathname.endsWith('/entities/Location') &&
        url.searchParams.get('sort') === '-created_date' &&
        url.searchParams.get('limit') === '500'
      ) {
        verifiedListCalls++;
      }
    });

    await page.goto('/bus-stop/bs-001');
    await expect(page.getByRole('heading', { name: /British Library/i })).toBeVisible();
    // "View location ->" only renders when linkedLoc resolves truthy --
    // proof the query returned data and the proximity match succeeded.
    await expect(page.getByRole('link', { name: /View location/i })).toBeVisible();
    expect(verifiedListCalls).toBe(1);

    // Client-side nav to a DIFFERENT bus stop -- the underlying query (same
    // params, no :id in the key) should be a cache hit, not a second fetch,
    // proving this isn't just per-record caching like LocationDetail's.
    await page.getByRole('link', { name: /Bus-stop directory/i }).click();
    await page.waitForURL('**/bus-stops', { timeout: 5000 });
    await page.getByRole('link', { name: /Brixton Academy/i }).click();
    await page.waitForURL('**/bus-stop/bs-002', { timeout: 5000 });
    await expect(page.getByRole('heading', { name: /Brixton Academy/i })).toBeVisible();

    expect(
      verifiedListCalls,
      `verified-locations list should be a cache hit on a second bus stop page (was 1, now ${verifiedListCalls})`,
    ).toBe(1);
  });
});
