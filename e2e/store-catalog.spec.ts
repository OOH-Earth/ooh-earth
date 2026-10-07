import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, ADMIN_USER, type MockDb } from './fixtures/mockBase44';

// Store.jsx's catalog + owned-purchases read was migrated from
// useState+useEffect to two independent useQuery calls (KNOWN_ISSUES.md
// #16) -- the checkout/delivery/portal side effects (createProductCheckout,
// getStoreContent, createBillingPortal) are untouched, plain async
// functions triggered only by a user click, never by the query itself.
//
// storeCatalog and Purchase are left unmocked here, matching
// atari-portfolio.spec.ts's precedent: an unmocked function invoke falls
// through mockBase44's generic fallback to {}, and an unmocked GET-list
// falls through to [], so this proves the page still resolves out of its
// loading state and renders the empty-catalog path with no console errors
// -- the same silent-swallow-and-render-empty path the original try/catch
// took, for both a logged-out visitor and a logged-in one.

test.describe('Store — react-query migration regression', () => {
  test('anonymous visitor: catalog resolves out of loading state with no items', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const db: MockDb = { user: null };
    await mockBase44(page, db);

    await page.goto('/store');

    await expect(page.getByRole('heading', { name: 'Store' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Loading catalogue')).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByText('Nothing here yet')).toBeVisible();
    expect(filterCrashes(consoleErrors)).toEqual([]);
  });

  test('authenticated visitor: catalog resolves with no owned purchases and no console errors', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const db: MockDb = { user: ADMIN_USER };
    await mockBase44(page, db);

    await page.goto('/store?access_token=mock-admin-token');

    await expect(page.getByRole('heading', { name: 'Store' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Loading catalogue')).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByText('Nothing here yet')).toBeVisible();
    expect(filterCrashes(consoleErrors)).toEqual([]);
  });
});
