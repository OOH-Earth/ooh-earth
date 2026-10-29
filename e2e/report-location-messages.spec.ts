import { test, expect, type Page } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// /report "Locate me": each failure says what happened and what to do next, and a success clears it.
// getCurrentPosition is replaced with a stub because the browser's real permission UI cannot be driven
// headlessly; the page logic under test is the mapping from the error code to the message.

type Mode = 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'ok';

async function open(page: Page, mode: Mode) {
  await page.addInitScript((m) => {
    localStorage.setItem('ooh_nudge_map_report', '1');
    if (m === 'unsupported') {
      Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true });
      return;
    }
    const codes: Record<string, number> = { denied: 1, unavailable: 2, timeout: 3 };
    const geo = {
      getCurrentPosition(ok: (p: unknown) => void, err: (e: unknown) => void) {
        setTimeout(() => {
          if (m === 'ok') ok({ coords: { latitude: 13.72627, longitude: 100.49183 } });
          else err({ code: codes[m] });
        }, 50);
      },
    };
    Object.defineProperty(navigator, 'geolocation', { value: geo, configurable: true });
  }, mode);
  await mockBase44(page, { user: null });
  await page.goto('/report');
  await expect(page.locator('[data-tour="report-form"]')).toBeVisible();
}

const msg = (page: Page) =>
  page.getByRole('status').filter({ hasText: /search for a place or enter coordinates/i });
const locate = (page: Page) => page.getByRole('button', { name: /locate me/i });

for (const vp of [
  { w: 390, h: 844 },
  { w: 320, h: 640 },
]) {
  test.describe(`report location messages @ ${vp.w}x${vp.h}`, () => {
    test.use({ viewport: { width: vp.w, height: vp.h } });

    const cases: [Mode, RegExp][] = [
      ['denied', /location access is off/i],
      ['unavailable', /unavailable right now/i],
      ['timeout', /took too long/i],
      ['unsupported', /can't share your location/i],
    ];
    for (const [mode, re] of cases) {
      test(`${mode}: specific message`, async ({ page }) => {
        await open(page, mode);
        await locate(page).click();
        await expect(msg(page)).toBeVisible();
        await expect(msg(page)).toHaveText(re);
        await expect(locate(page), 'the button is usable again').toBeEnabled();
      });
    }

    test('success clears an earlier message and fills coordinates', async ({ page }) => {
      await open(page, 'denied');
      await locate(page).click();
      await expect(msg(page)).toBeVisible();
      // second attempt succeeds
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'geolocation', {
          value: {
            getCurrentPosition: (ok: (p: unknown) => void) =>
              ok({ coords: { latitude: 13.72627, longitude: 100.49183 } }),
          },
          configurable: true,
        });
      });
      await locate(page).click();
      await expect(msg(page)).toHaveCount(0);
      await expect(page.getByText('13.72627, 100.49183')).toBeVisible();
    });
  });
}
