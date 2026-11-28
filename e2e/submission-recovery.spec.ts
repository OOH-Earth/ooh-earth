import { test, expect, type Page } from '@playwright/test';
import { mockBase44, type MockDb } from './fixtures/mockBase44';

// A draft and its ticket are saved on the device before the first send, so a reload, a lost
// response or a second tab reconciles one submission and does not start another.
// The backend here is a mock; the server guarantee is covered by the Deno ticket tests.

async function setup(page: Page) {
  const db: MockDb = { user: null, locations: {}, locationPhotos: [] };
  await mockBase44(page, db);
  const calls: any[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/functions/submitOffline')) calls.push(request.postDataJSON());
  });
  return { db, calls };
}

async function submitReport(page: Page, address = '900 Test Ave, Testville') {
  await page.goto('/report');
  await page.getByPlaceholder('Street, district, city').fill(address);
  await page.getByText('Enter coordinates manually').click();
  await page.getByPlaceholder('Latitude').fill('13.75');
  await page.getByPlaceholder('Longitude').fill('100.50');
  const submit = page.locator('button[type="submit"]');
  await submit.click();
  await submit.click();
  await submit.click();
  await expect(submit).toHaveText(/Transmit report/i);
  await submit.click();
}

const drafts = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<any[]>((resolve) => {
        const open = indexedDB.open('ooh_offline');
        open.onsuccess = () => {
          const all = open.result.transaction('captures').objectStore('captures').getAll();
          all.onsuccess = () => resolve(all.result);
        };
      }),
  );

test('success: one ticket, one send, no draft left behind', async ({ page }) => {
  const { calls } = await setup(page);
  await submitReport(page);
  await expect(page.getByText(/Transmission received/i)).toBeVisible();
  expect(calls.map((c) => c.action ?? 'send')).toEqual(['reserve', 'send']);
  expect(calls[1].ticket_id).toBeTruthy();
  expect(await drafts(page)).toEqual([]);
});

test('reload during a hung send: the same ticket and id are reused', async ({ page }) => {
  const { calls } = await setup(page);
  let hang = true;
  await page.route('**/functions/submitOffline', async (route) => {
    const body = route.request().postDataJSON();
    if (hang && !body.action) return; // never answers
    return route.fallback();
  });
  await submitReport(page);
  await expect.poll(async () => (await drafts(page))[0]?.ticket_id).toBeTruthy();
  const before = (await drafts(page))[0];
  hang = false;
  await page.reload();
  expect((await drafts(page))[0].operation_id).toBe(before.operation_id);
  // Age the in-flight marker instead of waiting out the window, then retry by hand.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const open = indexedDB.open('ooh_offline');
        open.onsuccess = () => {
          const tx = open.result.transaction('captures', 'readwrite');
          const store = tx.objectStore('captures');
          const all = store.getAll();
          all.onsuccess = () => store.put({ ...all.result[0], sending_since: 0 });
          tx.oncomplete = () => resolve();
        };
      }),
  );
  await page.getByRole('button', { name: /waiting to sync/i }).click();
  await expect.poll(async () => (await drafts(page)).length).toBe(0);
  expect(calls.filter((c) => c.action === 'reserve')).toHaveLength(1);
  const sends = calls.filter((c) => !c.action);
  expect(sends).toHaveLength(2);
  expect(new Set(sends.map((c) => c.ticket_id)).size).toBe(1);
  expect(new Set(sends.map((c) => c.payload.client_operation_id)).size).toBe(1);
});

test('pending confirmation is kept and does not count as a failed attempt', async ({ page }) => {
  await setup(page);
  await page.route('**/functions/submitOffline', async (route) => {
    if (route.request().postDataJSON().action) return route.fallback();
    return route.fulfill({ status: 202, json: { ok: false, pending: true } });
  });
  await submitReport(page);
  await expect(page.getByText(/Queued offline/i)).toBeVisible();
  const badge = page.getByRole('button', { name: /waiting to sync/i });
  await badge.click();
  await expect(badge).toBeEnabled();
  expect((await drafts(page))[0].retries).toBe(0);
});

test('a draft can be discarded, and another account sees none of its content', async ({ page }) => {
  await setup(page);
  await page.route('**/functions/submitOffline', (route) =>
    route.fulfill({ status: 503, json: { error: 'mocked' } }),
  );
  await submitReport(page, 'Private Street 12');
  await expect(page.getByText(/Queued offline/i)).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const open = indexedDB.open('ooh_offline');
        open.onsuccess = () => {
          const tx = open.result.transaction('captures', 'readwrite');
          const store = tx.objectStore('captures');
          const all = store.getAll();
          all.onsuccess = () => store.put({ ...all.result[0], owner: 'someone-else' });
          tx.oncomplete = () => resolve();
        };
      }),
  );
  await page.reload();
  await page.getByRole('button', { name: 'Drafts' }).click();
  const dialog = page.getByRole('dialog', { name: 'Saved drafts' });
  await expect(dialog.getByText('Saved by another account')).toBeVisible();
  await expect(dialog.getByText(/Private Street/)).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Send now' })).toHaveCount(0);
  page.once('dialog', (confirm) => confirm.accept());
  await dialog.getByRole('button', { name: 'Discard' }).click();
  await expect.poll(async () => (await drafts(page)).length).toBe(0);
});

test('unavailable storage and a failed send are reported, not hidden', async ({ page }) => {
  await setup(page);
  await page.addInitScript(() => {
    indexedDB.open = () => {
      throw new DOMException('quota', 'QuotaExceededError');
    };
  });
  await page.route('**/functions/submitOffline', (route) =>
    route.fulfill({ status: 503, json: { error: 'mocked' } }),
  );
  await submitReport(page);
  await expect(page.getByText(/could not save a copy/i)).toBeVisible();
});

for (const width of [320, 390]) {
  test(`draft controls fit the header and dialog at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await setup(page);
    await page.route('**/functions/submitOffline', (route) =>
      route.fulfill({ status: 503, json: { error: 'mocked' } }),
    );
    await submitReport(page);
    await expect(page.getByText(/Queued offline/i)).toBeVisible();
    const trigger = page.getByRole('button', { name: 'Drafts' });
    await expect(trigger).toBeInViewport({ ratio: 1 });
    await trigger.click();
    await expect(
      page.getByRole('dialog', { name: 'Saved drafts' }).getByRole('button', { name: 'Discard' }),
    ).toBeInViewport({ ratio: 1 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });
}
