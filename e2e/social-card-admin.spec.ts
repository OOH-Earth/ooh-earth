import { test, expect } from '@playwright/test';
import { mockBase44, ADMIN_USER } from './fixtures/mockBase44';
import { OG_IMAGES } from '../src/lib/routeMeta';

// SeoAdminPanel.jsx (/lab/admin -> "SEO · social cards") had three real
// bugs for every DYNAMIC route (Location, Store item, Blog post, ...):
// 1. ogFor()'s fallback-image logic gated the category image behind
//    `META[path]` being truthy, but dynamic route templates are never
//    literal keys in META (a separate DYNAMIC_ROUTES list) -- every
//    dynamic route silently showed the generic site-default image/branding
//    instead of its real category fallback (map/store/campaign/...).
// 2. The row's "preview" external-link icon used `href={route.path}`
//    verbatim -- for a dynamic route that's the literal template string
//    (e.g. "/location/:id"), a genuinely broken, non-existent URL.
// 3. Draft title/description seeding had no fallback for dynamic routes
//    (META[path] doesn't exist for them either), so "Generate card"
//    silently required manually typing a title first for every single
//    dynamic route, every time.

async function openSeoPanel(page: import('@playwright/test').Page) {
  await page.goto('/lab/admin?access_token=mock-admin-token');
  await page.getByRole('button', { name: /SEO · social cards/i }).click();
  await expect(page.getByText('SEO · Social Cards · Metadata')).toBeVisible({ timeout: 10_000 });
}

// Each route row is <div className="px-4 py-3.5"><div header>...<span>{label}</span>...</div>
// <div body>...</div></div> -- walk up from the exact label span two levels
// (span -> header row -> the row itself) rather than a "div:has(text)" +
// first()/last() query, which matches every ancestor div (including ones
// far broader than the row) with an unpredictable match order.
function rowFor(page: import('@playwright/test').Page, label: string) {
  return page.getByText(label, { exact: true }).locator('../..');
}

test.describe('Lab Admin — Social Cards (SeoAdminPanel)', () => {
  test('a dynamic route (Location) shows its real category fallback image, not the generic default', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    await openSeoPanel(page);

    const row = rowFor(page, 'Location (detail)');
    await expect(row).toBeVisible({ timeout: 10_000 });
    const img = row.locator('img').first();
    await expect(img).toHaveAttribute('src', OG_IMAGES.map);
    await expect(img).not.toHaveAttribute('src', OG_IMAGES.default);
  });

  test('a dynamic route never renders a broken preview link (no literal ":id" URL)', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    await openSeoPanel(page);

    const row = rowFor(page, 'Location (detail)');
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row.locator('a[href="/location/:id"]')).toHaveCount(0);
    await expect(row.locator('a[target="_blank"]')).toHaveCount(0);
  });

  test('an existing static route keeps its working preview link (no regression)', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    await openSeoPanel(page);

    const row = rowFor(page, 'Field Atlas');
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row.locator('a[href="/map"][target="_blank"]')).toBeVisible();
  });

  test('a dynamic route pre-fills a real, non-blank title so "Generate card" is not blocked', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    await openSeoPanel(page);

    const row = rowFor(page, 'Location (detail)');
    await expect(row).toBeVisible({ timeout: 10_000 });
    // The Title <label> isn't htmlFor-associated with its <input> (a
    // pre-existing, separate a11y gap, out of scope here) -- locate the
    // input directly; it's the only <input> in a route row (Description is
    // a <textarea>).
    const titleInput = row.locator('input').first();
    await expect(titleInput).not.toHaveValue('');
  });

  test('generating a card for a dynamic route succeeds using the pre-filled title', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    await page.route('**/functions/generateOgImage', (route) =>
      route.fulfill({
        json: {
          ok: true,
          url: 'https://media.base44.com/images/public/test/generated-location-card.png',
          saved: { id: 'pm-1', path: '/location/:id', og_generated: true },
        },
      }),
    );
    await openSeoPanel(page);

    const row = rowFor(page, 'Location (detail)');
    await row.getByRole('button', { name: /Generate card/i }).click();
    await expect(page.getByText('Social card generated')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Add a title first')).toHaveCount(0);
  });

  test('an existing static route (the OOH Earth landing page) still generates its card unchanged', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    await page.route('**/functions/generateOgImage', (route) =>
      route.fulfill({
        json: {
          ok: true,
          url: 'https://media.base44.com/images/public/test/generated-home-card.png',
          saved: { id: 'pm-2', path: '/', og_generated: true },
        },
      }),
    );
    await openSeoPanel(page);

    const row = rowFor(page, 'OOH Earth');
    await row.getByRole('button', { name: /Generate card/i }).click();
    await expect(page.getByText('Social card generated')).toBeVisible({ timeout: 10_000 });
  });
});
