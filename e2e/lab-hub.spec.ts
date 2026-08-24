import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, type MockDb } from './fixtures/mockBase44';

// LabHub.jsx's read was migrated from useState+useEffect to useQuery
// (KNOWN_ISSUES.md #16) -- proves the page still renders the code-defined
// LAB_PROJECTS fallback list when no LabPrototype records exist yet (the
// common case; LabPrototype is intentionally left unmocked here, exercising
// the same "no records yet" merge path the original try/catch's success-
// with-empty-list branch used to hit -- not the error branch, since an
// unmocked GET returns [] rather than rejecting, same as before).

test.describe('LabHub — react-query migration regression', () => {
  test('renders the static LAB_PROJECTS fallback list with no live records', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const db: MockDb = {};
    await mockBase44(page, db);

    await page.goto('/lab');

    await expect(page.getByText('Genesis Chip')).toBeVisible({ timeout: 10_000 });
    expect(filterCrashes(consoleErrors)).toEqual([]);
  });
});
