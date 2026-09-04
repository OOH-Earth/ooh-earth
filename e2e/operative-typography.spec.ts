import { test, expect } from '@playwright/test';
import { ADMIN_USER, mockBase44 } from './fixtures/mockBase44';

test.describe('Operative Profile readable type controls', () => {
  test('all text-size presets preserve essential content and page width', async ({ page }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    await page.goto('/operative?access_token=mock-admin-token');
    await expect(page.getByRole('heading', { name: 'Quest Board' })).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole('button', { name: 'Adjust text size' }).click();
    const presets = [
      { label: 'A−', size: '90%' },
      { label: 'A', size: '100%' },
      { label: 'A+', size: '115%' },
      { label: 'A++', size: '130%' },
    ];

    for (const [index, preset] of presets.entries()) {
      await page.getByRole('dialog').getByRole('button').nth(index).click({ force: true });
      expect(
        Number(
          await page
            .locator('html')
            .evaluate((element) => getComputedStyle(element).fontSize.replace('px', '')),
        ),
      ).toBeCloseTo(Number.parseInt(preset.size, 10) * 0.16, 5);
      await expect(page.getByRole('heading', { name: 'Quest Board' })).toBeVisible();
      await expect(page.getByText('Field contributions')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.getByRole('button', { name: 'Adjust text size' }).click({ force: true });
    }

    await page.getByRole('button', { name: 'Reset' }).click();
    expect(
      await page.locator('html').evaluate((element) => getComputedStyle(element).fontSize),
    ).toBe('16px');
  });
});
