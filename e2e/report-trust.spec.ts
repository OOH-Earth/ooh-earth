import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

test.describe('report page trust and participation guidance', () => {
  test('does not show a funding prompt while someone is contributing', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/report');
    // The contextual nudge appears ~1.4s after load on routes that have a hint.
    await page.waitForTimeout(2500);
    await expect(page.getByText('Fuel the next action window')).toHaveCount(0);
  });

  test('other routes keep their contribution nudge', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/map');
    await expect(page.getByText('Document a new billboard')).toBeVisible({ timeout: 8000 });
  });

  test('photo section states privacy guidance and an honest requirement label', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/report');
    const guidance = page.getByTestId('photo-privacy-guidance');
    await expect(guidance).toBeVisible();
    await expect(guidance).toContainText(/faces, number plates, private property/i);
    await expect(guidance).toContainText(/removed from the uploaded copy/i);
    await expect(guidance).toContainText(/may be shown publicly/i);
    await expect(page.getByText(/Cover photo/i).first()).toContainText('(recommended)');
    await expect(page.getByText(/Cover photo/i).first()).not.toContainText('(required)');
  });
});
