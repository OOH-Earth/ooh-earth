import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, type MockDb } from './fixtures/mockBase44';

// FieldId.jsx's Operative roster read was migrated from useState+useEffect to
// useQuery (KNOWN_ISSUES.md #16). Operative isn't a mocked entity in
// mockBase44.ts, so an unmocked GET falls through to that fixture's generic
// catch-all (json: []) -- the same "no records yet" success-with-empty-list
// path the original .then(list => setOps(...)) hit before, not the .catch()
// error branch.

test.describe('FieldId — react-query migration regression', () => {
  test('renders with no live Operative records, without crashing', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const db: MockDb = {};
    await mockBase44(page, db);

    await page.goto('/field-id');

    await expect(page.getByText('Field credential', { exact: false })).toBeVisible({
      timeout: 10_000,
    });
    expect(filterCrashes(consoleErrors)).toEqual([]);
  });

  test('revisiting via client-side nav does not re-fetch the roster within staleTime', async ({
    page,
  }) => {
    test.setTimeout(30_000);
    const db: MockDb = {};
    await mockBase44(page, db);

    // Exact match, no query string -- OperativeUnitRoster's leaderboard
    // widget calls /entities/Operative?sort=-points&limit=50, a different
    // query this page must not be confused with. An earlier version of this
    // test used a substring match and would have silently counted that too.
    //
    // Nav target is /map, not Home: Home also renders FieldIdGenerator
    // (src/components/ooh/FieldIdGenerator.jsx), a *second*, unrelated call
    // site that independently issues the identical bare
    // Operative.list()-with-no-args request. Verified live -- navigating to
    // Home produced a same-URL request from that widget mounting, which is
    // indistinguishable at the network layer from a FieldId cache miss and
    // would make this assertion fail for a reason that has nothing to do
    // with FieldId's own caching behavior. /map renders no component that
    // fetches the Operative roster, so it isolates FieldId's request cleanly.
    let operativeGetCalls = 0;
    page.on('request', (req) => {
      if (req.url().endsWith('/entities/Operative')) operativeGetCalls++;
    });

    await page.goto('/field-id');
    await expect(page.getByText('Field credential', { exact: false })).toBeVisible({
      timeout: 10_000,
    });
    const afterFirstVisit = operativeGetCalls;
    expect(afterFirstVisit).toBe(1);

    // Client-side navigation away, then browser back -- same SPA session,
    // same QueryClient instance, no full page reload. This app's route
    // transition (AnimatePresence mode="wait" + React.lazy chunks) does not
    // actually unmount the previous route for several seconds -- verified
    // live with mount/unmount console markers before writing this test, not
    // assumed. A short wait here would pass regardless of staleTime, for
    // the wrong reason (the component simply hasn't unmounted yet). Waiting
    // long enough for a real remount is what actually exercises the cache.
    await page.getByLabel('Field map').click();
    await page.waitForURL('**/map', { timeout: 5000 });
    await page.waitForTimeout(6000);
    await page.goBack();
    await expect(page.getByText('Field credential', { exact: false })).toBeVisible({
      timeout: 10_000,
    });
    await page.waitForTimeout(500);

    expect(
      operativeGetCalls,
      `Operative.list() should not fire again within staleTime on a genuine remount (was ${afterFirstVisit}, now ${operativeGetCalls})`,
    ).toBe(afterFirstVisit);
  });
});
