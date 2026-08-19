import { test, expect } from '@playwright/test';
import { mockBase44, ADMIN_USER } from './fixtures/mockBase44';

// The "Brand Collection" section on /operative (OperativeProfile.jsx) turns
// the existing per-user Location records (already fetched by
// useGamification for XP/badges) into a collector-game view: distinct
// brands discovered, with a repeat-discovery count each. It's a pure
// client-side grouping (deriveBrandCounts in gamification.js) over data
// that already exists -- no new entity, no schema change, no backend call.

test.describe('OperativeProfile — Brand Collection', () => {
  test('groups repeat brands by count, sorts descending, and skips missing/blank brand_name', async ({
    page,
  }) => {
    await mockBase44(page, {
      user: ADMIN_USER,
      locations: {
        'loc-1': { id: 'loc-1', created_by_id: ADMIN_USER.id, brand_name: 'Shell' },
        'loc-2': { id: 'loc-2', created_by_id: ADMIN_USER.id, brand_name: 'Shell' },
        'loc-3': { id: 'loc-3', created_by_id: ADMIN_USER.id, brand_name: 'shell' }, // case-insensitive match
        'loc-4': { id: 'loc-4', created_by_id: ADMIN_USER.id, brand_name: "McDonald's" },
        'loc-5': { id: 'loc-5', created_by_id: ADMIN_USER.id, brand_name: '   ' }, // blank
        'loc-6': { id: 'loc-6', created_by_id: ADMIN_USER.id }, // brand_name missing entirely
        'loc-7': { id: 'loc-7', created_by_id: 'someone-else', brand_name: 'Nike' }, // not mine
      },
    });
    await page.goto('/operative?access_token=mock-admin-token');

    const section = page
      .locator('h2', { hasText: 'Brand Collection' })
      .locator('xpath=ancestor::section[1]');
    // Shell (×3, case-insensitively merged) + McDonald's (×1) = 2 distinct
    // brands. loc-5 (blank) and loc-6 (missing brand_name) are excluded.
    await expect(section.getByText('2 distinct')).toBeVisible({ timeout: 20_000 });

    const chips = section.locator('div.flex.flex-wrap > div');
    await expect(chips).toHaveCount(2);
    // Shell (3 discoveries, case-insensitively merged) sorts before McDonald's (1)
    await expect(chips.nth(0)).toContainText('Shell');
    await expect(chips.nth(0)).toContainText('×3');
    await expect(chips.nth(1)).toContainText("McDonald's");
    await expect(chips.nth(1)).toContainText('×1');

    // Nike belongs to another user and must not appear.
    await expect(section.getByText('Nike')).toHaveCount(0);
  });

  test('shows the empty state when the operative has zero reports', async ({ page }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    await page.goto('/operative?access_token=mock-admin-token');

    const section = page
      .locator('h2', { hasText: 'Brand Collection' })
      .locator('xpath=ancestor::section[1]');
    await expect(section.getByText('0 distinct')).toBeVisible({ timeout: 20_000 });
    await expect(section.getByText(/No brands identified yet/i)).toBeVisible();
  });
});
