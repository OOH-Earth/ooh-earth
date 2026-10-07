import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, type MockDb } from './fixtures/mockBase44';

// MediaCorps.jsx's read was migrated from useState+useEffect to useQuery
// (KNOWN_ISSUES.md #16) -- proves the page still renders and its loading
// state correctly resolves with no live MediaCorp records (MediaCorp is
// intentionally left unmocked, exercising the same "empty list" path the
// original try/catch's success-with-empty-array branch used to hit -- an
// unmocked GET returns [] rather than rejecting, same as before).

test.describe('MediaCorps — react-query migration regression', () => {
  test('loads, resolves out of the loading state, and renders with no live records', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const db: MockDb = {};
    await mockBase44(page, db);

    await page.goto('/media-corps');

    await expect(page.getByText('Media Corps Registry')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder('Search corps…')).toBeVisible();
    expect(filterCrashes(consoleErrors)).toEqual([]);
  });
});
