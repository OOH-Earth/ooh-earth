import { test, expect, type Page } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// Regression: on Home, the "LIVE FEED / ON AIR" header (fixed, bottom-left) overlapped the
// "Log a field bust" nudge card (fixed, bottom-centre) at phone widths, and sat behind the
// bottom-nav pill at tablet widths. Both are fixed overlays, so assert real DOM bounds.

type Box = { l: number; r: number; t: number; b: number };

async function bounds(page: Page) {
  return page.evaluate(() => {
    const rect = (el: Element | null | undefined): Box | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { l: r.left, r: r.right, t: r.top, b: r.bottom };
    };
    const label = [...document.querySelectorAll('span')].find((x) => x.textContent === 'Live feed');
    const header = label?.parentElement;
    const nudge = [...document.querySelectorAll('div')].find(
      (d) => d.className.includes('z-[70]') && d.className.includes('-translate-x-1/2'),
    );
    const nav = document.querySelector('nav.fixed');
    const navVisible = !!nav && getComputedStyle(nav).display !== 'none';
    return {
      header: rect(header),
      nudge: rect(nudge?.firstElementChild),
      navPill: navVisible ? rect(nav?.firstElementChild) : null,
      opacity: nudge ? getComputedStyle(nudge).opacity : '0',
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      vw: window.innerWidth,
      buttons: navVisible
        ? [...(nav?.querySelectorAll('button') ?? [])].map((x) => rect(x) as Box)
        : [],
    };
  });
}

const hit = (a: Box | null, b: Box | null) =>
  !!a && !!b && a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

const VIEWPORTS = [
  { name: '320', width: 320, height: 640 },
  { name: '360', width: 360, height: 740 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: 'landscape 844x390', width: 844, height: 390 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1440', width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  test(`live feed header never overlaps the nudge or bottom nav @ ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await mockBase44(page, { user: null });
    await page.goto('/');
    await page.getByText('Live feed', { exact: true }).waitFor({ timeout: 60_000 });
    // The nudge appears ~1.4s after load and animates in; the feed then slides above it. Poll the
    // real bounds until settled rather than sleeping (the nudge auto-hides after ~14s).
    const settled = async () => {
      const b = await bounds(page);
      return {
        shown: b.opacity === '1' && !!b.header && !!b.nudge,
        headerVsNudge: hit(b.header, b.nudge),
        headerVsNav: hit(b.header, b.navPill),
        nudgeVsNav: hit(b.nudge, b.navPill),
        overflowX: b.overflowX,
        navFits: !b.navPill || (b.navPill.l >= 0 && b.navPill.r <= b.vw),
        navButtonsClear: b.buttons.every((x, i) => i === 0 || x.l >= b.buttons[i - 1].r - 0.5),
        header: b.header,
        nudge: b.nudge,
      };
    };
    await expect
      .poll(settled, { timeout: 10_000, message: 'feed header, nudge and nav must not intersect' })
      .toMatchObject({
        shown: true,
        headerVsNudge: false,
        headerVsNav: false,
        nudgeVsNav: false,
        navFits: true,
        navButtonsClear: true,
      });
    expect((await settled()).overflowX).toBeLessThanOrEqual(0);

    // Dismissing the nudge returns the feed to its resting position (clearance released).
    await page.getByRole('button', { name: 'Abort' }).click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.documentElement.style.getPropertyValue('--ooh-nudge-clearance'),
        ),
      )
      .toBe('');
  });
}

test.describe('nudge controls, state label and clearance lifecycle', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('dismiss control is a 44px target; idle label is neutral, not ON AIR', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/');
    await page.getByText('Live feed', { exact: true }).waitFor({ timeout: 60_000 });
    await expect(page.getByTestId('live-activity-feed-state')).toHaveText(/standby/i);
    await expect(page.getByText('ON AIR')).toHaveCount(0);
    const abort = page.getByRole('button', { name: 'Abort' });
    await expect(abort).toBeVisible({ timeout: 15_000 });
    const box = (await abort.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    // Larger controls must not push the nudge into the feed header or nav.
    const b = await bounds(page);
    expect(hit(b.header, b.nudge)).toBe(false);
    expect(hit(b.nudge, b.navPill)).toBe(false);
  });

  test('clearance is released on dismiss, route change and resize to desktop', async ({ page }) => {
    const clearance = () =>
      page.evaluate(() => document.documentElement.style.getPropertyValue('--ooh-nudge-clearance'));
    await mockBase44(page, { user: null });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Abort' })).toBeVisible({ timeout: 15_000 });
    await expect.poll(clearance).toMatch(/^\d+px$/);

    // Route change while the nudge is showing.
    await page.getByRole('button', { name: 'Map' }).click();
    await expect(page).toHaveURL(/\/map/);
    await expect.poll(clearance).toBe('');

    // Back to Home: re-appears (not dismissed), then dismiss releases it.
    await page.getByRole('button', { name: 'Home' }).click();
    await expect(page.getByRole('button', { name: 'Abort' })).toBeVisible({ timeout: 15_000 });
    await expect.poll(clearance).toMatch(/^\d+px$/);
    await page.getByRole('button', { name: 'Abort' }).click();
    await expect.poll(clearance).toBe('');

    // Resizing to desktop while visible keeps the feed header clear of the nudge.
    // (Dismissal is remembered in localStorage, so clear it to see the nudge again.)
    await page.evaluate(() => localStorage.removeItem('ooh_nudge_home_report'));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Abort' })).toBeVisible({ timeout: 15_000 });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
    const b = await bounds(page);
    expect(hit(b.header, b.nudge)).toBe(false);
  });
});
