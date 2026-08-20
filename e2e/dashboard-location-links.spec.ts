import { test, expect } from '@playwright/test';
import { mockBase44, ADMIN_USER, type MockDb } from './fixtures/mockBase44';

// Dashboard's "My field captures" list and "Recent activity" widget
// (src/pages/Dashboard.jsx, Row component) used to render each capture as a
// plain, non-interactive <div> -- no <Link>, no onClick, no href anywhere.
// A user could see their own filed reports but had no way to click through
// to the real /location/:id detail page for any of them. Now both surfaces
// link to the canonical detail route using the record's own real id.

function seedLocations() {
  return {
    'loc-verified': {
      id: 'loc-verified',
      title: 'Billboard · Verified Capture',
      type: 'billboard',
      lat: 13.75,
      lng: 100.5,
      status: 'verified',
      created_by_id: ADMIN_USER.id,
      brand_name: 'Nike',
    },
    'loc-pending': {
      id: 'loc-pending',
      title: 'Painted Wall · Pending Capture',
      type: 'painted',
      lat: 13.76,
      lng: 100.51,
      status: 'pending',
      created_by_id: ADMIN_USER.id,
    },
    'loc-rejected': {
      id: 'loc-rejected',
      title: 'Sticker · Rejected Capture',
      type: 'sticker',
      lat: 13.77,
      lng: 100.52,
      status: 'rejected',
      created_by_id: ADMIN_USER.id,
    },
  };
}

test.describe('Dashboard — My field captures links to canonical /location/:id', () => {
  test('each capture card links to its own real location id, regardless of status', async ({
    page,
  }) => {
    const db: MockDb = { user: ADMIN_USER, locations: seedLocations() };
    await mockBase44(page, db);

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Verified Capture/i).first()).toBeVisible({ timeout: 10_000 });

    // Both "My field captures" and "Recent activity" now link the same
    // record -- either instance must carry the same correct href, so
    // scoping to .first() is a safe, non-arbitrary choice here.
    const verifiedLink = page.getByRole('link', { name: /Verified Capture/i }).first();
    await expect(verifiedLink).toHaveAttribute('href', '/location/loc-verified');

    const pendingLink = page.getByRole('link', { name: /Pending Capture/i }).first();
    await expect(pendingLink).toHaveAttribute('href', '/location/loc-pending');

    const rejectedLink = page.getByRole('link', { name: /Rejected Capture/i }).first();
    await expect(rejectedLink).toHaveAttribute('href', '/location/loc-rejected');
  });

  test('clicking a capture card navigates to that exact location detail page', async ({ page }) => {
    const db: MockDb = { user: ADMIN_USER, locations: seedLocations() };
    await mockBase44(page, db);

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Verified Capture/i).first()).toBeVisible({ timeout: 10_000 });

    await page
      .getByRole('link', { name: /Pending Capture/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/location\/loc-pending$/);
    await expect(page.getByRole('heading', { name: /Pending Capture/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('multiple captures each preserve their own distinct id, not the first/last one', async ({
    page,
  }) => {
    const db: MockDb = { user: ADMIN_USER, locations: seedLocations() };
    await mockBase44(page, db);

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Verified Capture/i).first()).toBeVisible({ timeout: 10_000 });

    const hrefs = await page
      .getByRole('link', { name: /Capture/i })
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    const uniqueHrefs = new Set(hrefs.filter((h) => h?.startsWith('/location/')));
    expect(uniqueHrefs).toEqual(
      new Set(['/location/loc-verified', '/location/loc-pending', '/location/loc-rejected']),
    );
  });

  test('a capture record with no id never generates a bogus link', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const db: MockDb = {
      user: ADMIN_USER,
      locations: {
        // No `id` field on the raw record -- normLoc()'s spread carries
        // through whatever the record actually has, which for a genuinely
        // malformed record could be nothing.
        'loc-broken': {
          title: 'Billboard · No Id Capture',
          type: 'billboard',
          lat: 13.78,
          lng: 100.53,
          status: 'verified',
          created_by_id: ADMIN_USER.id,
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/No Id Capture/i).first()).toBeVisible({ timeout: 10_000 });

    // No link at all for this row -- never /location/undefined, never a
    // link with an empty/missing id.
    await expect(page.getByRole('link', { name: /No Id Capture/i })).toHaveCount(0);
    const allHrefs = await page
      .getByRole('link')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    expect(allHrefs.some((h) => h?.includes('undefined'))).toBe(false);

    expect(consoleErrors.filter((e) => /Uncaught|ReferenceError/i.test(e))).toEqual([]);
  });

  test('the Recent activity widget also links each entry to its real location', async ({
    page,
  }) => {
    const db: MockDb = { user: ADMIN_USER, locations: seedLocations() };
    await mockBase44(page, db);

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText('Recent activity')).toBeVisible({ timeout: 10_000 });

    const activitySection = page.locator('div', { has: page.getByText('Recent activity') });
    const link = activitySection.getByRole('link', { name: /Verified Capture/i }).first();
    await expect(link).toHaveAttribute('href', '/location/loc-verified');
  });

  test('mobile: capture cards remain tappable links', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only check of the same dashboard surface');
    const db: MockDb = { user: ADMIN_USER, locations: seedLocations() };
    await mockBase44(page, db);

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Verified Capture/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /Verified Capture/i }).first()).toHaveAttribute(
      'href',
      '/location/loc-verified',
    );
  });
});
