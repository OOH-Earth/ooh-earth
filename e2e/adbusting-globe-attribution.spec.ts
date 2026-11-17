import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// UI-042. The Globe's Esri credit must be visible, readable and reachable (not covered by HUD controls or the
// ticker) at the phone sizes. Measured before the fix on the candidate build: 844x390 -> 0% of the credit owned
// (AIR, zoom column and ticker on top), 320x480 -> 30%. Mock backend only; nothing is written.
const sizes = [
  [320, 568],
  [320, 480],
  [390, 844],
  [844, 390],
] as const;

for (const [w, h] of sizes) {
  test(`Globe Esri credit is visible and not covered @${w}x${h}`, async ({ page }) => {
    await page.route('**/api/**', (r) =>
      r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
    );
    await mockBase44(page, { user: null, locations: {}, fieldChecks: {} });
    await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/adbusting');
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(2000);

    const m = await page.evaluate(() => {
      const c = document.querySelector('.maplibregl-ctrl-attrib') as HTMLElement | null;
      if (!c) return null;
      const inner = c.querySelector('.maplibregl-ctrl-attrib-inner') as HTMLElement;
      const own = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        let n = 0;
        let o = 0;
        for (let i = 0; i < 10; i++)
          for (let j = 0; j < 4; j++) {
            const x = r.left + ((i + 0.5) * r.width) / 10;
            const y = r.top + ((j + 0.5) * r.height) / 4;
            n++;
            const t = document.elementFromPoint(x, y);
            if (t && (el === t || el.contains(t))) o++;
          }
        return { pct: Math.round((100 * o) / n), r };
      };
      const a = own(inner);
      return {
        text: inner.textContent || '',
        font: parseFloat(getComputedStyle(inner).fontSize),
        pct: a.pct,
        inView:
          a.r.left >= 0 && a.r.right <= innerWidth && a.r.top >= 0 && a.r.bottom <= innerHeight,
        shown: getComputedStyle(inner).display !== 'none',
      };
    });
    expect(m).not.toBeNull();
    expect(m!.shown).toBe(true);
    expect(m!.text).toMatch(/Esri/);
    expect(m!.font).toBeGreaterThanOrEqual(12);
    expect(m!.inView).toBe(true);
    expect(m!.pct).toBe(100);
  });
}
