import { test, expect, type Page } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// MOCKED backend (mockBase44) + Chromium emulation: proves the client's UI/queue
// logic for permanent vs transient failures -- not live Base44 behaviour.

async function fillAndSubmit(
  page: Page,
  title = 'Classification test',
  { offlineAfterLoad = false } = {},
) {
  await page.goto('/report');
  if (offlineAfterLoad)
    await page.evaluate(() =>
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false }),
    );
  await page
    .getByPlaceholder('Pleonchit', { exact: false })
    .fill(title)
    .catch(() => {});
  await page.getByText('Enter coordinates manually', { exact: true }).click();
  await page.getByPlaceholder('Latitude').fill('51.4545');
  await page.getByPlaceholder('Longitude').fill('-2.5879');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /^continue$/i }).click();
  await page.getByRole('button', { name: /transmit report/i }).click();
}

async function queue(page: Page) {
  return page.evaluate(
    () =>
      new Promise<any[]>((resolve, reject) => {
        const open = indexedDB.open('ooh_offline');
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains('captures')) return resolve([]);
          const req = db.transaction('captures', 'readonly').objectStore('captures').getAll();
          req.onsuccess = () =>
            resolve(
              req.result.map((i: any) => ({
                status: i.status || 'pending',
                retries: i.retries,
                lastErrorStatus: i.last_error_status,
                opId: i.operation_id,
              })),
            );
          req.onerror = () => reject(req.error);
        };
        open.onerror = () => reject(open.error);
      }),
  );
}

for (const [status, text] of [
  [403, /couldn't be accepted/i],
  [422, /details were rejected/i],
] as const) {
  test(`a ${status} response is shown to the person, keeps the form, and is never queued or retried`, async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    let calls = 0;
    await page.route('**/functions/submitOffline', (route) => {
      calls++;
      return route.fulfill({ status, json: { error: 'rejected', code: 'X' } });
    });
    await fillAndSubmit(page);
    await expect(page.getByText(text)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Saved on this device' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Submitted for review' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /transmit report/i })).toBeVisible();
    await page.waitForTimeout(3000);
    expect(calls, 'a permanent failure must be sent exactly once').toBe(1);
    expect(await queue(page)).toEqual([]);
  });
}

test('a transient 503 is queued and keeps one operation id for every retry', async ({ page }) => {
  await mockBase44(page, { user: null, locations: {} });
  const opIds: string[] = [];
  await page.route('**/functions/submitOffline', (route) => {
    const body = route.request().postDataJSON();
    opIds.push(body.payload.client_operation_id);
    return route.fulfill({ status: 503, json: { error: 'Submission unavailable' } });
  });
  await fillAndSubmit(page);
  await expect(page.getByRole('heading', { name: 'Saved on this device' })).toBeVisible();
  const items = await queue(page);
  expect(items).toHaveLength(1);
  expect(items[0].status).toBe('pending');
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect.poll(() => opIds.length, { timeout: 15000 }).toBeGreaterThan(1);
  expect(new Set(opIds).size, 'retries must reuse the same operation id').toBe(1);
});

test('a queued item rejected with 403 fails immediately after one attempt and is kept', async ({
  page,
}) => {
  await mockBase44(page, { user: null, locations: {} });
  let calls = 0;
  await fillAndSubmit(page, 'Classification test', { offlineAfterLoad: true });
  await expect(page.getByRole('heading', { name: 'Saved on this device' })).toBeVisible();
  expect(await queue(page)).toHaveLength(1);
  await page.route('**/functions/submitOffline', (route) => {
    calls++;
    return route.fulfill({ status: 403, json: { error: 'Not permitted', code: 'FORBIDDEN' } });
  });
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
    window.dispatchEvent(new Event('online'));
  });
  await expect.poll(async () => (await queue(page))[0]?.status, { timeout: 15000 }).toBe('failed');
  await page.waitForTimeout(3000);
  expect(calls, 'one attempt only, not MAX_RETRIES').toBe(1);
  const [item] = await queue(page);
  expect(item.lastErrorStatus).toBe(403);
});
