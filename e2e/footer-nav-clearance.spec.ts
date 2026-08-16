import { test, expect } from '@playwright/test';

// Regression test for KNOWN_ISSUES.md #32: the fixed bottom mobile nav
// (MobileBottomTabs.jsx, z-[1000], global on every route below the `lg`
// breakpoint) used to overlap SiteFooter's last content because nothing
// reserved clearance for it. Fixed via `pb-[calc(6rem+env(safe-area-inset-bottom))]
// lg:pb-0` directly on SiteFooter's own <footer> element (not on <main>,
// since SiteFooter is a sibling *after* </main>, not its last child —
// padding on <main> has no effect on the true document-end position).
//
// This asserts the real rendered gap between the last visible footer
// control ("Open Command Center") and the fixed nav's top edge, at the
// bottom of the scrollable page — not just that no CSS overflow exists.

const VIEWPORTS = [
  { name: '320px', width: 320, height: 720 },
  { name: '375px', width: 375, height: 812 },
  { name: '390px', width: 390, height: 844 },
];
const PAGES = ['/support', '/plans'];

for (const vp of VIEWPORTS) {
  test.describe(`Footer / mobile-nav clearance — ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const path of PAGES) {
      test(`${path} — "Open Command Center" clears the fixed nav with a real gap`, async ({
        page,
      }) => {
        await page.goto(path);
        await page.waitForTimeout(500);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(300);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(300);

        const nav = page.locator('nav[aria-label="Mobile navigation"]');
        await expect(nav).toBeVisible();
        const openCommandCenter = page.getByRole('button', { name: /Open Command Center/i });
        await expect(openCommandCenter).toBeVisible();

        const navBox = await nav.boundingBox();
        const btnBox = await openCommandCenter.boundingBox();
        if (!navBox || !btnBox) throw new Error('Expected both elements to have a bounding box');

        // Real clearance, not just "doesn't technically overlap" — matches
        // the ~144px measured during the original fix.
        expect(navBox.y - (btnBox.y + btnBox.height)).toBeGreaterThan(50);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBe(clientWidth);
      });
    }
  });
}
