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

// Collector milestone badges (gamification.js BADGES: brand_explorer[_2/_3],
// brand_collector[_2/_3]) are pure predicates over the same brandCounts
// derived above -- no new entity, no new stats field. "Earned" is asserted
// via the existing generic BadgeGrid "Mint as NFT" link (only rendered for
// earned badges), the same signal e2e/nft-badge-mint-prefill.spec.ts already
// uses for first_blood/surveyor -- proving the new badges plug into that
// existing mechanism unchanged.
test.describe('OperativeProfile — Collector Milestone Badges', () => {
  test('fewer than 5 distinct brands, and fewer than 5 of the same brand, earns neither track', async ({
    page,
  }) => {
    await mockBase44(page, {
      user: ADMIN_USER,
      locations: {
        'loc-1': { id: 'loc-1', created_by_id: ADMIN_USER.id, brand_name: 'Shell' },
        'loc-2': { id: 'loc-2', created_by_id: ADMIN_USER.id, brand_name: 'Nike' },
        'loc-3': { id: 'loc-3', created_by_id: ADMIN_USER.id, brand_name: 'Adidas' },
        'loc-4': { id: 'loc-4', created_by_id: ADMIN_USER.id, brand_name: 'Puma' },
      },
    });
    await page.goto('/operative?access_token=mock-admin-token');
    await expect(page.getByRole('heading', { name: 'Merit Badges' })).toBeVisible({
      timeout: 20_000,
    });

    for (const label of ['Brand Explorer', 'Brand Collector']) {
      const tile = page.getByText(label, { exact: true }).locator('..');
      await expect(tile.getByRole('link', { name: /mint as nft/i })).toHaveCount(0);
    }
  });

  test('reaching 5, 10, and 25 distinct brands unlocks Brand Explorer I/II/III; same-brand track stays locked', async ({
    page,
  }) => {
    const locations: Record<string, unknown> = {};
    for (let i = 1; i <= 25; i++) {
      locations[`loc-${i}`] = {
        id: `loc-${i}`,
        created_by_id: ADMIN_USER.id,
        brand_name: `Brand ${i}`,
      };
    }
    await mockBase44(page, { user: ADMIN_USER, locations });
    await page.goto('/operative?access_token=mock-admin-token');
    await expect(page.getByRole('heading', { name: 'Merit Badges' })).toBeVisible({
      timeout: 20_000,
    });

    for (const label of ['Brand Explorer', 'Brand Explorer II', 'Brand Explorer III']) {
      const tile = page.getByText(label, { exact: true }).locator('..');
      await expect(tile.getByRole('link', { name: /mint as nft/i })).toBeVisible();
    }
    // Every one of the 25 brands here was discovered exactly once.
    const collectorTile = page.getByText('Brand Collector', { exact: true }).locator('..');
    await expect(collectorTile.getByRole('link', { name: /mint as nft/i })).toHaveCount(0);
  });

  test('reaching 5, 10, and 25 discoveries of the same brand unlocks Brand Collector I/II/III; distinct-brand track stays locked', async ({
    page,
  }) => {
    const locations: Record<string, unknown> = {};
    for (let i = 1; i <= 25; i++) {
      locations[`loc-${i}`] = { id: `loc-${i}`, created_by_id: ADMIN_USER.id, brand_name: 'Shell' };
    }
    await mockBase44(page, { user: ADMIN_USER, locations });
    await page.goto('/operative?access_token=mock-admin-token');
    await expect(page.getByRole('heading', { name: 'Merit Badges' })).toBeVisible({
      timeout: 20_000,
    });

    for (const label of ['Brand Collector', 'Brand Collector II', 'Brand Collector III']) {
      const tile = page.getByText(label, { exact: true }).locator('..');
      await expect(tile.getByRole('link', { name: /mint as nft/i })).toBeVisible();
    }
    // Only one distinct brand (Shell) was discovered here.
    const explorerTile = page.getByText('Brand Explorer', { exact: true }).locator('..');
    await expect(explorerTile.getByRole('link', { name: /mint as nft/i })).toHaveCount(0);
  });
});

// A locked collector badge shows live "current / target" progress so the
// grid itself reads as a progress bar, not just a locked/unlocked flag.
// badge.progress(stats) (gamification.js) is optional and only the 6
// collector badges define it -- the other 13 badges render unchanged.
test.describe('BadgeGrid — collector milestone progress', () => {
  test('shows live X / Y progress toward locked collector milestones', async ({ page }) => {
    await mockBase44(page, {
      user: ADMIN_USER,
      locations: {
        'loc-1': { id: 'loc-1', created_by_id: ADMIN_USER.id, brand_name: 'Shell' },
        'loc-2': { id: 'loc-2', created_by_id: ADMIN_USER.id, brand_name: 'Nike' },
        'loc-3': { id: 'loc-3', created_by_id: ADMIN_USER.id, brand_name: 'Adidas' },
      },
    });
    await page.goto('/operative?access_token=mock-admin-token');
    await expect(page.getByRole('heading', { name: 'Merit Badges' })).toBeVisible({
      timeout: 20_000,
    });

    // 3 distinct brands, max 1 discovery of any single brand.
    const explorerTile = page.getByText('Brand Explorer', { exact: true }).locator('..');
    await expect(explorerTile.getByText('3 / 5')).toBeVisible();
    const explorer2Tile = page.getByText('Brand Explorer II', { exact: true }).locator('..');
    await expect(explorer2Tile.getByText('3 / 10')).toBeVisible();
    const collectorTile = page.getByText('Brand Collector', { exact: true }).locator('..');
    await expect(collectorTile.getByText('1 / 5')).toBeVisible();
  });

  test('an earned badge does not show a redundant progress line', async ({ page }) => {
    const locations: Record<string, unknown> = {};
    for (let i = 1; i <= 5; i++) {
      locations[`loc-${i}`] = {
        id: `loc-${i}`,
        created_by_id: ADMIN_USER.id,
        brand_name: `Brand ${i}`,
      };
    }
    await mockBase44(page, { user: ADMIN_USER, locations });
    await page.goto('/operative?access_token=mock-admin-token');
    await expect(page.getByRole('heading', { name: 'Merit Badges' })).toBeVisible({
      timeout: 20_000,
    });

    // Brand Explorer (target 5) is earned by these 5 distinct brands.
    const explorerTile = page.getByText('Brand Explorer', { exact: true }).locator('..');
    await expect(explorerTile.getByRole('link', { name: /mint as nft/i })).toBeVisible();
    await expect(explorerTile.getByText(/^\d+ \/ \d+$/)).toHaveCount(0);
  });
});
