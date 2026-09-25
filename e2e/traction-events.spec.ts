import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import { mockBase44, ADMIN_USER, type MockDb } from './fixtures/mockBase44';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.join(__dirname, 'fixtures', 'test-image.png');

// Tier 1 traction instrumentation: six approved events fired through the
// Base44 SDK's own already-wired analytics module (base44.analytics.track,
// see src/lib/trackEvent.js), at the six exact points where each thing
// genuinely, successfully happens -- never on render, never on an
// already-true state being merely displayed. These tests intercept the
// real network call the SDK's own batching makes
// (POST .../analytics/track/batch) rather than depending on its internal
// timing, and assert absence by confirming nothing arrived by the time an
// unrelated, definitely-slower UI transition has already completed.

async function captureAnalyticsEvents(page: Page) {
  const events: { event_name: string; properties?: Record<string, unknown> }[] = [];
  // Registration itself must be awaited -- page.route() is async, and an
  // unawaited call races page.goto()/early actions (the SDK's own
  // __initialization_event__ or a badge check right after page load can
  // both fire before an un-awaited route handler finishes registering).
  await page.route('**/analytics/track/batch', async (route) => {
    const body = route.request().postDataJSON() ?? {};
    events.push(...(body.events || []));
    await route.fulfill({ json: { ok: true } });
  });
  return events;
}

// Polls the same array captureAnalyticsEvents() already populates, rather
// than racing a second, independent page.waitForRequest() against it --
// avoids any ordering interaction between the two Playwright request-
// observation mechanisms and needs no fixed sleep.
function waitForEvent(
  events: { event_name: string; properties?: Record<string, unknown> }[],
  eventName: string,
) {
  return expect
    .poll(() => events.some((e) => e.event_name === eventName), { timeout: 10_000 })
    .toBe(true);
}

async function fillAndSubmitReport(
  page: Page,
  { brand, withPhoto = false }: { brand?: string; withPhoto?: boolean } = {},
) {
  await page.goto('/report');
  await expect(page.getByRole('heading', { name: /Adbusting/i })).toBeVisible();

  if (withPhoto) {
    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles(IMG);
    await expect(page.getByText(/Replace/i)).toBeVisible();
  }

  await page.getByPlaceholder('Street, district, city').fill('900 Test Ave, Testville');
  await page.getByText('Enter coordinates manually').click();
  await page.getByPlaceholder('Latitude').fill('13.75');
  await page.getByPlaceholder('Longitude').fill('100.50');

  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.click(); // Document -> Identify
  if (brand) {
    await page.getByPlaceholder("e.g. Shell, McDonald's, Toyota").fill(brand);
  }
  await submitBtn.click(); // Identify -> Classify
  await submitBtn.click(); // Classify -> Respond
  await expect(submitBtn).toHaveText(/Transmit report/i);
  await submitBtn.click(); // submit
}

test.describe('Traction instrumentation — report_submitted', () => {
  test('a successful, authenticated report fires report_submitted exactly once with real properties', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    const events = await captureAnalyticsEvents(page);

    await fillAndSubmitReport(page, { brand: 'Shell' });
    await expect(page.getByText(/Transmission received/i)).toBeVisible({ timeout: 10_000 });
    await waitForEvent(events, 'report_submitted');

    const matches = events.filter((e) => e.event_name === 'report_submitted');
    expect(matches).toHaveLength(1);
    expect(matches[0].properties).toMatchObject({ authenticated: true, report_type: 'billboard' });
  });
});

test.describe('Traction instrumentation — brand_identified', () => {
  test('a genuine AI scan result fires brand_identified once with the real brand', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.route('**/functions/scanAd', (route) =>
      route.fulfill({
        json: {
          detection: {
            response: { is_advertising: true, surface_type: 'billboard', brand_name: 'TestCo' },
          },
        },
      }),
    );
    const events = await captureAnalyticsEvents(page);

    await page.goto('/report');
    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles(IMG);
    await page.getByRole('button', { name: 'Run scan' }).click();
    await expect(page.getByText('Scan complete')).toBeVisible({ timeout: 10_000 });
    await waitForEvent(events, 'brand_identified');

    const matches = events.filter((e) => e.event_name === 'brand_identified');
    expect(matches).toHaveLength(1);
    expect(matches[0].properties).toMatchObject({ brand_name: 'TestCo' });
  });

  test('a blank/unidentified scan result never fires brand_identified', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.route('**/functions/scanAd', (route) =>
      route.fulfill({
        json: { detection: { response: { is_advertising: true, brand_name: 'Unknown' } } },
      }),
    );
    const events = await captureAnalyticsEvents(page);

    await page.goto('/report');
    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles(IMG);
    await page.getByRole('button', { name: 'Run scan' }).click();
    // Wait for the scan's own definitely-slower round trip to fully settle
    // before checking absence -- if brand_identified were going to fire, it
    // would already have by the time the scan UI itself finishes updating.
    await expect(page.getByText('Scan complete')).toBeVisible({ timeout: 10_000 });

    expect(events.filter((e) => e.event_name === 'brand_identified')).toHaveLength(0);
  });

  test('a failed scan never fires brand_identified', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.route('**/functions/scanAd', (route) => route.fulfill({ status: 500, json: {} }));
    const events = await captureAnalyticsEvents(page);

    await page.goto('/report');
    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles(IMG);
    await page.getByRole('button', { name: 'Run scan' }).click();
    await expect(page.getByText(/Scan failed/i)).toBeVisible({ timeout: 10_000 });

    expect(events.filter((e) => e.event_name === 'brand_identified')).toHaveLength(0);
  });
});

test.describe('Traction instrumentation — report_verified / recheck_verified', () => {
  test('approving a pending Location fires report_verified exactly once', async ({ page }) => {
    const db: MockDb = {
      user: ADMIN_USER,
      locations: {
        'loc-1': {
          id: 'loc-1',
          title: 'Billboard · Verify Event Check',
          type: 'billboard',
          lat: 13.8,
          lng: 100.6,
          status: 'pending',
        },
      },
    };
    await mockBase44(page, db);
    const events = await captureAnalyticsEvents(page);

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Verify Event Check/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await waitForEvent(events, 'report_verified');

    expect(events.filter((e) => e.event_name === 'report_verified')).toHaveLength(1);
    expect(events.filter((e) => e.event_name === 'recheck_verified')).toHaveLength(0);
  });

  test('rejecting a pending Location never fires report_verified', async ({ page }) => {
    const db: MockDb = {
      user: ADMIN_USER,
      locations: {
        'loc-2': {
          id: 'loc-2',
          title: 'Billboard · Reject Event Check',
          type: 'billboard',
          lat: 13.81,
          lng: 100.61,
          status: 'pending',
        },
      },
    };
    await mockBase44(page, db);
    const events = await captureAnalyticsEvents(page);

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Reject Event Check/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Reject', exact: true }).click();
    await expect(page.getByText(/Reject Event Check/i)).toHaveCount(0, { timeout: 10_000 });

    expect(events.filter((e) => e.event_name === 'report_verified')).toHaveLength(0);
  });

  test('approving a pending FieldCheck fires recheck_verified exactly once, not report_verified', async ({
    page,
  }) => {
    const db: MockDb = {
      user: ADMIN_USER,
      locations: {
        'loc-3': {
          id: 'loc-3',
          title: 'Billboard · Recheck Verify Event',
          type: 'billboard',
          lat: 13.7,
          lng: 100.5,
          status: 'verified',
        },
      },
      fieldChecks: {
        'check-1': {
          id: 'check-1',
          location_id: 'loc-3',
          location_title: 'Billboard · Recheck Verify Event',
          status: 'pending',
          created_date: new Date().toISOString(),
        },
      },
    };
    await mockBase44(page, db);
    const events = await captureAnalyticsEvents(page);

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Recheck Verify Event/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await waitForEvent(events, 'recheck_verified');

    expect(events.filter((e) => e.event_name === 'recheck_verified')).toHaveLength(1);
    expect(events.filter((e) => e.event_name === 'report_verified')).toHaveLength(0);
  });
});

test.describe('Traction instrumentation — recheck_submitted', () => {
  test('a genuinely transmitted re-check fires recheck_submitted exactly once', async ({
    page,
  }) => {
    const db: MockDb = {
      user: null,
      locations: {
        'loc-4': {
          id: 'loc-4',
          title: 'Billboard · Recheck Submit Event',
          type: 'billboard',
          lat: 13.72,
          lng: 100.52,
          status: 'verified',
          image_url: '',
        },
      },
    };
    await mockBase44(page, db);
    const events = await captureAnalyticsEvents(page);

    await page.goto('/location/loc-4');
    await expect(page.getByRole('button', { name: /Re-check this spot/i })).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole('button', { name: /Re-check this spot/i }).click();
    await page
      .getByLabel('Or choose from gallery')
      .locator('input[type="file"]')
      .setInputFiles(IMG);
    await expect(page.getByRole('button', { name: /Retake/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /Log field check/i }).click();
    await waitForEvent(events, 'recheck_submitted');

    const matches = events.filter((e) => e.event_name === 'recheck_submitted');
    expect(matches).toHaveLength(1);
    expect(matches[0].properties).toMatchObject({ check_type: 'billboard' });
  });
});

test.describe('Traction instrumentation — badge_unlocked', () => {
  function locationsWithReports(count: number) {
    const locations: Record<string, unknown> = {};
    for (let i = 1; i <= count; i++) {
      locations[`loc-${i}`] = { id: `loc-${i}`, created_by_id: ADMIN_USER.id, status: 'pending' };
    }
    return locations;
  }

  test('a genuinely newly-earned badge fires badge_unlocked exactly once', async ({ page }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: locationsWithReports(1) });
    await page.addInitScript(
      ([key, ids]) => localStorage.setItem(key, JSON.stringify(ids)),
      [`ooh-seen-badges-${ADMIN_USER.id}`, []],
    );
    const events = await captureAnalyticsEvents(page);

    await page.goto('/operative?access_token=mock-admin-token');
    await expect(page.getByRole('heading', { name: 'Merit Badges' })).toBeVisible({
      timeout: 20_000,
    });
    await waitForEvent(events, 'badge_unlocked');

    const matches = events.filter((e) => e.event_name === 'badge_unlocked');
    expect(matches).toHaveLength(1);
    expect(matches[0].properties).toMatchObject({ badge_id: 'first_blood' });
  });

  test('an already-seen badge never fires a duplicate badge_unlocked', async ({ page }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: locationsWithReports(1) });
    await page.addInitScript(
      ([key, ids]) => localStorage.setItem(key, JSON.stringify(ids)),
      [`ooh-seen-badges-${ADMIN_USER.id}`, ['first_blood']],
    );
    const events = await captureAnalyticsEvents(page);

    await page.goto('/operative?access_token=mock-admin-token');
    await expect(page.getByRole('heading', { name: 'Merit Badges' })).toBeVisible({
      timeout: 20_000,
    });
    // 21 = BADGES.length (gamification.js) -- update alongside any future
    // badge addition/removal, same as the two occurrences in
    // new-badge-recognition.spec.ts.
    await expect(page.getByText('1 / 21 earned')).toBeVisible();

    expect(events.filter((e) => e.event_name === 'badge_unlocked')).toHaveLength(0);
  });
});
