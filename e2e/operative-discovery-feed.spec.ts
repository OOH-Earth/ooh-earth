import { test, expect } from '@playwright/test';
import { mockBase44, ADMIN_USER } from './fixtures/mockBase44';

// "Recent Discoveries" on /operative (DiscoveryFeed.jsx) turns the same
// per-user Location data useGamification already fetches for XP/badges
// into a standing, browsable record -- the same brand/agency/timestamp
// info FieldReport's post-submit Discovery panel shows once, now visible
// any time the operative revisits their profile. Purely derived from
// useGamification's already-fetched `locations` (exposed for exactly this
// purpose) -- no second Location fetch, no new entity.

function section(page: import('@playwright/test').Page) {
  return page.locator('section', {
    has: page.getByRole('heading', { name: 'Recent Discoveries' }),
  });
}

test.describe('OperativeProfile — Recent Discoveries feed', () => {
  test('renders newest-first with real metadata, degrading gracefully when optional fields are absent', async ({
    page,
  }) => {
    await mockBase44(page, {
      user: ADMIN_USER,
      locations: {
        'loc-1': {
          id: 'loc-1',
          created_by_id: ADMIN_USER.id,
          brand_name: 'Nike',
          parent_corp: 'Nike, Inc.',
          ad_agency: 'Wieden+Kennedy',
          created_date: '2026-08-18T10:00:00.000Z',
        },
        // Same brand, second discovery -- no parent_corp/ad_agency/ooh_operator
        // at all, proving the chain line is omitted rather than showing
        // blanks/undefined, and the count still aggregates correctly.
        'loc-2': {
          id: 'loc-2',
          created_by_id: ADMIN_USER.id,
          brand_name: 'Nike',
          created_date: '2026-08-19T10:00:00.000Z',
        },
        'loc-3': {
          id: 'loc-3',
          created_by_id: ADMIN_USER.id,
          brand_name: 'Shell',
          parent_corp: 'Shell plc',
          created_date: '2026-08-20T09:00:00.000Z',
        },
        // Not mine -- must never appear.
        'loc-4': {
          id: 'loc-4',
          created_by_id: 'someone-else',
          brand_name: 'Adidas',
          created_date: '2026-08-21T09:00:00.000Z',
        },
      },
    });
    await page.goto('/operative?access_token=mock-admin-token');

    const feed = section(page);
    await expect(feed).toBeVisible({ timeout: 20_000 });
    const cards = feed.locator('a[href^="/location/"]');
    await expect(cards).toHaveCount(3);

    // Newest first: Shell (Aug 20) -> Nike/loc-2 (Aug 19) -> Nike/loc-1 (Aug 18).
    await expect(cards.nth(0)).toContainText('Shell');
    await expect(cards.nth(0)).toContainText('Shell plc');
    await expect(cards.nth(0)).toContainText('1 total discovery');

    await expect(cards.nth(1)).toContainText('Nike');
    await expect(cards.nth(1)).toContainText('2 total discoveries');
    // No parent/agency/operator on this record -- chain line must not render.
    await expect(cards.nth(1)).not.toContainText('→');

    await expect(cards.nth(2)).toContainText('Nike');
    await expect(cards.nth(2)).toContainText('Nike, Inc.');
    await expect(cards.nth(2)).toContainText('Wieden+Kennedy');
    await expect(cards.nth(2)).toContainText('2 total discoveries');

    // Someone else's location must never leak into this feed.
    await expect(feed.getByText('Adidas')).toHaveCount(0);
  });

  test('shows the empty state when the operative has zero brand-identified discoveries', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    await page.goto('/operative?access_token=mock-admin-token');

    const feed = section(page);
    await expect(feed).toBeVisible({ timeout: 20_000 });
    await expect(feed.getByText(/No discoveries logged yet/i)).toBeVisible();
  });

  test('anonymous visitors see no discovery data at all', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/operative');

    await expect(page.getByText(/Authentication Required/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Recent Discoveries' })).toHaveCount(0);
    await expect(page.getByText('Discovery Intelligence')).toHaveCount(0);
  });

  test('existing /operative sections remain intact alongside the new feed', async ({ page }) => {
    await mockBase44(page, {
      user: ADMIN_USER,
      locations: {
        'loc-1': {
          id: 'loc-1',
          created_by_id: ADMIN_USER.id,
          brand_name: 'Nike',
          created_date: '2026-08-19T10:00:00.000Z',
        },
      },
    });
    await page.goto('/operative?access_token=mock-admin-token');

    await expect(page.getByRole('heading', { name: 'Recent Discoveries' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole('heading', { name: 'Brand Collection' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quest Board' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Merit Badges' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'XP Breakdown' })).toBeVisible();
  });
});
