import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, devices, type Page } from '@playwright/test';
import { mockBase44, type MockDb } from './fixtures/mockBase44';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.join(__dirname, 'fixtures', 'test-image.png');

// This whole suite is about the mobile re-check funnel specifically -- the
// CTA-below-the-fold finding (recheck-funnel-repro.spec.ts) only reproduces
// at a mobile viewport, where FieldCheckPanel sits well past one screen
// height.
test.use({ ...devices['Pixel 7'] });

// Phase 7 finding: the re-check funnel could only ever emit
// recheck_submitted/recheck_verified -- no signal distinguished "nobody
// saw the CTA" from "saw it, never tapped it" from "tapped it, upload/
// transmission failed" from "submitted but queued, never reached the
// server". These four new events (recheck_cta_viewed, camera_opened,
// recheck_failed, recheck_queued_offline) make those states observable
// for the first time. Same interception pattern as traction-events.spec.ts
// (real network call to analytics/track/batch, not internal SDK state).

async function captureAnalyticsEvents(page: Page) {
  const events: { event_name: string; properties?: Record<string, unknown> }[] = [];
  await page.route('**/analytics/track/batch', async (route) => {
    const body = route.request().postDataJSON() ?? {};
    events.push(...(body.events || []));
    await route.fulfill({ json: { ok: true } });
  });
  return events;
}

function waitForEvent(
  events: { event_name: string; properties?: Record<string, unknown> }[],
  eventName: string,
) {
  return expect
    .poll(() => events.some((e) => e.event_name === eventName), { timeout: 10_000 })
    .toBe(true);
}

function baseDb(): MockDb {
  return {
    user: null,
    locations: {
      'loc-instr': {
        id: 'loc-instr',
        title: 'Billboard · Instrumentation Check',
        type: 'billboard',
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
        image_url: 'https://example.com/original.jpg',
      },
    },
    fieldChecks: {},
  };
}

test.describe('Re-check funnel instrumentation (Phase 7)', () => {
  test('recheck_cta_viewed fires only once the CTA actually scrolls into view, not on page load', async ({
    page,
  }) => {
    await mockBase44(page, baseDb());
    const events = await captureAnalyticsEvents(page);

    await page.goto('/location/loc-instr');
    const cta = page.getByRole('button', { name: /Re-check this spot/i });
    await expect(cta).toBeAttached({ timeout: 10_000 });

    // Confirms the panel really is scrolled off-screen at load (the Phase 7
    // ~1340px-down finding) before asserting the event hasn't fired yet --
    // Locator.isVisible() only checks CSS visibility/layout, not whether
    // the element is within the current scroll position, so it can't tell
    // "rendered off-screen" from "on-screen" on its own.
    const viewportHeight = page.viewportSize()?.height ?? 0;
    const box = await cta.boundingBox();
    const offScreenAtLoad = !box || box.y >= viewportHeight;
    if (!offScreenAtLoad) {
      test.skip(true, 'CTA already within the viewport on this browser/viewport size');
    }
    expect(events.some((e) => e.event_name === 'recheck_cta_viewed')).toBe(false);

    await cta.scrollIntoViewIfNeeded();
    await waitForEvent(events, 'recheck_cta_viewed');
    expect(events.filter((e) => e.event_name === 'recheck_cta_viewed')).toHaveLength(1);
  });

  test('camera_opened fires exactly once when the CTA is tapped', async ({ page }) => {
    await mockBase44(page, baseDb());
    const events = await captureAnalyticsEvents(page);

    await page.goto('/location/loc-instr');
    const cta = page.getByRole('button', { name: /Re-check this spot/i });
    await cta.scrollIntoViewIfNeeded();
    await cta.click();

    await waitForEvent(events, 'camera_opened');
    expect(events.filter((e) => e.event_name === 'camera_opened')).toHaveLength(1);
  });

  test('a failed photo upload fires recheck_failed with stage "upload", not recheck_submitted', async ({
    page,
  }) => {
    await mockBase44(page, baseDb());
    // Registered after mockBase44 -- Playwright matches routes most-recently
    // registered first, so this overrides the broad UploadFile success stub
    // for this test only.
    await page.route('**/integration-endpoints/Core/UploadFile', (route) =>
      route.fulfill({ status: 500, json: { error: 'upload failed' } }),
    );
    const events = await captureAnalyticsEvents(page);

    await page.goto('/location/loc-instr');
    await page.getByRole('button', { name: /Re-check this spot/i }).click();
    await page
      .getByLabel('Or choose from gallery')
      .locator('input[type="file"]')
      .setInputFiles(IMG);

    await expect(page.getByText('Photo upload failed.')).toBeVisible({ timeout: 10_000 });
    await waitForEvent(events, 'recheck_failed');
    const failed = events.filter((e) => e.event_name === 'recheck_failed');
    expect(failed).toHaveLength(1);
    expect(failed[0].properties).toMatchObject({ stage: 'upload' });
    expect(events.some((e) => e.event_name === 'recheck_submitted')).toBe(false);
  });

  test('a submission the server rejects fires recheck_queued_offline, not recheck_submitted', async ({
    page,
  }) => {
    await mockBase44(page, baseDb());
    // Simulates submitOffline itself failing server-side (distinct from
    // being genuinely offline) -- submitFieldCheck's own fallback
    // (src/lib/offlineQueue.js) catches this and queues locally, which is
    // exactly the silent-masking behavior Phase 7 flagged: today this
    // looks identical to a real offline save with zero visibility.
    await page.route('**/functions/submitOffline', (route) =>
      route.fulfill({ status: 503, json: { error: 'unavailable' } }),
    );
    const events = await captureAnalyticsEvents(page);

    await page.goto('/location/loc-instr');
    await page.getByRole('button', { name: /Re-check this spot/i }).click();
    await page
      .getByLabel('Or choose from gallery')
      .locator('input[type="file"]')
      .setInputFiles(IMG);
    await expect(page.getByRole('button', { name: /Retake/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Log field check/i }).click();

    await expect(page.getByText('Queued offline')).toBeVisible({ timeout: 10_000 });
    await waitForEvent(events, 'recheck_queued_offline');
    expect(events.some((e) => e.event_name === 'recheck_submitted')).toBe(false);
  });
});
