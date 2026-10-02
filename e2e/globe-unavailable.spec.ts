import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

for (const viewport of [
  { width: 360, height: 800 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
]) {
  test(`Home preserves field discovery without WebGL2 at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await mockBase44(page, { user: null });
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
        if (type === 'webgl2') return null;
        return getContext.call(this, type, ...args);
      } as typeof getContext;
    });
    const crashes: string[] = [];
    page.on('pageerror', (error) => crashes.push(error.message));
    await page.goto('/');
    const fallback = page.getByRole('link', { name: 'Explore the field map', exact: true });
    await expect(fallback).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Something went wrong loading this page.')).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await fallback.click();
    await expect(page).toHaveURL(/\/map$/);
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 30_000 });
    expect(crashes).toEqual([]);
  });
}
