import { test, expect } from '@playwright/test';
import { openMapWithMock } from './helpers/mapGeometry';
import { sheet, height, btn, settle, tap, touchDrag } from './helpers/sheet';

// Sheet robustness, each input path on its own: mouse, touch and keyboard; what must NOT start a
// drag; cancelled gestures; enlarged/long content; hidden content stays out of reach; state survives.
// Chromium only (Playwright WebKit is not installable on this host); never an iPhone test.

test.describe('sheet robustness @ 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true });

  test('mouse: expand, collapse, fullscreen and back with real clicks', async ({ page }) => {
    test.setTimeout(90_000);
    await openMapWithMock(page, { view: 'flat' });
    const peek = await height(page);
    await btn(page, 'Expand list').click();
    await expect.poll(() => height(page)).toBeGreaterThan(peek + 50);
    await settle(page);
    await btn(page, 'Collapse list').click();
    await expect.poll(() => height(page)).toBe(peek);
    await btn(page, 'Fullscreen map').click();
    await expect(page.locator('body')).toHaveClass(/map-fullscreen/);
    await settle(page);
    await btn(page, 'Exit fullscreen').click();
    await expect(page.locator('body')).not.toHaveClass(/map-fullscreen/);
  });

  test('keyboard: Open list, Space on Expand, Enter on handle, no pointer involved', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await openMapWithMock(page, { view: 'flat' });
    const peek = await height(page);
    await sheet(page)
      .getByRole('button', { name: /open list/i })
      .focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => height(page)).toBeGreaterThan(peek + 100);
    await expect(btn(page, 'Collapse list')).toBeFocused();
    await page.keyboard.press('Space');
    await expect.poll(() => height(page)).toBe(peek);
    await expect(btn(page, 'Expand list')).toBeFocused();
    await page.keyboard.press('Space');
    await expect.poll(() => height(page)).toBeGreaterThan(peek + 100);
  });

  test('a press-and-move that starts on a header button never resizes the sheet', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await openMapWithMock(page, { view: 'flat' });
    const peek = await height(page);
    const b = (await btn(page, 'Expand list').boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y - 260, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    expect(await height(page)).toBe(peek);
  });

  test('touching or scrolling the results never resizes the sheet', async ({ page }) => {
    test.setTimeout(90_000);
    await openMapWithMock(page, { view: 'flat', locations: 30 });
    await tap(page, 'Expand list');
    await settle(page);
    await page.waitForTimeout(500);
    const h = await height(page);
    const list = sheet(page).locator('.relative.overflow-y-auto').first();
    const lb = (await list.boundingBox())!;
    // A touch drag that starts on a result: no sheet drag may begin. (Chromium cannot turn CDP touch
    // input into a scroll in this headless setup, even on a plain page, so list touch-scrolling is a
    // device-checklist item; wheel scrolling below proves the list itself scrolls.)
    await touchDrag(page, { x: lb.x + lb.width / 2, y: lb.y + lb.height - 40 }, -220);
    await page.waitForTimeout(400);
    expect(await height(page), 'touch drag on results: sheet height unchanged').toBe(h);
    await page.mouse.move(lb.x + lb.width / 2, lb.y + 200);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect(await height(page), 'wheel scroll: sheet height unchanged').toBe(h);
  });

  test('dragging the map pans the map and does not resize the sheet', async ({ page }) => {
    test.setTimeout(90_000);
    await openMapWithMock(page, { view: 'flat' });
    const peek = await height(page);
    const pane = page.locator('.leaflet-map-pane');
    const before = await pane.evaluate((el) => (el as HTMLElement).style.transform);
    await touchDrag(page, { x: 200, y: 380 }, 120);
    await page.waitForTimeout(400);
    expect(await height(page)).toBe(peek);
    expect(await pane.evaluate((el) => (el as HTMLElement).style.transform)).not.toBe(before);
  });

  test('a cancelled touch drag leaves the sheet on a snap and usable', async ({ page }) => {
    test.setTimeout(90_000);
    await openMapWithMock(page, { view: 'flat' });
    const peek = await height(page);
    const hb = (await sheet(page)
      .getByRole('button', { name: 'Resize list' })
      .boundingBox())!;
    const x = hb.x + hb.width / 2;
    const y = hb.y + hb.height / 2;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id: 1 }],
    });
    for (let i = 1; i <= 6; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y: y - i * 30, id: 1 }],
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await cdp.detach();
    await expect.poll(() => height(page)).toBe(peek);
    await tap(page, 'Expand list');
    await expect.poll(() => height(page)).toBeGreaterThan(peek + 100);
  });

  test('collapsed list is inert; opened list is reachable; focus is never dropped to body', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await openMapWithMock(page, { view: 'flat', locations: 30 });
    const probe = () =>
      sheet(page)
        .locator('a[href]')
        .first()
        .evaluate((a) => {
          (a as HTMLElement).focus();
          return (
            !!document.activeElement &&
            !!a.closest('.ooh-bottom-sheet') &&
            document.activeElement === a
          );
        });
    expect(await probe(), 'collapsed: result links cannot take focus').toBe(false);
    await tap(page, 'Expand list');
    await settle(page);
    expect(await probe(), 'expanded: result links can take focus').toBe(true);
    await tap(page, 'Collapse list');
    await settle(page);
    const active = await page.evaluate(
      () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName,
    );
    expect(active).toBe('Expand list');
  });

  test('map position and route survive collapsing and opening', async ({ page }) => {
    test.setTimeout(120_000);
    await openMapWithMock(page, { view: 'flat', locations: 30 });
    const pane = page.locator('.leaflet-map-pane');
    const pos = await pane.evaluate((el) => (el as HTMLElement).style.transform);
    const url = page.url();
    for (let i = 0; i < 2; i++) {
      await tap(page, 'Expand list');
      await settle(page);
      await tap(page, 'Collapse list');
      await settle(page);
    }
    // The result count follows the visible map area, which legitimately changes when the sheet
    // resizes the map box, so it is not asserted; the map's own position and the route must not move.
    expect(await pane.evaluate((el) => (el as HTMLElement).style.transform)).toBe(pos);
    expect(page.url()).toBe(url);
  });

  test('a filter-mode toggle in Tools survives collapsing and opening the sheet', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await openMapWithMock(page, { view: 'flat', locations: 30 });
    await page.getByRole('button', { name: /tools/i }).first().click();
    const attention = () => page.getByRole('button', { name: /field attention/i }).first();
    await attention().click();
    const pressed = await attention().getAttribute('aria-pressed');
    await page.keyboard.press('Escape');
    await tap(page, 'Expand list');
    await settle(page);
    await tap(page, 'Collapse list');
    await settle(page);
    await page.getByRole('button', { name: /tools/i }).first().click();
    expect(await attention().getAttribute('aria-pressed'), 'filter mode kept').toBe(pressed);
  });

  test('attribution and bottom navigation stay reachable in every sheet state', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await openMapWithMock(page, { view: 'flat' });
    for (const state of ['peek', 'half', 'full'] as const) {
      if (state === 'half') {
        await sheet(page)
          .getByRole('button', { name: /open list/i })
          .click();
      }
      if (state === 'full') {
        await settle(page);
        await tap(page, 'Expand list');
      }
      await settle(page);
      const r = await page.evaluate(() => {
        const sh = document.querySelector('.ooh-bottom-sheet')!.getBoundingClientRect();
        const at = document.querySelector('.leaflet-control-attribution')!.getBoundingClientRect();
        const nav = [...document.querySelectorAll('nav')]
          .map((n) => n.getBoundingClientRect())
          .pop();
        const top = document.elementFromPoint(at.x + 6, at.y + at.height / 2);
        return {
          sheetTop: sh.y,
          attrBottom: at.y + at.height,
          attrTopmost: !!top?.closest('.leaflet-control-attribution'),
          navBottom: nav ? nav.bottom : null,
          vh: innerHeight,
        };
      });
      if (state !== 'full') {
        expect(r.attrBottom, `${state}: attribution above the sheet`).toBeLessThanOrEqual(
          r.sheetTop + 0.5,
        );
        expect(r.attrTopmost, `${state}: attribution is not covered`).toBe(true);
      }
      expect(r.navBottom, `${state}: bottom navigation still on screen`).toBeLessThanOrEqual(r.vh);
    }
  });
});

for (const [w, h] of [
  [320, 640],
  [390, 844],
] as const) {
  test.describe(`enlarged and long content @ ${w}x${h}`, () => {
    test.use({ viewport: { width: w, height: h }, deviceScaleFactor: 3, hasTouch: true });

    test('large count and WCAG text-spacing overrides: the collapsed header grows, nothing is clipped', async ({
      page,
    }) => {
      test.setTimeout(150_000);
      await openMapWithMock(page, { view: 'flat' });
      // The count and label are React-owned; replace the text to simulate a very large count and a
      // long, localized label (layout only: the element keeps its classes and place in the DOM).
      await sheet(page)
        .getByRole('button', { name: /open list/i })
        .locator('span')
        .first()
        .evaluate((el) => {
          el.textContent = '// 1,234,567 Werbeflächen im aktuellen Kartenausschnitt (vorläufig)';
        });
      await page.waitForTimeout(400);
      const base = await height(page);
      expect(base, 'long text already grows the collapsed header').toBeGreaterThanOrEqual(72);
      // WCAG 1.4.12 text spacing plus a larger size, applied to everything in the sheet
      await page.addStyleTag({
        content:
          '.ooh-bottom-sheet *{font-size:16px !important;line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important}',
      });
      await page.waitForTimeout(600);
      const m = await page.evaluate(() => {
        const sh = document.querySelector('.ooh-bottom-sheet') as HTMLElement;
        const r = sh.getBoundingClientRect();
        const row = [...sh.querySelectorAll('button')]
          .filter(
            (b) => !b.closest('[inert]') && b.getAttribute('aria-label') !== 'Resize list',
          )
          .map((b) => {
            const q = b.getBoundingClientRect();
            return {
              n: b.getAttribute('aria-label') ?? b.textContent?.trim().slice(0, 18),
              top: q.y - r.y,
              bottom: q.bottom - r.y,
              right: q.right,
              left: q.x,
            };
          });
        return { h: r.height, row, hScroll: document.documentElement.scrollWidth > innerWidth };
      });
      expect(m.h, 'collapsed height follows the header').toBeGreaterThanOrEqual(base);
      for (const b of m.row) {
        expect(b.top, `${b.n} inside sheet (top)`).toBeGreaterThanOrEqual(0);
        expect(b.bottom, `${b.n} not clipped by the sheet bottom`).toBeLessThanOrEqual(m.h + 0.5);
        expect(b.right, `${b.n} inside viewport`).toBeLessThanOrEqual(w + 0.5);
        expect(b.left, `${b.n} inside viewport`).toBeGreaterThanOrEqual(-0.5);
      }
      expect(m.hScroll, 'no horizontal page scroll').toBe(false);
      await tap(page, 'Expand list');
      await expect.poll(() => height(page)).toBeGreaterThan(m.h + 50);
    });
  });
}
