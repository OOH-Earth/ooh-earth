import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

for (const viewport of [
  { width: 360, height: 800 },
  { width: 844, height: 390 },
  { width: 844, height: 412 },
  { width: 1440, height: 900 },
]) {
  test(`manual capture coordinates remain editable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await mockBase44(page, { user: null, locations: {} });
    await page.addInitScript(() => {
      localStorage.setItem('ooh-map-view', JSON.stringify('flat'));
      Object.defineProperty(navigator, 'geolocation', {
        value: { getCurrentPosition: (_success: unknown, error: Function) => error({ code: 1 }) },
      });
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: () => Promise.reject(new Error('Camera unavailable')) },
      });
    });
    const writes: string[] = [];
    page.on('request', (request) => {
      if (
        /\/entities\//.test(request.url()) &&
        ['POST', 'PUT', 'DELETE'].includes(request.method())
      ) {
        writes.push(request.url());
      }
    });
    await page.goto('/map');
    const captureButton = page.getByRole('button', { name: 'Capture photo', exact: true });
    await expect(captureButton).toBeVisible();
    // Short landscape viewports (e.g. 844x390) can let the mobile results
    // sheet's peek height reach high enough to cover the floating map
    // controls. Assert real clearance, not just that the click eventually
    // lands, so this can't silently regress behind a click-retry loop.
    const clearance = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Capture photo"]');
      const sheet = document.querySelector('.ooh-bottom-sheet');
      // lg:hidden keeps the sheet in the DOM on desktop; skip when it isn't
      // actually laid out (zero box / display:none via offsetParent).
      if (!btn || !sheet || sheet.offsetParent === null) return null;
      const b = btn.getBoundingClientRect();
      const s = sheet.getBoundingClientRect();
      const intersects = !(
        b.right < s.left ||
        b.left > s.right ||
        b.bottom < s.top ||
        b.top > s.bottom
      );
      return { intersects, gap: s.top - b.bottom };
    });
    if (clearance) {
      expect(clearance.intersects).toBe(false);
      expect(clearance.gap).toBeGreaterThanOrEqual(8);
    }
    await captureButton.click();
    const latitude = page.getByRole('textbox', { name: 'Latitude', exact: true });
    const longitude = page.getByRole('textbox', { name: 'Longitude', exact: true });
    await expect(latitude).toBeVisible();
    await latitude.fill('40.7484');
    // Native typing catches removal as soon as the second coordinate has
    // its first character, which a single fill can conceal.
    await longitude.pressSequentially('-73.9857');
    await expect(longitude).toHaveValue('-73.9857');
    await expect(longitude).toBeFocused();
    await expect(latitude).toBeVisible();
    await latitude.fill('40.7485');
    await expect(latitude).toHaveValue('40.7485');
    await expect(longitude).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'Street or district (optional)' }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(writes).toEqual([]);
  });
}

test('delayed dialog autofocus preserves a coordinate input already being edited', async ({
  page,
}) => {
  await mockBase44(page, { user: null, locations: {} });
  await page.route('**/api/app-logs/**', (route) => route.fulfill({ json: {} }));
  await page.addInitScript(() => {
    localStorage.setItem('ooh-map-view', JSON.stringify('flat'));
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: (_success: unknown, error: Function) => error({ code: 1 }) },
    });
  });
  await page.goto('/map');
  await expect(page.getByRole('button', { name: 'Capture photo', exact: true })).toBeVisible();
  // Hold animation frames only while the capture dialog is open. This reproduces a
  // delayed opening frame without slowing typing or changing the dialog's code.
  await page.evaluate(() => {
    const original = window.requestAnimationFrame.bind(window);
    const pending: Array<() => void> = [];
    let held = true;
    window.requestAnimationFrame = (callback) =>
      original((time) => {
        if (held && document.querySelector('[aria-label="Anonymous field capture"]')) {
          pending.push(() => callback(time));
        } else callback(time);
      });
    Object.assign(window, {
      releaseCaptureFrames: () => {
        held = false;
        for (const callback of pending.splice(0)) callback();
      },
      pendingCaptureFrames: () => pending.length,
    });
  });
  await page.getByRole('button', { name: 'Capture photo', exact: true }).click();
  const longitude = page.getByRole('textbox', { name: 'Longitude', exact: true });
  await expect(longitude).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => (window as any).pendingCaptureFrames()))
    .toBeGreaterThan(0);
  await longitude.pressSequentially('-73');
  await expect(longitude).toBeFocused();
  await page.evaluate(() => (window as any).releaseCaptureFrames());
  await expect(
    longitude,
    'Delayed initial autofocus must preserve the edited longitude',
  ).toBeFocused();
  await longitude.pressSequentially('.9857');
  await expect(longitude).toHaveValue('-73.9857');
});
