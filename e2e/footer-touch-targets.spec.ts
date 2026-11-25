import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// The footer's secondary link list (Contact/Union/Site columns) rendered
// at ~14px tap height on mobile -- well under the 24x24px touch-target
// guideline. Fixed by giving each link `py-1.5 -my-1.5`: the padding grows
// the tappable box, the matching negative margin cancels its effect on
// sibling spacing, so the visual layout (governed by the <ul>'s space-y-2)
// is unchanged -- verified via before/after screenshot comparison, pixel
// identical. This test guards the tap-target size, not the visual layout.

test.use({ viewport: { width: 390, height: 844 } });

test('footer links meet the 24px minimum touch-target height on mobile', async ({ page }) => {
  await mockBase44(page, { user: null, locations: {} });
  await page.goto('/');

  // This is a pure client-rendered SPA (no SSR) -- 'domcontentloaded' fires
  // once the initial HTML/JS document is parsed, before React has
  // necessarily mounted the footer. Querying the DOM at that point is a
  // real race (reproduced in CI: the footer intermittently isn't there
  // yet), not evidence the footer is missing. Wait for it via an
  // auto-retrying assertion instead of a static waitForLoadState + count.
  const footerLinks = page.locator('footer ul a, footer ul button, footer ul a[href]');
  await expect(footerLinks.first()).toBeVisible();
  const count = await footerLinks.count();
  expect(count).toBeGreaterThan(0);

  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('footer ul a')).map((el) => ({
      text: (el.textContent || '').trim(),
      href: el.getAttribute('href') || '',
      height: el.getBoundingClientRect().height,
    })),
  );

  // Meaningful navigation, not just a count: the shared footer must keep every
  // working Union and Site destination, expose the single email contact, and
  // must not advertise the removed inactive social channels.
  const byText = (t: string) => links.filter((l) => l.text === t);
  expect(byText('hello@ooh.earth').map((l) => l.href)).toEqual(['mailto:hello@ooh.earth']);
  for (const t of ['Advertisers Anonymous', 'Sponsor / Fund', 'Foundation']) {
    expect(byText(t), `Union link "${t}" missing`).toHaveLength(1);
  }
  for (const t of ['Map', 'Report', 'Plans', 'Contact', 'Support']) {
    expect(byText(t), `Site link "${t}" missing`).toHaveLength(1);
  }
  expect(byText('About')).toHaveLength(2); // one under Union, one under Site
  expect(links.filter((l) => /instagram\.com|twitch\.tv|zora\.co|pump\.fun/i.test(l.href))).toEqual(
    [],
  );
  expect(links).toHaveLength(11);

  for (const l of links) {
    expect(l.height, `${l.text} is shorter than the 24px floor`).toBeGreaterThanOrEqual(24);
  }
});
