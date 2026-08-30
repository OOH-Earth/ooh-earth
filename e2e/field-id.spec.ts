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

  test('revisiting via client-side nav does not re-fetch the roster', async ({ page }) => {
    const db: MockDb = {};
    await mockBase44(page, db);

    let operativeGetCalls = 0;
    page.on('request', (req) => {
      if (req.url().includes('/entities/Operative')) operativeGetCalls++;
    });

    await page.goto('/field-id');
    await expect(page.getByText('Field credential', { exact: false })).toBeVisible({
      timeout: 10_000,
    });
    const afterFirstVisit = operativeGetCalls;
    expect(afterFirstVisit).toBeGreaterThan(0);

    // Client-side navigation away, then browser back -- same SPA session,
    // same QueryClient instance, no full page reload.
    await page.getByLabel('OOH Earth — Home console').click();
    await page.waitForURL('**/', { timeout: 5000 });
    await page.goBack();
    await expect(page.getByText('Field credential', { exact: false })).toBeVisible({
      timeout: 10_000,
    });

    expect(
      operativeGetCalls,
      `Operative.list() should not fire again on revisit (was ${afterFirstVisit}, now ${operativeGetCalls})`,
    ).toBe(afterFirstVisit);
  });
});
