import { test, expect, type Page } from '@playwright/test';
import { mockBase44, filterCrashes, type MockDb } from './fixtures/mockBase44';

// Contact page + shared footer (no inactive social channels, email only,
// decorative orbital field) and the Location detail Share affordance.

const SHOTS = process.env.SHOTS_DIR;
const INACTIVE = /instagram\.com|twitch\.tv|zora\.co|pump\.fun/i;
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: '320', width: 320, height: 640 },
  { name: '390', width: 390, height: 780 },
  { name: '844x390', width: 844, height: 390 },
];

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}
async function noInactiveLinks(page: Page) {
  const hrefs = await page
    .locator('a[href]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('href') || ''));
  expect(hrefs.filter((h) => INACTIVE.test(h))).toEqual([]);
}

test.describe('Contact page', () => {
  for (const vp of VIEWPORTS) {
    test(`email-only, orbital field is inert and fits at ${vp.name}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await mockBase44(page, { user: null });
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/contact');
      const email = page.getByRole('link', { name: 'hello@ooh.earth' }).first();
      await expect(email).toBeVisible();
      await expect(email).toHaveAttribute('href', 'mailto:hello@ooh.earth');
      await email.focus();
      await expect(email).toBeFocused();
      await noInactiveLinks(page);
      await expect(
        page.getByText(/direct channels|send a support message|report a billboard/i),
      ).toHaveCount(0);

      const field = page.getByTestId('orbital-field');
      await expect(field).toHaveAttribute('aria-hidden', 'true');
      await expect(field).toHaveCSS('pointer-events', 'none');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      // The email link must be the element hit at its own centre (not covered).
      await email.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, 120)); // clear any fixed header band
      await page.waitForTimeout(600); // let smooth scrolling settle before hit-testing
      const box = (await email.boundingBox())!;
      const topIsEmail = await page.evaluate(
        ([x, y]) => !!document.elementFromPoint(x, y)?.closest('a[href^="mailto:"]'),
        [box.x + box.width / 2, box.y + box.height / 2],
      );
      expect(topIsEmail).toBe(true);
      await shot(page, `contact-${vp.name}`);
      expect(filterCrashes(errors)).toEqual([]);
    });
  }

  test('reduced motion stops all orbital animation', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/contact');
    await expect(page.getByTestId('orbital-field')).toBeAttached();
    const states = await page
      .locator('.orbital-field__spin, .orbital-field__star')
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).animationName));
    expect(states.length).toBeGreaterThan(0);
    expect(new Set(states)).toEqual(new Set(['none']));
    await expect(page.getByTestId('orbital-field')).toHaveAttribute('data-paused', 'true');
  });

  test('animation pauses when the document is hidden', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/contact');
    await expect(page.getByTestId('orbital-field')).toHaveAttribute('data-paused', 'false');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.getByTestId('orbital-field')).toHaveAttribute('data-paused', 'true');
  });
});

test.describe('Shared footer', () => {
  for (const route of ['/', '/contact', '/map', '/adbusting', '/location/loc-x']) {
    test(`no inactive channels on ${route}; Contact entry present`, async ({ page }) => {
      await mockBase44(page, {
        user: null,
        locations: {
          'loc-x': { id: 'loc-x', title: 'X', type: 'mural', status: 'verified', lat: 1, lng: 1 },
        },
      });
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await noInactiveLinks(page);
      const footer = page.locator('footer').first();
      if (await footer.count()) {
        await footer.scrollIntoViewIfNeeded();
        await expect(footer.getByRole('link', { name: 'hello@ooh.earth' })).toHaveAttribute(
          'href',
          'mailto:hello@ooh.earth',
        );
        await expect(footer.getByText('Channels', { exact: true })).toHaveCount(0);
        await expect(footer.getByText('Union', { exact: true })).toBeVisible();
        await expect(footer.getByText('Site', { exact: true })).toBeVisible();
      }
      await shot(page, `footer-${route.replace(/\W+/g, '_') || 'home'}`);
    });
  }
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
