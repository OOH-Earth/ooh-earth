import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// The footer's secondary link list (Channels/Union/Site columns) rendered
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

  const heights = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('footer ul a'));
    return links.map((el) => el.getBoundingClientRect().height);
  });

  expect(heights.length).toBeGreaterThanOrEqual(12);
  for (const h of heights) {
    expect(h).toBeGreaterThanOrEqual(24);
  }
});
