import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// MOCKED backend + Chromium emulation. Two tabs of the same browser share the
// IndexedDB queue and the Web Locks namespace. Without the lock both tabs flush the
// same queued report at the same moment and send it twice. This proves the
// same-browser protection ONLY -- it is not backend idempotency.
test('two tabs flushing the same queued report send it once', async ({ context }) => {
  let sends = 0;
  const open = async () => {
    const page = await context.newPage();
    await mockBase44(page, { user: null, locations: {} });
    await page.route('**/functions/submitOffline', async (route) => {
      sends++;
      await new Promise((r) => setTimeout(r, 1500)); // slow enough that the tabs overlap
      return route.fulfill({
        json: { ok: true, duplicate: false, record: { id: 's', status: 'pending' } },
      });
    });
    await page.goto('/report');
    await expect
      .poll(() =>
        page.evaluate(async () =>
          (await indexedDB.databases()).some((d) => d.name === 'ooh_offline'),
        ),
      )
      .toBe(true);
    // let the page finish mounting so its sync hook is listening for the reconnect event
    await page.locator('header').first().waitFor();
    await page.waitForTimeout(3000);
    return page;
  };
  const a = await open();
  const b = await open();
  await a.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const req = indexedDB.open('ooh_offline');
        req.onsuccess = () => {
          const tx = req.result.transaction('captures', 'readwrite');
          tx.objectStore('captures').add({
            payload: {
              title: 'shared draft',
              type: 'billboard',
              lat: 1,
              lng: 2,
              client_operation_id: 'op-two-tabs',
            },
            operation_id: 'op-two-tabs',
            entityType: 'Location',
            created: Date.now(),
            retries: 0,
            owner: 'anonymous',
          });
          tx.oncomplete = () => resolve();
        };
      }),
  );
  // both tabs can see the queued report before either sends it
  expect(
    await b.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const req = indexedDB.open('ooh_offline');
          req.onsuccess = () => {
            const r = req.result
              .transaction('captures', 'readonly')
              .objectStore('captures')
              .count();
            r.onsuccess = () => resolve(r.result);
          };
        }),
    ),
  ).toBe(1);
  // both tabs see the same reconnect at the same instant
  await Promise.all([
    a.evaluate(() => window.dispatchEvent(new Event('online'))),
    b.evaluate(() => window.dispatchEvent(new Event('online'))),
  ]);
  await expect.poll(() => sends, { timeout: 15000 }).toBeGreaterThanOrEqual(1);
  await a.waitForTimeout(4000);
  expect(sends, 'the same report must be sent once, not once per tab').toBe(1);
  const left = await a.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const req = indexedDB.open('ooh_offline');
        req.onsuccess = () => {
          const r = req.result.transaction('captures', 'readonly').objectStore('captures').count();
          r.onsuccess = () => resolve(r.result);
        };
      }),
  );
  expect(left, 'the report was delivered and removed').toBe(0);
});
