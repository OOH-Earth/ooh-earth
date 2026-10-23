import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// The shared toast containers (src/components/ui/toast.jsx) are fixed, z-100 and always mounted.
// Empty, they used to intercept clicks: a 420x32 box at the bottom-right on sm+ (it covered the
// map's zoom-out and attribution) and a full-width 32px strip at the top on phones. They must be
// click-through; real toasts opt back in via pointer-events-auto (covered by toast-dismiss.spec.ts).
for (const [w, h] of [
  [390, 844],
  [1440, 900],
]) {
  test(`empty toast containers do not intercept pointer events @ ${w}x${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await mockBase44(page, { user: null, locations: {}, fieldChecks: {} });
    await page.goto('/map');
    await page.getByTestId('field-attention-toggle').waitFor({ timeout: 30_000 });
    const report = await page.evaluate(() => {
      const boxes = [...document.querySelectorAll('div.fixed')].filter((e) =>
        /(^|\s)z-\[100\](\s|$)/.test(e.className),
      );
      return boxes.map((e) => {
        const r = e.getBoundingClientRect();
        const topEl = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return {
          pe: getComputedStyle(e).pointerEvents,
          size: [Math.round(r.width), Math.round(r.height)],
          interceptsOwnCentre: topEl === e,
        };
      });
    });
    expect(report.length, 'toast containers are mounted').toBeGreaterThan(0);
    for (const b of report) {
      expect(b.pe).toBe('none');
      expect(b.interceptsOwnCentre).toBe(false);
    }
  });
}
