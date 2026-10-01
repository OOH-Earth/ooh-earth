import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

test('Live Activity is reachable above mobile navigation', async ({ page }) => {
  await page.setViewportSize({ width: 387, height: 805 });
  await mockBase44(page, { user: null });
  await page.goto('/');
  await page.locator('[data-tour="globe"]').waitFor({ state: 'attached', timeout: 60_000 });

  const feed = page.getByText('Live feed', { exact: true }).locator('xpath=../..');
  await expect(feed).toBeVisible();
  const geometry = await feed.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      display: getComputedStyle(element).display,
      bottom: rect.bottom,
      viewportHeight: window.innerHeight,
    };
  });

  expect(geometry.display).toBe('flex');
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight - 76);
});

test('Live Activity retains desktop bottom placement', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockBase44(page, { user: null });
  await page.goto('/');
  await page.locator('[data-tour="globe"]').waitFor({ state: 'attached', timeout: 60_000 });

  const feed = page.getByText('Live feed', { exact: true }).locator('xpath=../..');
  await expect(feed).toBeVisible();
  const geometry = await feed.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { bottomGap: window.innerHeight - rect.bottom };
  });

  expect(geometry.bottomGap).toBeGreaterThanOrEqual(8);
  expect(geometry.bottomGap).toBeLessThanOrEqual(20);
});
