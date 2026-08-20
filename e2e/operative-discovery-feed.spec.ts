import { test, expect } from '@playwright/test';
import { mockBase44, ADMIN_USER } from './fixtures/mockBase44';

// "Recent Discoveries" on /operative (DiscoveryFeed.jsx) turns the same
// per-user Location data useGamification already fetches for XP/badges
// into a standing, browsable record -- the same brand/agency/timestamp
// info FieldReport's post-submit Discovery panel shows once, now visible
// any time the operative revisits their profile. Purely derived from
// useGamification's already-fetched `locations` (exposed for exactly this
// purpose) -- no second Location fetch, no new entity.
//
// Each card shows a real, derived (never fabricated) per-brand ordinal
// ("Your Kth Nike discovery") and overall filing sequence ("Discovery #N")
// instead of the brand's static aggregate total repeated identically on
// every one of its cards -- repeat-brand discoveries used to render as
// near-identical. The milestone line is scoped to the track that specific
// report actually contributed to (nearestBrandMilestone's `track` param,
// gamification.js): a brand's first-ever discovery moved the distinct-brand
// (Explorer) count, every later repeat only moves that brand's own
// (Collector) count -- never "whichever track happens to be globally
// closest", which could cite a stat unrelated to the discovery shown.

function section(page: import('@playwright/test').Page) {
  return page.locator('section', {
    has: page.getByRole('heading', { name: 'Recent Discoveries' }),
  });
}

test.describe('OperativeProfile — Recent Discoveries feed', () => {
  test('renders newest-first with real metadata and a distinct per-brand ordinal, degrading gracefully when optional fields are absent', async ({
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
        // Same brand, second (repeat) discovery -- no parent_corp/ad_agency/
        // ooh_operator at all, proving the chain line is omitted rather
        // than showing blanks/undefined, and its own ordinal ("2nd") makes
        // it visually distinct from loc-1's "1st" even though both are Nike.
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

    // Newest first: Shell (Aug 20, #3) -> Nike/loc-2 (Aug 19, #2, repeat) ->
    // Nike/loc-1 (Aug 18, #1, first-ever).
    await expect(cards.nth(0)).toContainText('Discovery #3');
    await expect(cards.nth(0)).toContainText('Shell');
    await expect(cards.nth(0)).toContainText('Shell plc');
    await expect(cards.nth(0)).toContainText('Your 1st Shell discovery');

    await expect(cards.nth(1)).toContainText('Discovery #2');
    await expect(cards.nth(1)).toContainText('Nike');
    await expect(cards.nth(1)).toContainText('Your 2nd Nike discovery');
    // No parent/agency/operator on this record -- chain line must not render.
    await expect(cards.nth(1)).not.toContainText('→');

    await expect(cards.nth(2)).toContainText('Discovery #1');
    await expect(cards.nth(2)).toContainText('Nike');
    await expect(cards.nth(2)).toContainText('Nike, Inc.');
    await expect(cards.nth(2)).toContainText('Wieden+Kennedy');
    await expect(cards.nth(2)).toContainText('Your 1st Nike discovery');

    // Even though loc-1 and loc-2 are both "Nike", their cards are no
    // longer identical -- proves the redundancy fix, not just the ordinal
    // math in isolation.
    expect(await cards.nth(1).innerText()).not.toBe(await cards.nth(2).innerText());

    // Someone else's location must never leak into this feed.
    await expect(feed.getByText('Adidas')).toHaveCount(0);
  });

  test('shows the milestone track relevant to each specific discovery, not whichever is globally closest', async ({
    page,
  }) => {
    // Deliberately constructed so BOTH tracks sit exactly 1 away from their
    // next tier at the same time (distinct brands: 4/5 -> Explorer;
    // Nike's own count: 4/5 -> Collector) -- the exact tie condition where
    // the old "globally closest, track-unaware" logic could surface the
    // wrong track on a repeat-brand card.
    await mockBase44(page, {
      user: ADMIN_USER,
      locations: {
        'loc-shell': {
          id: 'loc-shell',
          created_by_id: ADMIN_USER.id,
          brand_name: 'Shell',
          created_date: '2026-08-10T09:00:00.000Z',
        },
        'loc-mcd': {
          id: 'loc-mcd',
          created_by_id: ADMIN_USER.id,
          brand_name: "McDonald's",
          created_date: '2026-08-11T09:00:00.000Z',
        },
        'loc-adidas': {
          id: 'loc-adidas',
          created_by_id: ADMIN_USER.id,
          brand_name: 'Adidas',
          created_date: '2026-08-12T09:00:00.000Z',
        },
        'loc-nike-1': {
          id: 'loc-nike-1',
          created_by_id: ADMIN_USER.id,
          brand_name: 'Nike',
          created_date: '2026-08-13T09:00:00.000Z',
        },
        'loc-nike-2': {
          id: 'loc-nike-2',
          created_by_id: ADMIN_USER.id,
          brand_name: 'Nike',
          created_date: '2026-08-14T09:00:00.000Z',
        },
        'loc-nike-3': {
          id: 'loc-nike-3',
          created_by_id: ADMIN_USER.id,
          brand_name: 'Nike',
          created_date: '2026-08-15T09:00:00.000Z',
        },
        'loc-nike-4': {
          id: 'loc-nike-4',
          created_by_id: ADMIN_USER.id,
          brand_name: 'Nike',
          created_date: '2026-08-16T09:00:00.000Z',
        },
      },
    });
    await page.goto('/operative?access_token=mock-admin-token');

    const feed = section(page);
    await expect(feed).toBeVisible({ timeout: 20_000 });
    const cards = feed.locator('a[href^="/location/"]');
    // Top 5, newest first: Nike-4, Nike-3, Nike-2, Nike-1, Adidas.
    await expect(cards).toHaveCount(5);

    // Nike-4 (4th Nike discovery, a REPEAT) -- must show Nike's own
    // (Collector) progress, never the distinct-brand (Explorer) line, even
    // though both are numerically tied at "1 more" right now.
    await expect(cards.nth(0)).toContainText('Your 4th Nike discovery');
    await expect(cards.nth(0)).toContainText('4 / 5 · 1 more to Brand Collector');
    await expect(cards.nth(0)).not.toContainText('Brand Explorer');

    // Nike-1 (the 1st-ever Nike discovery) -- this specific report is what
    // moved the distinct-brand count, so Explorer progress is the correct,
    // relevant track here.
    await expect(cards.nth(3)).toContainText('Your 1st Nike discovery');
    await expect(cards.nth(3)).toContainText('4 / 5 · 1 more to Brand Explorer');
    await expect(cards.nth(3)).not.toContainText('Brand Collector');

    // Adidas (also a first-ever discovery of its brand) -- same Explorer
    // relevance as Nike-1, a different brand entirely.
    await expect(cards.nth(4)).toContainText('Your 1st Adidas discovery');
    await expect(cards.nth(4)).toContainText('4 / 5 · 1 more to Brand Explorer');
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
