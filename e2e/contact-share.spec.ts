import { test, expect, type Page } from '@playwright/test';
import { mockBase44, filterCrashes, type MockDb } from './fixtures/mockBase44';

// Contact page + shared social/contact surfaces (restored experience: social
// cards, email, support-form route, Report route; no orbital visual) and the
// Location detail Share affordance.

const SHOTS = process.env.SHOTS_DIR;
const INSTAGRAM = 'https://www.instagram.com/oohstreetmaps/';
const TWITCH = 'https://twitch.tv/oohearth';
const ZORA = 'https://zora.co/@oohearth';
const PUMP = 'https://pump.fun/BwVYGpW3wqe6UZWoLDj4UbxXc94n813MSJcDNePApump';
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: '320', width: 320, height: 640 },
  { name: '390', width: 390, height: 780 },
  { name: '844x390', width: 844, height: 390 },
];

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

test.describe('Contact page', () => {
  for (const vp of VIEWPORTS) {
    test(`social cards, email and actions fit and are reachable at ${vp.name}`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await mockBase44(page, { user: null });
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/contact');
      const main = page.locator('main');
      await expect(main.getByRole('heading', { name: 'Direct channels' })).toBeVisible();

      const expected: [RegExp, string][] = [
        [/Instagram\s*@oohstreetmaps/, INSTAGRAM],
        [/Twitch\s*oohearth/, TWITCH],
        [/Zora\s*@oohearth/, ZORA],
        [/^hello@ooh\.earth$/, 'mailto:hello@ooh.earth'],
        [/^Send a support message$/, '/support'],
        [/^Report a billboard or adbust$/, '/report'],
      ];
      await expect(main.getByRole('link')).toHaveCount(expected.length);
      for (const [name, href] of expected) {
        const link = main.getByRole('link', { name });
        await expect(link).toHaveAttribute('href', href);
        if (href.startsWith('https:')) {
          await expect(link).toHaveAttribute('target', '_blank');
          await expect(link).toHaveAttribute('rel', 'noreferrer');
        }
        await link.focus();
        await expect(link).toBeFocused();
        // Centred in the viewport, the link must be what is hit at its centre.
        const hit = await link.evaluate((el) => {
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
          const r = el.getBoundingClientRect();
          const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return { own: el.contains(top), height: r.height, left: r.left, right: r.right };
        });
        expect(hit.own, `${href} is covered`).toBe(true);
        expect(hit.height).toBeGreaterThanOrEqual(44);
        expect(hit.left).toBeGreaterThanOrEqual(0);
        expect(hit.right).toBeLessThanOrEqual(vp.width);
      }

      await expect(page.locator('[class*="orbital"]')).toHaveCount(0);
      const orbital = await page.evaluate(() =>
        document
          .getAnimations()
          .map((a) => (a as CSSAnimation).animationName || '')
          .filter((n) => n.startsWith('orbital')),
      );
      expect(orbital).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      await shot(page, `contact-${vp.name}`);
      expect(filterCrashes(errors)).toEqual([]);
    });
  }

  test('keyboard order runs socials, email, support, report', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/contact');
    const links = page.locator('main a');
    await expect(links).toHaveCount(6);
    await links.first().focus();
    for (let i = 1; i < 6; i++) {
      await page.keyboard.press('Tab');
      await expect(links.nth(i)).toBeFocused();
      await expect(links.nth(i)).toHaveCSS('outline-style', 'solid');
    }
  });

  test('Report action opens the report route', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/contact');
    await page.getByRole('link', { name: 'Report a billboard or adbust' }).click();
    await expect(page).toHaveURL(/\/report$/);
  });
});

// The contact form lives on /support (never embedded on /contact). captureLead
// is always mocked here: the real function writes a record and sends email.
test.describe('Support message form', () => {
  async function open(page: Page, reply: { status: number; body: object }) {
    const sent: unknown[] = [];
    await mockBase44(page, { user: null });
    await page.route('**/functions/captureLead', async (route) => {
      sent.push(route.request().postDataJSON());
      await route.fulfill({ status: reply.status, json: reply.body });
    });
    await page.goto('/contact');
    await expect(page.locator('main form')).toHaveCount(0);
    await page.getByRole('link', { name: 'Send a support message' }).click();
    await expect(page).toHaveURL(/\/support$/);
    const form = page.locator('main form').filter({ hasText: 'Message *' });
    await expect(form).toBeVisible({ timeout: 10_000 });
    for (const label of ['Name', 'Email *', 'Message *']) {
      await expect(form.getByText(label, { exact: true })).toBeVisible();
    }
    return { form, sent };
  }

  test('blocks empty and malformed input without calling the backend', async ({ page }) => {
    const { form, sent } = await open(page, { status: 200, body: { ok: true } });
    const email = form.getByPlaceholder('you@email.com');
    const send = form.getByRole('button', { name: 'Send message' });
    await send.click();
    expect(await email.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    await email.fill('not-an-email');
    await form.getByPlaceholder('How can we help?').fill('Hello');
    await send.click();
    expect(await email.evaluate((el: HTMLInputElement) => el.validity.typeMismatch)).toBe(true);
    expect(sent).toEqual([]);
  });

  test('submits once to captureLead and confirms', async ({ page }) => {
    const { form, sent } = await open(page, { status: 200, body: { ok: true } });
    await form.getByPlaceholder('Your name').fill('Test Person');
    await form.getByPlaceholder('you@email.com').fill('test@example.com');
    await form.getByPlaceholder('How can we help?').fill('Mocked message');
    await form.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByText('Transmission received')).toBeVisible();
    expect(sent).toEqual([
      { name: 'Test Person', email: 'test@example.com', message: 'Mocked message', amount: 0 },
    ]);
  });

  test('a backend failure keeps the form and never claims success', async ({ page }) => {
    const { form } = await open(page, { status: 500, body: { error: 'mock failure' } });
    await form.getByPlaceholder('you@email.com').fill('test@example.com');
    await form.getByPlaceholder('How can we help?').fill('Mocked message');
    await form.getByRole('button', { name: 'Send message' }).click();
    await expect(form.getByText(/mock failure|status code 500|went wrong/i)).toBeVisible();
    await expect(form.getByPlaceholder('How can we help?')).toHaveValue('Mocked message');
    await expect(page.getByText('Transmission received')).toHaveCount(0);
  });
});

test.describe('Shared social surfaces', () => {
  for (const route of ['/', '/contact', '/support', '/about']) {
    test(`footer on ${route} carries the restored channels`, async ({ page }) => {
      await mockBase44(page, { user: null });
      await page.goto(route);
      const footer = page.locator('footer').first();
      await expect(footer).toBeAttached({ timeout: 10_000 });
      await footer.scrollIntoViewIfNeeded();
      await expect(footer.getByText('Channels', { exact: true })).toBeVisible();
      for (const [name, href] of [
        ['Instagram', INSTAGRAM],
        ['Twitch', TWITCH],
        ['Zora', ZORA],
        ['$OOHEX · pump.fun', PUMP],
      ]) {
        await expect(footer.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
      }
      await shot(page, `footer-${route.replace(/\W+/g, '_') || 'home'}`);
    });
  }

  test('/support lists the restored Instagram and Twitch channels', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/support');
    const main = page.locator('main');
    await expect(main.getByRole('link', { name: 'Instagram', exact: true })).toHaveAttribute(
      'href',
      INSTAGRAM,
      { timeout: 10_000 },
    );
    await expect(main.getByRole('link', { name: 'Twitch', exact: true })).toHaveAttribute(
      'href',
      TWITCH,
    );
  });

  test('Command Center offers the restored social and token links', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/contact');
    await page
      .getByRole('button', { name: /open command center/i })
      .first()
      .click();
    for (const [name, href] of [
      [/Instagram @oohearth\.app/, INSTAGRAM],
      [/oohearth on Zora/, ZORA],
      [/\$OOHEX · pump\.fun/, PUMP],
    ] as [RegExp, string][]) {
      const link = page.getByRole('link', { name });
      await expect(link).toHaveAttribute('href', href, { timeout: 10_000 });
      await expect(link).toHaveAttribute('target', '_blank');
    }
  });
});

function loc(status: string) {
  return {
    id: 'loc-s1',
    title: 'Ad scan · Share Test',
    type: 'billboard',
    lat: 13.7,
    lng: 100.5,
    status,
    image_url: '',
  };
}

test.describe('Location detail Share affordance', () => {
  test('pending records explain sharing is not yet available and offer no Share button', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: { 'loc-s1': loc('pending') } } as MockDb);
    await page.goto('/location/loc-s1');
    await expect(page.getByTestId('share-unavailable')).toContainText(/after approval/i, {
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: 'Share location' })).toHaveCount(0);
    await shot(page, 'detail-pending');
  });

  for (const vp of VIEWPORTS.slice(1)) {
    test(`pending share note fits without overflow at ${vp.name}`, async ({ page }) => {
      await mockBase44(page, { user: null, locations: { 'loc-s1': loc('pending') } } as MockDb);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/location/loc-s1');
      const note = page.getByTestId('share-unavailable');
      await expect(note).toBeVisible({ timeout: 10_000 });
      const box = (await note.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      await shot(page, `detail-pending-${vp.name}`);
    });
  }

  test('rejected records are not shareable', async ({ page }) => {
    await mockBase44(page, { user: null, locations: { 'loc-s1': loc('rejected') } } as MockDb);
    await page.goto('/location/loc-s1');
    await expect(page.getByRole('button', { name: 'Share location' })).toHaveCount(0);
  });

  const verified = { user: null, locations: { 'loc-s1': loc('verified') } } as MockDb;

  test('verified: copy fallback reports success only when copy succeeds', async ({ page }) => {
    await mockBase44(page, verified);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: async () => {} },
        configurable: true,
      });
    });
    await page.goto('/location/loc-s1');
    await page.getByRole('button', { name: 'Share location' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Link copied' })).toBeVisible();
  });

  test('verified: copy failure shows failure, never "Link copied"', async ({ page }) => {
    await mockBase44(page, verified);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async () => {
            throw new Error('denied');
          },
        },
        configurable: true,
      });
    });
    await page.goto('/location/loc-s1');
    await page.getByRole('button', { name: 'Share location' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Share failed' })).toBeVisible();
    await expect(page.getByText('Link copied')).toHaveCount(0);
  });

  test('verified: native share cancellation is silent', async ({ page }) => {
    await mockBase44(page, verified);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        value: async () => {
          const e = new Error('cancel');
          e.name = 'AbortError';
          throw e;
        },
        configurable: true,
      });
    });
    await page.goto('/location/loc-s1');
    await page.getByRole('button', { name: 'Share location' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/Share failed|Link copied|Shared/)).toHaveCount(0);
  });
});
