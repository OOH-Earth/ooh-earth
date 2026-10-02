import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

for (const viewport of [
  { width: 360, height: 800 },
  { width: 844, height: 390 },
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
    await page.getByRole('button', { name: 'Capture photo', exact: true }).click();
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
