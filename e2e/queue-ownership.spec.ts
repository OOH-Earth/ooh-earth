import { test, expect, type Page } from '@playwright/test';
import { mockBase44, ADMIN_USER } from './fixtures/mockBase44';

// MOCKED backend + Chromium emulation. Proves the queue never sends a draft under a
// different identity on its own, never discards it, and sends only on explicit choice.

const MEMBER_A = {
  ...ADMIN_USER,
  id: 'member-A',
  email: 'a@oohearth.test',
  role: 'user',
  access: 'member',
};
const MEMBER_B = {
  ...ADMIN_USER,
  id: 'member-B',
  email: 'b@oohearth.test',
  role: 'user',
  access: 'member',
};

const draft = (title: string, opId: string, owner?: string | null) => ({
  payload: {
    title,
    type: 'billboard',
    lat: 1,
    lng: 2,
    status: 'pending',
    client_operation_id: opId,
  },
  operation_id: opId,
  entityType: 'Location',
  created: Date.now(),
  retries: 0,
  ...(owner === undefined ? {} : { owner }),
});

async function setup(page: Page, user: any | null, seed: any[]) {
  await mockBase44(page, { user, locations: {} });
  const sent: any[] = [];
  await page.route('**/functions/submitOffline', (route) => {
    sent.push(route.request().postDataJSON().payload);
    return route.fulfill({
      json: { ok: true, duplicate: false, record: { id: 'srv-1', status: 'pending' } },
    });
  });
  const url = user ? '/report?access_token=mock-token' : '/report';
  await page.goto(url);
  // wait for the app to have created the queue database, then seed it and reload
  await expect
    .poll(() =>
      page.evaluate(async () =>
        (await indexedDB.databases()).some((d) => d.name === 'ooh_offline'),
      ),
    )
    .toBe(true);
  await page.evaluate(
    (items) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('ooh_offline');
        open.onsuccess = () => {
          const tx = open.result.transaction('captures', 'readwrite');
          items.forEach((i: any) => tx.objectStore('captures').add(i));
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
    seed,
  );
  await page.reload();
  return sent;
}

const queue = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<any[]>((resolve) => {
        const open = indexedDB.open('ooh_offline');
        open.onsuccess = () => {
          const req = open.result
            .transaction('captures', 'readonly')
            .objectStore('captures')
            .getAll();
          req.onsuccess = () =>
            resolve(
              req.result.map((i: any) => ({
                title: i.payload.title,
                owner: i.owner ?? null,
                adoptedFrom: i.adopted_from ?? null,
              })),
            );
        };
      }),
  );

test('an anonymous draft is NOT sent when a member signs in; it is held, kept, and sent only on explicit choice', async ({
  page,
}) => {
  const sent = await setup(page, MEMBER_A, [draft('anon draft', 'op-anon-1', 'anonymous')]);
  await expect(page.getByRole('button', { name: /on hold/i })).toBeVisible();
  await page.waitForTimeout(3500);
  expect(sent, 'nothing may be sent automatically').toHaveLength(0);
  expect(await queue(page)).toHaveLength(1);
  // declining keeps it
  await page.getByRole('button', { name: /on hold/i }).click();
  await expect(page.getByRole('alertdialog')).toContainText('before you signed in');
  await page.getByRole('button', { name: /keep on this device/i }).click();
  await page.waitForTimeout(1500);
  expect(sent).toHaveLength(0);
  expect(await queue(page)).toHaveLength(1);
  // explicit choice sends it, once, under the signed-in account
  await page.getByRole('button', { name: /on hold/i }).click();
  await page.getByRole('button', { name: /send under this account/i }).click();
  await expect.poll(() => sent.length, { timeout: 15000 }).toBe(1);
  expect(sent[0].client_operation_id).toBe('op-anon-1');
  await expect.poll(async () => (await queue(page)).length, { timeout: 15000 }).toBe(0);
});

test("another member's draft is never sent and offers no adopt action after an account switch", async ({
  page,
}) => {
  const sent = await setup(page, MEMBER_B, [draft('A draft', 'op-a-1', MEMBER_A.id)]);
  await expect(page.getByRole('status', { name: /another account/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /on hold/i })).toHaveCount(0);
  await page.waitForTimeout(3500);
  expect(sent).toHaveLength(0);
  expect(await queue(page)).toHaveLength(1);
});

test("after sign-out a member's draft stays on the device and is not sent anonymously", async ({
  page,
}) => {
  const sent = await setup(page, null, [draft('member draft', 'op-m-1', MEMBER_A.id)]);
  await expect(page.getByRole('status', { name: /another account/i })).toBeVisible();
  await page.waitForTimeout(3500);
  expect(sent).toHaveLength(0);
  expect(await queue(page)).toHaveLength(1);
});

test('a legacy draft with no recorded owner is held, not guessed', async ({ page }) => {
  const sent = await setup(page, MEMBER_A, [draft('legacy draft', 'op-l-1')]);
  await expect(page.getByRole('button', { name: /on hold/i })).toBeVisible();
  await page.waitForTimeout(3500);
  expect(sent).toHaveLength(0);
  expect(await queue(page)).toHaveLength(1);
});

test("a member's own draft still syncs automatically", async ({ page }) => {
  const sent = await setup(page, MEMBER_A, [draft('own draft', 'op-own-1', MEMBER_A.id)]);
  await expect.poll(() => sent.length, { timeout: 15000 }).toBe(1);
  await expect.poll(async () => (await queue(page)).length, { timeout: 15000 }).toBe(0);
});

test("an anonymous visitor's own draft still syncs automatically", async ({ page }) => {
  const sent = await setup(page, null, [draft('anon own', 'op-anon-own', 'anonymous')]);
  await expect.poll(() => sent.length, { timeout: 15000 }).toBe(1);
});

test('new queued drafts are tagged with the identity that saved them', async ({ page }) => {
  await mockBase44(page, { user: MEMBER_A, locations: {} });
  await page.route('**/functions/submitOffline', (route) =>
    route.fulfill({ status: 503, json: { error: 'x' } }),
  );
  await page.goto('/report?access_token=mock-token');
  await page.getByText('Enter coordinates manually', { exact: true }).click();
  await page.getByPlaceholder('Latitude').fill('51.4545');
  await page.getByPlaceholder('Longitude').fill('-2.5879');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /^continue$/i }).click();
  await page.getByRole('button', { name: /transmit report/i }).click();
  await expect(page.getByRole('heading', { name: 'Saved on this device' })).toBeVisible();
  const [item] = await queue(page);
  expect(item.owner).toBe(MEMBER_A.id);
});
