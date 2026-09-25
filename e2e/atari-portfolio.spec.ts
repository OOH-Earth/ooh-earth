import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, ADMIN_USER, type MockDb } from './fixtures/mockBase44';

// AtariPortfolio.jsx's read was migrated from useState+useEffect+useCallback
// to useQuery (KNOWN_ISSUES.md #16). Proves the page still renders and
// resolves out of its loading state with no live Mint/FundingLead records
// and no cryptoWatch data (all left unmocked here, matching the original
// try/catch's silent-swallow-and-render-zeros path -- an unmocked GET
// returns [] and an unmocked function invoke returns {}, same as before).
//
// /portfolio sits behind ProtectedRoute (App.jsx), so a mocked
// authenticated user is required -- an anonymous visit never reaches this
// component at all (redirected to /login first, same for old and new code).

test.describe('AtariPortfolio — react-query migration regression', () => {
  test('loads, resolves out of the loading state, and renders zero totals with no live records', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const db: MockDb = { user: ADMIN_USER };
    await mockBase44(page, db);

    await page.goto('/portfolio?access_token=mock-admin-token');

    await expect(page.getByRole('heading', { name: 'Atari Portfolio' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Total portfolio value')).toBeVisible();
    await expect(page.getByText('$0').first()).toBeVisible();
    expect(filterCrashes(consoleErrors)).toEqual([]);
  });
});
