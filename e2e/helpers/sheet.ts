import { expect, type Page } from '@playwright/test';

// Shared helpers for the bottom-sheet specs: real pointer/touch input, never el.click()/dispatch.

export const sheet = (page: Page) => page.locator('.ooh-bottom-sheet');
export const height = async (page: Page) =>
  Math.round((await sheet(page).boundingBox())?.height ?? 0);
export const btn = (page: Page, name: string) =>
  sheet(page).getByRole('button', { name, exact: true });

// The sheet animates its height (0.32s): wait until it stops moving before aiming at a control.
export async function settle(page: Page) {
  let last = '';
  let same = 0;
  for (let i = 0; i < 60 && same < 3; i++) {
    const b = JSON.stringify(await sheet(page).boundingBox());
    same = b === last ? same + 1 : 0;
    last = b;
    await page.waitForTimeout(100);
  }
}

export async function tap(page: Page, name: string) {
  await settle(page);
  const b = await btn(page, name).boundingBox();
  expect(b, `${name} is on screen`).toBeTruthy();
  await page.touchscreen.tap(b!.x + b!.width / 2, b!.y + b!.height / 2);
}

// Real touch gesture through CDP (Input.dispatchTouchEvent), not synthetic DOM events.
export async function touchDrag(page: Page, from: { x: number; y: number }, dy: number) {
  await settle(page);
  const cdp = await page.context().newCDPSession(page);
  const pt = (y: number) => [{ x: from.x, y, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(from.y) });
  for (let i = 1; i <= 8; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: pt(from.y + (dy * i) / 8),
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

// A real touch scroll gesture (CDP Input.synthesizeScrollGesture): what a finger on the list does.
export async function touchScroll(page: Page, at: { x: number; y: number }, dy: number) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.synthesizeScrollGesture', {
    x: at.x,
    y: at.y,
    yDistance: dy,
    gestureSourceType: 'touch',
    speed: 800,
  });
  await cdp.detach();
}
