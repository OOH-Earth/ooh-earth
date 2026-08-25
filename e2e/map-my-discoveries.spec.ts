import { test, expect, type Page } from '@playwright/test';
import { mockBase44, ADMIN_USER, filterCrashes } from './fixtures/mockBase44';

// "My Discoveries" (Intelligence layer group, toggled the same way as every
// other map layer) filters the map to the authenticated user's own Location
// records -- an ownership filter on the exact same markers already loaded
// for every other layer (Map.jsx's reloadLocations()), not a second
// Location fetch and not a new map engine. Real coordinates only: records
// with missing/invalid lat/lng are excluded, never placed at a fallback
// point.

function seedLocations() {
  return {
    'loc-mine': {
      id: 'loc-mine',
      title: 'Billboard · Mine',
      type: 'billboard',
      address: '1 Mine St, Testville',
      lat: 13.75,
      lng: 100.55,
      status: 'verified',
      access_key: 'none',
      brand_name: 'Nike',
      created_by_id: ADMIN_USER.id,
    },
    // Mine, but no usable coordinates -- must never appear, never a fake pin.
    'loc-mine-bad-coords': {
      id: 'loc-mine-bad-coords',
      title: 'Billboard · Bad Coords',
      type: 'billboard',
      address: '2 Bad St, Testville',
      status: 'verified',
      access_key: 'none',
      brand_name: 'Adidas',
      created_by_id: ADMIN_USER.id,
    },
    'loc-other': {
      id: 'loc-other',
      title: 'Billboard · Other',
      type: 'billboard',
      address: '3 Other St, Testville',
      lat: 13.76,
      lng: 100.56,
      status: 'verified',
      access_key: 'none',
      brand_name: 'Shell',
      created_by_id: 'someone-else',
    },
  };
}

function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

// Map.jsx renders its results list twice -- once for the desktop cards
// panel, once inside MapBottomSheet for mobile -- both always present in
// the DOM, only one visible per breakpoint via CSS. A plain text search
// therefore always finds 2 matches regardless of viewport; this scopes to
// whichever copy is actually visible, the same pattern
// map-contribution-highlight.spec.ts already uses for the same reason.
function visibleText(page: Page, text: string) {
  return page.locator(`text=${text} >> visible=true`);
}

test.describe('Map — My Discoveries layer (desktop)', () => {
  test("shows only my own, valid-coordinate locations; excludes another user's and malformed-coordinate records; off restores the normal view", async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    await mockBase44(page, { user: ADMIN_USER, locations: seedLocations(), locationPhotos: [] });
    await page.addInitScript(() => localStorage.setItem('ooh-map-view', JSON.stringify('flat')));

    await page.goto('/map');
    await page.waitForSelector('.leaflet-container', { timeout: 15_000 });

    // Normal map: every verified location visible regardless of owner.
    await expect(visibleText(page, 'Billboard · Mine').first()).toBeVisible({ timeout: 15_000 });
    await expect(visibleText(page, 'Billboard · Other').first()).toBeVisible();

    await page.getByRole('button', { name: /My Discoveries/i }).click();

    await expect(visibleText(page, 'Billboard · Mine').first()).toBeVisible();
    await expect(visibleText(page, 'Billboard · Other')).toHaveCount(0);
    await expect(visibleText(page, 'Billboard · Bad Coords')).toHaveCount(0);

    // Off again -- the normal map returns exactly as before, unchanged.
    await page.getByRole('button', { name: /My Discoveries/i }).click();
    await expect(visibleText(page, 'Billboard · Mine').first()).toBeVisible();
    await expect(visibleText(page, 'Billboard · Other').first()).toBeVisible();

    expect(filterCrashes(errors), errors.join('\n')).toEqual([]);
  });

  test('zero discoveries: clean empty state with a CTA back to /report', async ({ page }) => {
    await mockBase44(page, {
      user: ADMIN_USER,
      locations: { 'loc-other': seedLocations()['loc-other'] },
      locationPhotos: [],
    });
    await page.addInitScript(() => localStorage.setItem('ooh-map-view', JSON.stringify('flat')));

    await page.goto('/map');
    await page.waitForSelector('.leaflet-container', { timeout: 15_000 });
    await expect(visibleText(page, 'Billboard · Other').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /My Discoveries/i }).click();

    await expect(visibleText(page, 'No field discoveries yet')).toBeVisible();
    const cta = page.locator('a:has-text("Log a spot") >> visible=true');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/report');
  });

  test('anonymous visitors see no My Discoveries control; the normal map is unaffected', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: seedLocations(), locationPhotos: [] });
    await page.addInitScript(() => localStorage.setItem('ooh-map-view', JSON.stringify('flat')));

    await page.goto('/map');
    await page.waitForSelector('.leaflet-container', { timeout: 15_000 });

    await expect(page.getByRole('button', { name: /My Discoveries/i })).toHaveCount(0);
    await expect(visibleText(page, 'Billboard · Mine').first()).toBeVisible({ timeout: 15_000 });
    await expect(visibleText(page, 'Billboard · Other').first()).toBeVisible();
  });

  test('a filtered discovery card links to its real location detail page', async ({ page }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: seedLocations(), locationPhotos: [] });
    await page.addInitScript(() => localStorage.setItem('ooh-map-view', JSON.stringify('flat')));

    await page.goto('/map');
    await page.waitForSelector('.leaflet-container', { timeout: 15_000 });

    await page.getByRole('button', { name: /My Discoveries/i }).click();

    const card = visibleText(page, 'Billboard · Mine')
      .first()
      .locator('xpath=ancestor::div[@role="button"][1]');
    await expect(card.getByRole('link', { name: /page/i })).toHaveAttribute(
      'href',
      '/location/loc-mine',
    );
  });
});

test.describe('Map — My Discoveries layer (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the mobile-reachable toggle filters and restores markers without horizontal overflow', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: seedLocations(), locationPhotos: [] });
    await page.addInitScript(() => localStorage.setItem('ooh-map-view', JSON.stringify('flat')));

    await page.goto('/map');
    await page.waitForSelector('.leaflet-container', { timeout: 15_000 });

    const toggle = page.getByRole('button', { name: 'My Discoveries' });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(visibleText(page, 'Billboard · Mine').first()).toBeVisible();
    await expect(visibleText(page, 'Billboard · Other')).toHaveCount(0);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBe(clientWidth);
  });
});
