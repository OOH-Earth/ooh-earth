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

// The queue syncs on reconnect, every 30s, and on the badge; a test triggers the
// reconnect path explicitly instead of waiting for the interval.
const reconnect = (page: Page) => page.evaluate(() => window.dispatchEvent(new Event('online')));

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
  // singular wording for a single draft (no "have", no "each one")
  await expect(page.getByRole('alertdialog')).toContainText('has not been sent');
  await expect(page.getByRole('alertdialog')).not.toContainText('Choose each one');
  await expect(page.getByRole('alertdialog')).toContainText(
    'records your account as its contributor',
  );
  await expect(page.getByRole('alertdialog')).toContainText('moderator review');
  await page.getByRole('button', { name: /keep on this device/i }).click();
  await page.waitForTimeout(1500);
  expect(sent).toHaveLength(0);
  expect(await queue(page)).toHaveLength(1);
  // explicit choice sends it, once, under the signed-in account
  await page.getByRole('button', { name: /on hold/i }).click();
  await page.getByRole('button', { name: /send under my account: anon draft/i }).click();
  await expect.poll(() => sent.length, { timeout: 15000 }).toBe(1);
  expect(sent[0].client_operation_id).toBe('op-anon-1');
  expect(sent[0]).not.toHaveProperty('owner');
  expect(sent[0]).not.toHaveProperty('adopted_from');
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
  await expect
    .poll(
      async () => {
        await reconnect(page);
        return sent.length;
      },
      { timeout: 15000 },
    )
    .toBe(1);
  await expect.poll(async () => (await queue(page)).length, { timeout: 15000 }).toBe(0);
});

test("an anonymous visitor's own draft still syncs automatically", async ({ page }) => {
  const sent = await setup(page, null, [draft('anon own', 'op-anon-own', 'anonymous')]);
  await expect
    .poll(
      async () => {
        await reconnect(page);
        return sent.length;
      },
      { timeout: 15000 },
    )
    .toBe(1);
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

test('choosing one held draft sends only that one; repeated taps send it once', async ({
  page,
}) => {
  const sent = await setup(page, MEMBER_A, [
    draft('first held', 'op-h-1', 'anonymous'),
    draft('second held', 'op-h-2', 'anonymous'),
  ]);
  await page.getByRole('button', { name: /2 saved reports .* on hold/i }).click();
  const send = page.getByRole('button', { name: /send under my account: first held/i });
  // rapid repeated taps inside one action (the button disappears after the first)
  await send.click({ clickCount: 3, delay: 0 });
  await expect.poll(() => sent.length, { timeout: 15000 }).toBe(1);
  await page.waitForTimeout(2500);
  expect(sent).toHaveLength(1);
  expect(sent[0].client_operation_id).toBe('op-h-1');
  const left = await queue(page);
  expect(left.map((i) => i.title)).toEqual(['second held']);
});

test("another member's draft details are never exposed in the page", async ({ page }) => {
  const foreign = draft('SECRET-TITLE-A', 'op-a-9', MEMBER_A.id);
  (foreign.payload as any).notes = 'SECRET-NOTE-A';
  (foreign.payload as any).lat = 51.123456;
  (foreign.payload as any).image_url = 'https://example.com/SECRET-PHOTO-A.jpg';
  await setup(page, MEMBER_B, [foreign]);
  await expect(page.getByRole('status', { name: /another account/i })).toBeVisible();
  const html = await page.content();
  for (const secret of ['SECRET-TITLE-A', 'SECRET-NOTE-A', '51.123456', 'SECRET-PHOTO-A']) {
    expect(html, `${secret} must not appear in the page`).not.toContain(secret);
  }
});

test("an expired session turns a member's own drafts into held drafts, never anonymous sends", async ({
  page,
}) => {
  const sent = await setup(page, MEMBER_A, [draft('own draft', 'op-exp-1', MEMBER_A.id)]);
  await expect
    .poll(
      async () => {
        await reconnect(page);
        return sent.length;
      },
      { timeout: 15000 },
    )
    .toBe(1);
  // new draft saved while signed in, then the session expires and the page reloads
  await page.evaluate(
    (item) =>
      new Promise<void>((resolve) => {
        const open = indexedDB.open('ooh_offline');
        open.onsuccess = () => {
          const tx = open.result.transaction('captures', 'readwrite');
          tx.objectStore('captures').add(item);
          tx.oncomplete = () => resolve();
        };
      }),
    draft('saved before expiry', 'op-exp-2', MEMBER_A.id),
  );
  await page.route('**/entities/User/me', (route) =>
    route.fulfill({ status: 401, json: { message: 'expired' } }),
  );
  const before = sent.length;
  await page.reload();
  // the app sends an expired session to /login (existing behaviour)
  await page.waitForURL(/\/login/);
  await page.waitForTimeout(3500);
  expect(sent.length, 'nothing may be sent anonymously after expiry').toBe(before);
  expect(await queue(page)).toHaveLength(1);
  // next anonymous visit: the member's draft is held as another account's, never sent
  await page.goto('/report');
  await expect(page.getByRole('status', { name: /another account/i })).toBeVisible();
  await page.waitForTimeout(3000);
  expect(sent.length).toBe(before);
  expect(await queue(page)).toHaveLength(1);
});

test('held drafts survive reloads and are still not sent', async ({ page }) => {
  const sent = await setup(page, MEMBER_A, [draft('held', 'op-r-1', 'anonymous')]);
  await page.reload();
  await page.reload();
  await expect(page.getByRole('button', { name: /on hold/i })).toBeVisible();
  await page.waitForTimeout(3000);
  expect(sent).toHaveLength(0);
  expect(await queue(page)).toHaveLength(1);
});

for (const size of [
  { width: 844, height: 390 },
  { width: 390, height: 844 },
  { width: 360, height: 640 },
]) {
  test(`the held-drafts dialog is fully reachable above the app chrome at ${size.width}x${size.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await mockBase44(page, { user: MEMBER_A, locations: {} });
    await page.route('**/functions/submitOffline', (route) =>
      route.fulfill({
        json: { ok: true, duplicate: false, record: { id: 's', status: 'pending' } },
      }),
    );
    await page.goto('/report?access_token=mock-token');
    await expect
      .poll(() =>
        page.evaluate(async () =>
          (await indexedDB.databases()).some((d) => d.name === 'ooh_offline'),
        ),
      )
      .toBe(true);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const open = indexedDB.open('ooh_offline');
          open.onsuccess = () => {
            const tx = open.result.transaction('captures', 'readwrite');
            [
              'A fairly long saved report title to check truncation inside the list',
              'Second saved report',
            ].forEach((t, i) =>
              tx.objectStore('captures').add({
                payload: {
                  title: t,
                  type: 'billboard',
                  lat: 1,
                  lng: 2,
                  image_url: 'x',
                  client_operation_id: `op-d${i}`,
                },
                operation_id: `op-d${i}`,
                entityType: 'Location',
                created: Date.now(),
                retries: 0,
                owner: 'anonymous',
              }),
            );
            tx.oncomplete = () => resolve();
          };
        }),
    );
    await page.reload();
    // let the fixed bottom nudge bar appear so the layering is really exercised
    await page
      .getByText(/fuel the next action/i)
      .waitFor({ timeout: 8000 })
      .catch(() => {});
    const trigger = page.getByRole('button', { name: /2 saved reports .* on hold/i });
    await trigger.click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();

    const probe = await page.evaluate(() => {
      const d = document.querySelector('[role=alertdialog]') as HTMLElement;
      const r = d.getBoundingClientRect();
      const hit = (el: Element) => {
        el.scrollIntoView({ block: 'nearest' });
        const b = el.getBoundingClientRect();
        const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return !!top && (el === top || el.contains(top) || top.contains(el));
      };
      const buttons = [...d.querySelectorAll('button')];
      const nav = document.querySelector(
        'nav[aria-label="Mobile navigation"]',
      ) as HTMLElement | null;
      let navBlocked = true;
      if (nav) {
        const nb = nav.getBoundingClientRect();
        const top = document.elementFromPoint(nb.left + nb.width / 2, nb.top + nb.height / 2);
        navBlocked = !nav.contains(top);
      }
      return {
        withinViewport:
          r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth + 1,
        scrollsInside:
          d.scrollHeight > d.clientHeight ? getComputedStyle(d).overflowY !== 'visible' : true,
        buttonsHit: buttons.map((b) => hit(b)),
        buttonCount: buttons.length,
        navBlocked,
      };
    });
    expect(probe.withinViewport, 'dialog must fit the visible viewport').toBe(true);
    expect(probe.scrollsInside).toBe(true);
    expect(probe.buttonCount).toBeGreaterThanOrEqual(3);
    expect(
      probe.buttonsHit.every(Boolean),
      `every dialog button must be hit-testable: ${probe.buttonsHit}`,
    ).toBe(true);
    expect(probe.navBlocked, 'the bottom nav must not be clickable through the open dialog').toBe(
      true,
    );

    // keyboard: Escape closes, focus returns to the trigger
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}
