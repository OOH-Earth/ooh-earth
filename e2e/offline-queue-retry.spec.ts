import { test, expect } from '@playwright/test';
import { mockBase44, type MockDb } from './fixtures/mockBase44';

// offlineQueue.js / useOfflineSync.js: a capture that fails to sync
// repeatedly used to be permanently deleted from the local queue once it
// hit MAX_RETRIES (5), with no failure indication -- a field reporter's
// offline-captured evidence could vanish with the badge simply showing one
// fewer "queued" item. Fixed to mark the item 'failed' instead of deleting
// it, stop retrying it automatically, and surface it distinctly in
// OfflineSyncBadge with a manual retry action.
//
// Driven through the real /report submit flow (FieldReport.jsx calls
// submitCapture from offlineQueue.js) and the real OfflineSyncBadge button
// -- this suite runs against `vite preview`'s built output, so the queue
// module can't be imported directly by path in-browser; exercising it
// through the actual UI is also the only way to prove OfflineSyncBadge's
// own rendering is correct, not just the underlying queue logic.

// After a flush-triggering click, the "waiting to sync" button can itself
// disappear (replaced by a "could not sync" one) the moment the item hits
// MAX_RETRIES -- so waiting on that specific locator's own enabled state
// breaks on exactly that transition. Wait on the disabled attribute
// clearing anywhere in the header instead, which holds regardless of which
// named button ends up on screen afterward.
async function waitForSyncToSettle(page: import('@playwright/test').Page) {
  await expect(page.locator('header button:disabled')).toHaveCount(0, { timeout: 5000 });
}

async function submitOneReport(
  page: import('@playwright/test').Page,
  address = '900 Test Ave, Testville',
) {
  await page.goto('/report');
  await page.getByPlaceholder('Street, district, city').fill(address);
  await page.getByText('Enter coordinates manually').click();
  await page.getByPlaceholder('Latitude').fill('13.75');
  await page.getByPlaceholder('Longitude').fill('100.50');
  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.click(); // -> step 2
  await submitBtn.click(); // -> step 3
  await submitBtn.click(); // -> step 4
  await expect(submitBtn).toHaveText(/Transmit report/i);
  await submitBtn.click(); // submit -> submitCapture()
  // Wait for the async submitCapture() to actually settle (either outcome)
  // before returning -- a caller that immediately navigates away (e.g. a
  // second submitOneReport()) would otherwise abort this one's in-flight
  // request, since page.goto() cancels pending requests from the page it's
  // leaving.
  await expect(page.getByText(/Transmission received|Queued offline/i)).toBeVisible({
    timeout: 10_000,
  });
}

async function mockSubmitOfflineAlwaysFails(page: import('@playwright/test').Page) {
  let calls = 0;
  await page.route('**/functions/submitOffline', async (route) => {
    calls++;
    await route.fulfill({ status: 500, json: { error: 'mocked sync failure' } });
  });
  return () => calls;
}

test.describe('Offline queue — retry exhaustion preserves evidence', () => {
  test('below MAX_RETRIES stays queued/pending, and one failed item does not block others', async ({
    page,
  }) => {
    test.setTimeout(30_000);
    const db: MockDb = { user: null, locations: {}, locationPhotos: [] };
    await mockBase44(page, db);
    const getCalls = await mockSubmitOfflineAlwaysFails(page);

    await submitOneReport(page);

    const badge = page.getByRole('button', { name: /waiting to sync/i });
    await expect(badge).toBeVisible({ timeout: 10_000 });

    // 3 manual retries (below MAX_RETRIES=5) via the real badge button --
    // each click awaited to completion before the next, so retries aren't
    // double-counted by overlapping flushes.
    for (let i = 0; i < 3; i++) {
      await badge.click();
      await waitForSyncToSettle(page);
    }
    expect(getCalls()).toBe(4); // 1 initial attempt (online, submitCapture) + 3 manual
    await expect(page.getByRole('button', { name: /waiting to sync/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /could not sync/i })).toHaveCount(0);
  });

  test('reaching MAX_RETRIES preserves the capture instead of deleting it, and stops automatic retry', async ({
    page,
  }) => {
    test.setTimeout(30_000);
    const db: MockDb = { user: null, locations: {}, locationPhotos: [] };
    await mockBase44(page, db);
    const getCalls = await mockSubmitOfflineAlwaysFails(page);

    await submitOneReport(page);
    const queuedBadge = page.getByRole('button', { name: /waiting to sync/i });
    await expect(queuedBadge).toBeVisible({ timeout: 10_000 });

    // The initial submitCapture() attempt just enqueues on its own catch --
    // it does not call incrementRetries. Only flush()'s catch does that, so
    // 5 manual retries (via the badge, each a real flush()) are what
    // actually drives retries 0->5, reaching MAX_RETRIES.
    for (let i = 0; i < 5; i++) {
      await queuedBadge.click();
      await waitForSyncToSettle(page);
    }

    // Old behavior: the item is silently deleted here -- pendingCount drops
    // to 0, no failed indicator, badge disappears entirely (this assertion
    // is what fails against the pre-fix code).
    await expect(page.getByRole('button', { name: /waiting to sync/i })).toHaveCount(0);
    const failedBadge = page.getByRole('button', { name: /could not sync/i });
    await expect(failedBadge).toBeVisible();

    const callsAtExhaustion = getCalls();
    expect(callsAtExhaustion).toBe(6); // 1 initial (submitCapture) + 5 manual (flush)

    // Reload -- failed items must survive a full page reload (IndexedDB is
    // persistent storage, unlike in-memory React state).
    await page.reload();
    await expect(page.getByRole('button', { name: /could not sync/i })).toBeVisible({
      timeout: 10_000,
    });

    // A failed item must not be retried by automatic sync. Dispatching a
    // real 'online' event (the same event useOfflineSync listens for) must
    // not produce a new network call against the failed item.
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.waitForTimeout(1000);
    expect(
      getCalls(),
      'a failed item must not be retried by the automatic online/interval flush path',
    ).toBe(callsAtExhaustion);
  });

  test('manual retry can recover a failed item once the backend succeeds', async ({ page }) => {
    test.setTimeout(30_000);
    const db: MockDb = { user: null, locations: {}, locationPhotos: [] };
    await mockBase44(page, db);

    let failNext = true;
    await page.route('**/functions/submitOffline', async (route) => {
      if (failNext) return route.fulfill({ status: 500, json: { error: 'mocked sync failure' } });
      return route.fallback(); // let mockBase44's own handler create the real record
    });

    await submitOneReport(page);
    const queuedBadge = page.getByRole('button', { name: /waiting to sync/i });
    await expect(queuedBadge).toBeVisible({ timeout: 10_000 });
    for (let i = 0; i < 5; i++) {
      await queuedBadge.click();
      await waitForSyncToSettle(page);
    }
    const failedBadge = page.getByRole('button', { name: /could not sync/i });
    await expect(failedBadge).toBeVisible();

    failNext = false; // backend "recovers"
    await failedBadge.click();

    await expect(page.getByRole('button', { name: /could not sync/i })).toHaveCount(0, {
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: /waiting to sync/i })).toHaveCount(0);
  });

  test('one item exhausting retries does not block a different item from syncing', async ({
    page,
  }) => {
    test.setTimeout(30_000);
    const db: MockDb = { user: null, locations: {}, locationPhotos: [] };
    await mockBase44(page, db);

    // BADADDR always fails. GOODADDR fails only its first attempt (so it
    // genuinely enters the queue alongside BADADDR, the same as any real
    // capture submitted while briefly offline/unreachable), then succeeds
    // on the next flush -- distinguishes the two queued items by their
    // real request payload, not by call order (the flush loop processes
    // items in whatever order listCaptures() returns them, which this test
    // must not assume).
    const attempts: Record<string, number> = {};
    await page.route('**/functions/submitOffline', async (route) => {
      const body = route.request().postDataJSON();
      const address = body?.payload?.address ?? '';
      attempts[address] = (attempts[address] ?? 0) + 1;
      if (address.includes('BADADDR')) {
        return route.fulfill({ status: 500, json: { error: 'mocked sync failure' } });
      }
      if (address.includes('GOODADDR') && attempts[address] === 1) {
        return route.fulfill({ status: 500, json: { error: 'mocked transient failure' } });
      }
      return route.fallback();
    });

    await submitOneReport(page, 'BADADDR Test Ave, Testville');
    await submitOneReport(page, 'GOODADDR Test Ave, Testville');

    // Both queued -- each attempted once on submit (online path) and
    // failed, so both landed in the local queue.
    await expect(page.getByRole('button', { name: /2 reports waiting to sync/i })).toBeVisible({
      timeout: 10_000,
    });

    const badge = page.getByRole('button', { name: /waiting to sync/i });
    for (let i = 0; i < 5; i++) {
      await badge.click();
      await waitForSyncToSettle(page);
    }

    // BADADDR is now failed (preserved, not deleted); GOODADDR synced and
    // was removed -- neither outcome interfered with the other.
    await expect(page.getByRole('button', { name: /1 report could not sync/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /waiting to sync/i })).toHaveCount(0);
  });
});
