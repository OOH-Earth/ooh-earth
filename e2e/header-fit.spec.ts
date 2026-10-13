import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// The top row of the header (not the news ticker, which scrolls by design) must fit
// the viewport at every width: no control clipped off-screen, none covered, none
// wrapped onto two lines. Regression for tablet-portrait / phone-landscape, where
// MENU and COMMAND ran past the right edge.
const SIZES = [
  { width: 320, height: 700 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 600, height: 900 },
  { width: 768, height: 1024 },
  { width: 820, height: 1180 },
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];

for (const size of SIZES) {
  test(`header controls fit and stay reachable at ${size.width}x${size.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/report');
    await page.locator('header').first().waitFor();
    await page.waitForTimeout(1500);
    const report = await page.evaluate(() => {
      const row = document.querySelector('header > div');
      const vw = window.innerWidth;
      const label = (e: Element) =>
        (e.getAttribute('aria-label') || (e as HTMLElement).innerText || '')
          .replace(/\\s+/g, ' ')
          .trim()
          .slice(0, 24);
      const controls = [...row!.querySelectorAll('a, button')].filter((e) => {
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        return r.width > 1 && r.height > 1 && cs.display !== 'none' && cs.visibility !== 'hidden';
      });
      const clipped: string[] = [];
      const covered: string[] = [];
      const wrapped: string[] = [];
      for (const e of controls) {
        const r = e.getBoundingClientRect();
        if (r.left < -1 || r.right > vw + 1)
          clipped.push(`${label(e)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
        const top = document.elementFromPoint(
          Math.min(Math.max(r.left + r.width / 2, 0), vw - 1),
          r.top + r.height / 2,
        );
        // the non-production banner (BACKUP only) may overlap; production has none
        if (top && !e.contains(top) && !top.contains(e) && !top.closest('[role=status]'))
          covered.push(`${label(e)} <- ${label(top)}`);
        if (r.height > 48 && /\\s/.test(((e as HTMLElement).innerText || '').trim()))
          wrapped.push(label(e));
      }
      return { clipped, covered, wrapped, controls: controls.length };
    });
    expect(report.clipped, `clipped header controls: ${report.clipped.join(', ')}`).toEqual([]);
    expect(report.wrapped, `wrapped header controls: ${report.wrapped.join(', ')}`).toEqual([]);
    expect(report.covered, `covered header controls: ${report.covered.join(', ')}`).toEqual([]);
    // the two controls that matter for navigation are present and clickable
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
    await page.getByRole('button', { name: 'Open menu' }).click({ trial: true });
  });
}
