import { test, expect, type Page } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// Shared header telemetry strip. Approved budget: keep the deployed footprint (header 96px below md and
// 98px from md up, strip 31px; measured on the production build 1dbddda at 320, 390, 768, 844 and 1280
// wide) while text is at least 12px; narrow screens keep the countdown, air quality and coordinates
// behind one labelled disclosure instead of 7-9px text.

const BUDGET: [number, number, number][] = [
  [320, 640, 96],
  [390, 844, 96],
  [767, 1024, 96],
  [768, 1024, 98],
  [844, 390, 98],
  [1280, 720, 98],
];

async function open(page: Page, w: number, h: number) {
  await page.setViewportSize({ width: w, height: h });
  await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
  await mockBase44(page, { user: null });
  await page.goto('/report');
  // the Report route is a lazy chunk: give it the same generous wait as the other Report specs
  await expect(page.locator('header')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
}

const strip = (page: Page) => page.locator('header #telemetry-details, header').first();

for (const [w, h, headerMax] of BUDGET) {
  test(`footprint and readable text @ ${w}x${h}`, async ({ page }) => {
    await open(page, w, h);
    const m = await page.evaluate(() => {
      const hd = document.querySelector('header')!;
      const bar = hd.querySelector('.min-h-\\[31px\\]') as HTMLElement;
      const small: string[] = [];
      for (const el of bar.querySelectorAll('*')) {
        if (!(
          el.childNodes.length &&
          [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())
        ))
          continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const px = parseFloat(getComputedStyle(el).fontSize);
        if (px < 12) small.push(`${el.textContent!.trim().slice(0, 20)}:${px}`);
      }
      return {
        header: Math.round(hd.getBoundingClientRect().height * 10) / 10,
        strip: Math.round(bar.getBoundingClientRect().height * 10) / 10,
        small,
        hScroll: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    expect(m.strip, 'strip keeps its deployed 31px').toBeLessThanOrEqual(31.5);
    expect(m.strip).toBeGreaterThanOrEqual(30.5);
    expect(m.header, 'header does not grow').toBeLessThanOrEqual(headerMax + 0.5);
    expect(m.small, 'strip text is at least 12px').toEqual([]);
    expect(m.hScroll).toBe(false);
  });
}

test.describe('disclosure below md', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('mouse/touch, keyboard, Escape with focus return, outside press', async ({ page }) => {
    await open(page, 390, 844);
    const btn = page.getByRole('button', { name: 'Climate clock and air quality details' });
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    const panel = page.getByRole('region', { name: 'Climate and air quality details' });
    await expect(panel).toContainText('1.5°C deadline');
    await expect(panel).toContainText('Air quality (PM2.5)');
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(btn).toBeFocused();
    // keyboard open / close, then an outside press
    await page.keyboard.press('Enter');
    await expect(panel).toBeVisible();
    await page.keyboard.press('Space');
    await expect(panel).toHaveCount(0);
    await btn.click();
    await page.mouse.click(200, 500);
    await expect(panel).toHaveCount(0);
  });

  test('touch tap opens it', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await ctx.newPage();
    await open(page, 390, 844);
    const b = (await page
      .getByRole('button', { name: 'Climate clock and air quality details' })
      .boundingBox())!;
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await expect(
      page.getByRole('region', { name: 'Climate and air quality details' }),
    ).toBeVisible();
    await ctx.close();
  });

  test('the panel does not cover the primary navigation actions', async ({ page }) => {
    await open(page, 390, 844);
    await page.getByRole('button', { name: 'Climate clock and air quality details' }).click();
    const r = await page.evaluate(() => {
      const p = document.getElementById('telemetry-details')!.getBoundingClientRect();
      const nav = document.querySelector('header')!.getBoundingClientRect();
      return { panelTop: p.top, headerBottom: nav.bottom };
    });
    // it opens below the header (over page content), never over the header's own controls
    expect(r.panelTop).toBeGreaterThanOrEqual(r.headerBottom - 1);
  });
});

test.describe('from md up', () => {
  test.use({ viewport: { width: 1280, height: 720 } });
  test('no disclosure button; countdown is inline and readable', async ({ page }) => {
    await open(page, 1280, 720);
    await expect(
      page.getByRole('button', { name: 'Climate clock and air quality details' }),
    ).toBeHidden();
    await expect(
      page.locator('header').getByText('1.5°C').locator('visible=true').first(),
    ).toBeVisible();
  });
});

void strip;
