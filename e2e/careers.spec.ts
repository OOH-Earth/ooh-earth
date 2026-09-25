import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, type MockDb } from './fixtures/mockBase44';

// /careers and /careers/:id previously each ran their own independent copy
// of a useState+useEffect fetch against CareerRoleStatus, merged onto the
// static roles.js content. Migrated both to a single shared useCareerRoles()
// react-query hook (KNOWN_ISSUES.md #16) — this proves both pages still
// render the static-fallback role content when CareerRoleStatus has no
// live override data (the common case; CareerRoleStatus is intentionally
// left unmocked here, exercising the same "no data yet" fallback path the
// original hooks' catch blocks used to hit).

test.describe('Careers — react-query migration regression', () => {
  test('list page renders static role content with no live overrides', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const db: MockDb = {};
    await mockBase44(page, db);

    await page.goto('/careers');

    await expect(page.getByText('Field Reporter')).toBeVisible({ timeout: 10_000 });
    expect(filterCrashes(consoleErrors)).toEqual([]);
  });

  test('detail page renders the matching role by id', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const db: MockDb = {};
    await mockBase44(page, db);

    await page.goto('/careers/field-operative');

    await expect(page.getByRole('heading', { name: 'Field Reporter' })).toBeVisible({
      timeout: 10_000,
    });
    expect(filterCrashes(consoleErrors)).toEqual([]);
  });
});
