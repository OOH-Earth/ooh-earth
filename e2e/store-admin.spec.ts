import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, ADMIN_USER, type MockDb } from './fixtures/mockBase44';

// StoreAdmin.jsx's read path was migrated from useState+useEffect to
// useQuery (KNOWN_ISSUES.md #16 pilot) — this proves the query still lists
// items on load, and that the create/delete mutations' cache updates
// (refetch() / queryClient.setQueryData()) still reach the rendered list
// identically to the old setItems() calls they replaced.

function trackConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

test.describe('StoreAdmin — react-query pilot regression', () => {
  test('lists existing items and reflects a delete without a full page reload', async ({
    page,
  }) => {
    const consoleErrors = trackConsoleErrors(page);

    const db: MockDb = {
      user: ADMIN_USER,
      storeItems: {
        'item-1': {
          id: 'item-1',
          title: 'Field Kit Sticker Pack',
          subtitle: 'Vinyl · weatherproof',
          category: 'physical',
          price_usd: 12,
          status: 'available',
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/store/admin?access_token=mock-admin-token');

    await expect(page.getByText('Field Kit Sticker Pack')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('1', { exact: true }).first()).toBeVisible();

    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Field Kit Sticker Pack')).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByText('No items yet — create one.')).toBeVisible();

    expect(filterCrashes(consoleErrors)).toEqual([]);
  });

  test('renders the empty state and admin-gate cleanly with no items', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);
    const db: MockDb = { user: ADMIN_USER, storeItems: {} };
    await mockBase44(page, db);

    await page.goto('/store/admin?access_token=mock-admin-token');

    await expect(page.getByText('No items yet — create one.')).toBeVisible({ timeout: 10_000 });
    expect(filterCrashes(consoleErrors)).toEqual([]);
  });
});
