import { test, expect } from '@playwright/test';
import { openMapWithMock } from './helpers/mapGeometry';
import { sheet, height, btn, settle, tap, touchDrag } from './helpers/sheet';

// David's report: the sheet's collapse chevron and diagonal arrow "do not work" on a phone.
// These specs drive the controls with real pointer/touch input (never el.click()), and cover the
// reproduced stuck-height defect: a drag whose pointer-up never arrives used to leave the sheet at
// an arbitrary height while the buttons only flipped their labels.

const VIEWPORTS: [number, number][] = [
  [320, 640],
  [390, 844],
  [844, 390],
];

for (const [w, h] of VIEWPORTS) {
  test.describe(`sheet controls @ ${w}x${h}`, () => {
    test.use({ viewport: { width: w, height: h }, deviceScaleFactor: 3, hasTouch: true });

    test('touch taps: expand, collapse, repeat, fullscreen and back', async ({ page }) => {
      test.setTimeout(90_000);
      await openMapWithMock(page, { view: 'flat' });
      const peek = await height(page);
      for (let i = 0; i < 3; i++) {
        await tap(page, 'Expand list');
        await expect.poll(() => height(page)).toBeGreaterThan(peek + 50);
        await tap(page, 'Collapse list');
        await expect.poll(() => height(page)).toBe(peek);
      }
      await tap(page, 'Fullscreen map');
      await expect(page.locator('body')).toHaveClass(/map-fullscreen/);
      await tap(page, 'Exit fullscreen');
      await expect(page.locator('body')).not.toHaveClass(/map-fullscreen/);
    });

    test('a drag whose pointer-up is lost never strands the sheet', async ({ page }) => {
      test.setTimeout(90_000);
      await openMapWithMock(page, { view: 'flat' });
      const peek = await height(page);
      await tap(page, 'Expand list');
      await expect.poll(() => height(page)).toBeGreaterThan(peek + 50);
      // Begin a drag on the sheet's grab area and never release it (as when the browser takes
      // the touch over): the old build kept the live drag height and ignored every button after.
      await page.evaluate(() => {
        const s = document.querySelector('.ooh-bottom-sheet') as HTMLElement;
        const r = s.getBoundingClientRect();
        const target = document.elementFromPoint(r.x + r.width / 2, r.y + 6) as HTMLElement;
        const ev = (type: string, y: number) =>
          new PointerEvent(type, {
            bubbles: true,
            pointerId: 9,
            pointerType: 'touch',
            isPrimary: true,
            clientX: r.x + r.width / 2,
            clientY: y,
          });
        target.dispatchEvent(ev('pointerdown', r.y + 6));
        window.dispatchEvent(ev('pointermove', r.y + 120));
        target.dispatchEvent(ev('pointermove', r.y + 120));
      });
      await tap(page, 'Collapse list');
      await expect.poll(() => height(page), 'collapse button wins over a stale drag').toBe(peek);
      await tap(page, 'Expand list');
      await expect.poll(() => height(page)).toBeGreaterThan(peek + 50);
    });

    test('touch drag on the handle opens and closes the sheet', async ({ page }) => {
      test.setTimeout(90_000);
      await openMapWithMock(page, { view: 'flat' });
      const peek = await height(page);
      const hb = await sheet(page)
        .getByRole('button', { name: 'Resize list' })
        .boundingBox();
      expect(hb).toBeTruthy();
      const from = { x: hb!.x + hb!.width / 2, y: hb!.y + hb!.height / 2 };
      await touchDrag(page, from, -260);
      await expect.poll(() => height(page)).toBeGreaterThan(peek + 80);
      await settle(page);
      const open = await sheet(page)
        .getByRole('button', { name: 'Resize list' })
        .boundingBox();
      await touchDrag(page, { x: open!.x + open!.width / 2, y: open!.y + open!.height / 2 }, 600);
      await expect.poll(() => height(page)).toBe(peek);
    });

    test('keyboard: handle arrows, Enter, and focus return on the buttons', async ({ page }) => {
      test.setTimeout(90_000);
      await openMapWithMock(page, { view: 'flat' });
      const peek = await height(page);
      const handle = sheet(page).getByRole('button', { name: 'Resize list' });
      await handle.focus();
      await page.keyboard.press('ArrowUp');
      const half = await expect.poll(() => height(page)).toBeGreaterThan(peek + 50);
      void half;
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => height(page)).toBe(peek);
      await page.keyboard.press('Enter');
      await expect.poll(() => height(page)).toBeGreaterThan(peek + 50);
      await btn(page, 'Collapse list').focus();
      await page.keyboard.press('Enter');
      await expect(btn(page, 'Expand list')).toBeFocused();
    });
  });
}
