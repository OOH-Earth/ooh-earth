import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// /report: the page's own controls meet the 24px target minimum (WCAG 2.5.8), its labels meet the
// project's 10px floor, and a validation error raised from another step is announced, focused and
// on screen. Measured from the DOM, not from screenshots.

const VIEWPORTS = [
  { name: 'phone 390x844', width: 390, height: 844 },
  { name: 'phone-small 320x640', width: 320, height: 640 },
  { name: 'short-landscape 844x390', width: 844, height: 390 },
  { name: 'laptop 1280x720', width: 1280, height: 720 },
];

for (const vp of VIEWPORTS) {
  test.describe(`report form @ ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
      await mockBase44(page, { user: null });
      await page.goto('/report');
      await expect(page.locator('[data-tour="report-form"]')).toBeVisible();
    });

    test('page-owned controls are at least 24px and labels at least 10px', async ({ page }) => {
      const result = await page.evaluate(() => {
        const main = document.querySelector('main');
        const vis = (e: Element) => {
          const r = e.getBoundingClientRect();
          const s = getComputedStyle(e);
          return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
        };
        const inScope = (e: Element) => !e.closest('.leaflet-container');
        const small = [...main!.querySelectorAll('button, input, select, textarea, a[href]')]
          .filter((e) => vis(e) && inScope(e))
          .map((e) => {
            const r = e.getBoundingClientRect();
            return {
              n: (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 30),
              w: r.width,
              h: r.height,
            };
          })
          .filter((x) => x.h < 24 || x.w < 24);
        const tiny: string[] = [];
        main!.querySelectorAll('*').forEach((e) => {
          if (!vis(e) || !inScope(e)) return;
          const own = [...e.childNodes].some(
            (n) => n.nodeType === 3 && (n.textContent || '').trim().length > 1,
          );
          if (own && parseFloat(getComputedStyle(e).fontSize) < 10)
            tiny.push((e.textContent || '').trim().slice(0, 30));
        });
        return {
          small,
          tiny,
          hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });
      expect(result.small, 'controls under 24px').toEqual([]);
      expect(result.tiny, 'text under 10px in the report page').toEqual([]);
      expect(result.hScroll).toBe(false);
    });

    test('a validation error raised from step 4 is announced, focused and on screen', async ({
      page,
    }) => {
      const form = page.locator('[data-tour="report-form"]');
      for (let i = 0; i < 3; i++) await form.getByRole('button', { name: 'Continue' }).click();
      await form.getByRole('button', { name: /Transmit report/i }).click();
      const alert = form.getByRole('alert').filter({ hasText: 'GPS coordinates required' });
      await expect(alert).toBeVisible();
      await expect(alert).toBeFocused();
      // scrollIntoView may animate; poll until it settles.
      await expect
        .poll(async () => {
          const box = await alert.boundingBox();
          return !!box && box.y >= 0 && box.y + box.height <= vp.height;
        })
        .toBe(true);
    });
  });
}

test('help hints open on focus and Escape dismisses them', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
  await mockBase44(page, { user: null });
  await page.goto('/report');
  const hint = page.getByRole('button', { name: 'report form' });
  await hint.focus();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});
