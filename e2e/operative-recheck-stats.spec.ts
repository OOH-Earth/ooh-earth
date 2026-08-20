import { test, expect } from '@playwright/test';
import { mockBase44, ADMIN_USER, type MockDb } from './fixtures/mockBase44';

// The FieldCheck re-check system (moderation, "What Changed", "Last
// confirmed" freshness -- PRs #117/#119/#120) had zero visibility on the
// operative's own /operative profile: useGamification()'s `stats` never
// referenced FieldCheck at all, so a user could submit dozens of re-checks
// and see no acknowledgment of that anywhere on their own stats. This adds
// a real "Re-checks" count to the existing STAT_CARDS grid -- reusing the
// same fetch-and-filter-by-owner pattern already used for every other stat
// (reports/busts/mints/leads), no new XP, no new badge, no invented point
// value for a re-check (that's a product decision, not made here).

function fieldCheck(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    location_id: 'loc-1',
    status: 'pending',
    created_by_id: ADMIN_USER.id,
    created_date: new Date().toISOString(),
    ...overrides,
  };
}

test.describe('OperativeProfile — Re-checks stat', () => {
  test('shows the real count of the operative’s own FieldChecks, mixed status', async ({
    page,
  }) => {
    const db: MockDb = {
      user: ADMIN_USER,
      locations: {},
      fieldChecks: {
        'check-1': fieldCheck('check-1', { status: 'verified' }),
        'check-2': fieldCheck('check-2', { status: 'pending' }),
        'check-3': fieldCheck('check-3', { status: 'rejected' }),
      },
    };
    await mockBase44(page, db);

    await page.goto('/operative?access_token=mock-admin-token');
    await expect(page.getByText('Re-checks')).toBeVisible({ timeout: 20_000 });
    const card = page.getByText('Re-checks').locator('..');
    await expect(card.getByText('3', { exact: true })).toBeVisible();
  });

  test('a FieldCheck belonging to another user is never counted', async ({ page }) => {
    const db: MockDb = {
      user: ADMIN_USER,
      locations: {},
      fieldChecks: {
        'check-mine': fieldCheck('check-mine', { status: 'verified' }),
        'check-other': fieldCheck('check-other', {
          status: 'verified',
          created_by_id: 'someone-else',
        }),
      },
    };
    await mockBase44(page, db);

    await page.goto('/operative?access_token=mock-admin-token');
    await expect(page.getByText('Re-checks')).toBeVisible({ timeout: 20_000 });
    const card = page.getByText('Re-checks').locator('..');
    await expect(card.getByText('1', { exact: true })).toBeVisible();
  });

  test('zero FieldChecks shows a real zero, not a hidden card', async ({ page }) => {
    const db: MockDb = { user: ADMIN_USER, locations: {} };
    await mockBase44(page, db);

    await page.goto('/operative?access_token=mock-admin-token');
    await expect(page.getByText('Re-checks')).toBeVisible({ timeout: 20_000 });
    const card = page.getByText('Re-checks').locator('..');
    await expect(card.getByText('0', { exact: true })).toBeVisible();
  });

  test('anonymous visitors see no personal re-check stat', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });

    await page.goto('/operative');
    await expect(page.getByText(/Authentication Required/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Re-checks')).toHaveCount(0);
  });
});
