import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, type MockDb } from './fixtures/mockBase44';

// FieldCheckPanel's "What changed" summary (src/components/ooh/FieldCheckPanel.jsx,
// detectChanges()) turns the existing re-check timeline into a real
// OBSERVATION -> RE-CHECK -> CHANGE DETECTED intelligence event instead of
// leaving the reader to infer a diff from a list of per-check badges. It
// only ever compares VERIFIED checks (same population the Before/After
// image comparison already used) and only ever states a field that is
// non-empty on both sides and genuinely different -- no invented "unset ->
// X" claims, no claim sourced from an unverified check.

function whatChanged(page: import('@playwright/test').Page) {
  // Brand/condition text also appears in the raw per-check timeline badges
  // below -- scope assertions to the derived summary panel specifically
  // (its own immediate container) so a duplicate match there can't quietly
  // satisfy an assertion meant to test the diff line itself.
  return page.getByText('// What changed').locator('..');
}

function loc(overrides: Record<string, unknown> = {}) {
  return {
    id: 'loc-wc-1',
    title: 'Billboard · What Changed Regression',
    type: 'billboard',
    lat: 13.75,
    lng: 100.55,
    status: 'verified',
    brand_name: 'Nike',
    condition: 'functional',
    adbust_type: 'none',
    image_url: '',
    ...overrides,
  };
}

test.describe('FieldCheckPanel — What changed', () => {
  test('one verified check with a real brand + condition change vs. the original report shows both', async ({
    page,
  }) => {
    const db: MockDb = {
      user: null,
      locations: { 'loc-wc-1': loc() },
      fieldChecks: {
        'check-1': {
          id: 'check-1',
          location_id: 'loc-wc-1',
          brand_name: 'Adidas',
          condition: 'damaged',
          adbust_type: 'none',
          status: 'verified',
          created_date: new Date().toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/location/loc-wc-1');
    const panel = whatChanged(page);
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel.getByText('Nike')).toBeVisible();
    await expect(panel.getByText('Adidas')).toBeVisible();
    await expect(panel.getByText('Damaged')).toBeVisible();
  });

  test('two verified checks compare against each other, not the original report', async ({
    page,
  }) => {
    const now = Date.now();
    const db: MockDb = {
      user: null,
      // Original report brand (Nike) is deliberately irrelevant here -- the
      // most recent pair of checks is the source of truth once 2+ exist.
      locations: { 'loc-wc-1': loc({ brand_name: 'Nike' }) },
      fieldChecks: {
        'check-older': {
          id: 'check-older',
          location_id: 'loc-wc-1',
          brand_name: 'Shell',
          condition: 'functional',
          status: 'verified',
          created_date: new Date(now - 60_000).toISOString(),
        },
        'check-newer': {
          id: 'check-newer',
          location_id: 'loc-wc-1',
          brand_name: 'BP',
          condition: 'functional',
          status: 'verified',
          created_date: new Date(now).toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/location/loc-wc-1');
    const panel = whatChanged(page);
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel.getByText('Shell')).toBeVisible();
    await expect(panel.getByText('BP')).toBeVisible();
    // Nike (the original report's brand) plays no part in a 2-verified-check
    // comparison -- it must not appear inside the change line itself.
    await expect(panel.getByText('Nike')).toHaveCount(0);
  });

  test('no genuine difference: nothing is claimed as a change', async ({ page }) => {
    const db: MockDb = {
      user: null,
      locations: { 'loc-wc-1': loc({ brand_name: 'Nike', condition: 'functional' }) },
      fieldChecks: {
        'check-1': {
          id: 'check-1',
          location_id: 'loc-wc-1',
          brand_name: 'Nike',
          condition: 'functional',
          status: 'verified',
          created_date: new Date().toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/location/loc-wc-1');
    await expect(page.getByText(/Field Check Timeline/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('// What changed')).toHaveCount(0);
  });

  test('an unverified (pending) check is never used as the source of a change claim', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const db: MockDb = {
      user: null,
      locations: { 'loc-wc-1': loc({ brand_name: 'Nike' }) },
      fieldChecks: {
        'check-pending': {
          id: 'check-pending',
          location_id: 'loc-wc-1',
          brand_name: 'Adidas',
          condition: 'damaged',
          status: 'pending',
          created_date: new Date().toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/location/loc-wc-1');
    // The raw pending entry still renders in the timeline (unchanged
    // existing behavior) -- only the derived "What changed" claim is gated.
    await expect(page.getByText(/Field Check Timeline/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Pending', { exact: true })).toBeVisible();
    await expect(page.getByText('// What changed')).toHaveCount(0);

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });
});
