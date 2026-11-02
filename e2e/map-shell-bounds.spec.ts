import { test, expect, type Page } from '@playwright/test';
import { openMapWithMock } from './helpers/mapGeometry';
import { mockBase44 } from './fixtures/mockBase44';

// Invariant guard for the reported "scrolling past the screen edge into a blank area" symptom.
// The symptom itself was NOT reproduced in Chromium emulation (documented in docs/design/UI-Fixes.md);
// these assertions pin the properties that would have to break for it to happen here:
//   - /map is an application shell: the document is exactly the viewport tall in every sheet state,
//   - the sheet clamps between peek and full no matter how far a touch drag goes, and recovers after a
//     cancelled gesture (touchcancel),
//   - /, /report are natural documents with no blank tail below their last in-flow content.
// It does not prove anything about iOS Safari rubber-banding, browser chrome or the virtual keyboard.
const VPS = [
  { n: '390x844', w: 390, h: 844 },
  { n: '320x640', w: 320, h: 640 },
  { n: '844x390 short landscape', w: 844, h: 390 },
];
const docFits = (page: Page) =>
  page.evaluate(() => {
    const s = document.scrollingElement!;
    return { scrollH: s.scrollHeight, clientH: s.clientHeight, innerH: innerHeight };
  });
const sheetH = (page: Page) =>
  page.evaluate(() =>
    Math.round(document.querySelector('.ooh-bottom-sheet')!.getBoundingClientRect().height),
  );

async function drag(page: Page, x: number, y0: number, y1: number, cancel = false) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  for (let i = 1; i <= 8; i++)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y0 + ((y1 - y0) * i) / 8 }],
    });
  await cdp.send('Input.dispatchTouchEvent', {
    type: cancel ? 'touchCancel' : 'touchEnd',
    touchPoints: [],
  });
  await page.waitForTimeout(500);
}

for (const vp of VPS) {
  test.describe(`shell bounds @${vp.n}`, () => {
    test.use({
      viewport: { width: vp.w, height: vp.h },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 2,
    });

    test('/map: document never exceeds the viewport; sheet clamps and recovers', async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await openMapWithMock(page, { view: 'flat' });
      const fits = async (label: string) => {
        const d = await docFits(page);
        expect(d.scrollH, `${label}: document taller than viewport`).toBeLessThanOrEqual(d.clientH);
      };
      await fits('initial');
      const peek = await sheetH(page);
      const handle = page
        .locator('.ooh-bottom-sheet [aria-label^="Open or close the list"]')
        .first();
      const hb = async () => (await handle.boundingBox())!;
      let b = await hb();
      await drag(page, b.x + b.width / 2, b.y + b.height / 2, b.y - 2500); // far past the top
      const full = await sheetH(page);
      expect(full).toBeGreaterThan(peek);
      expect(full, 'sheet exceeds the viewport').toBeLessThanOrEqual(vp.h);
      await fits('after drag up');
      b = await hb();
      await drag(page, b.x + b.width / 2, b.y + b.height / 2, b.y + 2500); // far past the bottom
      expect(await sheetH(page), 'sheet below its peek height').toBe(peek);
      await fits('after drag down');
      b = await hb();
      await drag(page, b.x + b.width / 2, b.y + b.height / 2, b.y - 150, true); // cancelled mid-gesture
      // the height transition (0.32s) must finish on a snap, never rest between them
      await expect
        .poll(
          async () => {
            const h = await sheetH(page);
            return h === peek || h === full ? 'snap' : `mid-drag ${h}`;
          },
          {
            timeout: 5_000,
            message: 'sheet must settle on peek or full after a cancelled gesture',
          },
        )
        .toBe('snap');
      // still operable after the cancel
      await page
        .getByRole('button', { name: /^(Open list|Expand list)$/ })
        .first()
        .click();
      await expect.poll(() => sheetH(page), { timeout: 5_000 }).toBeGreaterThan(peek);
      await fits('after reopen');
      const fs = page
        .locator('.ooh-bottom-sheet')
        .getByRole('button', { name: 'Full-screen map (hides navigation)' });
      await fs.click();
      await page.waitForTimeout(700);
      await fits('full-screen map');
    });

    for (const route of ['/', '/report']) {
      test(`${route}: no blank tail below the last in-flow content`, async ({ page }) => {
        test.setTimeout(90_000);
        await mockBase44(page, { user: null, locations: {} });
        await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
        await page.goto(route);
        await page.waitForTimeout(2500);
        await page.mouse.wheel(0, 1);
        await page.waitForTimeout(1500); // lazily mounted sections
        await page.evaluate(() =>
          window.scrollTo({ top: 1e7, behavior: 'instant' as ScrollBehavior }),
        );
        await page.waitForTimeout(1000);
        const tail = await page.evaluate(() => {
          const s = document.scrollingElement!;
          let max = 0;
          document.querySelectorAll('body *').forEach((e) => {
            const cs = getComputedStyle(e);
            if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none')
              return;
            const r = e.getBoundingClientRect();
            if (r.width && r.height) max = Math.max(max, r.bottom + scrollY);
          });
          return s.scrollHeight - max;
        });
        expect(tail, 'blank area below the last content').toBeLessThanOrEqual(2);
      });
    }
  });
}
