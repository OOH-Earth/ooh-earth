import { test, expect } from '@playwright/test';
import { openMapWithMock } from './helpers/mapGeometry';
import { sheet, height, btn, settle, tap } from './helpers/sheet';

// Map-first mobile arrival: the collapsed sheet is a compact, labelled results handle.

test.describe('map-first arrival', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true });

  test('fresh arrival: compact labelled results handle; Open list browses; Collapse returns', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await openMapWithMock(page, { view: 'flat' });
    const peek = await height(page);
    expect(peek, 'collapsed sheet is a header-only handle').toBeLessThanOrEqual(80);
    const open = sheet(page).getByRole('button', { name: /open list/i });
    await expect(open).toBeVisible();
    await expect(open).toContainText(/\d+/); // result count in the label
    const url = page.url();
    await settle(page);
    const b = await open.boundingBox();
    await page.touchscreen.tap(b!.x + b!.width / 2, b!.y + b!.height / 2);
    await expect.poll(() => height(page)).toBeGreaterThan(peek + 100);
    await expect(btn(page, 'Collapse list')).toBeVisible();
    // the list scrolls inside the sheet without resizing it
    await expect
      .poll(() => height(page), 'half snap is 42% of the viewport')
      .toBe(Math.round(844 * 0.42));
    const h = await height(page);
    await sheet(page)
      .locator('.relative.overflow-y-auto')
      .first()
      .evaluate((el) => (el.scrollTop = 40));
    expect(await height(page)).toBe(h);
    await tap(page, 'Collapse list');
    await expect.poll(() => height(page)).toBe(peek);
    expect(page.url(), 'sheet changes do not navigate or reset state').toBe(url);
  });

  test('reduced motion: no height transition', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openMapWithMock(page, { view: 'flat' });
    const d = await sheet(page).evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(parseFloat(d), 'effectively no transition').toBeLessThan(0.001);
  });

  test('map position survives sheet state changes', async ({ page }) => {
    test.setTimeout(90_000);
    await openMapWithMock(page, { view: 'flat' });
    const center = () =>
      page.evaluate(() => {
        const c = document.querySelector('.leaflet-container') as any;
        const key = Object.keys(c).find((k) => k.startsWith('_leaflet'));
        return key ? 'present' : 'unknown';
      });
    const before = await page
      .locator('.leaflet-map-pane')
      .evaluate((el) => (el as HTMLElement).style.transform);
    await tap(page, 'Expand list');
    await tap(page, 'Collapse list');
    await expect(page.locator('.leaflet-container')).toBeVisible();
    void center;
    const after = await page
      .locator('.leaflet-map-pane')
      .evaluate((el) => (el as HTMLElement).style.transform);
    expect(after).toBe(before);
  });
});
