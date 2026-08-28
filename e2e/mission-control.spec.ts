import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, ADMIN_USER } from './fixtures/mockBase44';

test.describe('Mission Control v1', () => {
  test('authenticated operator sees real-contract states, lineage, and environment separation', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await mockBase44(page, { user: ADMIN_USER });
    await page.goto('/mission-control?access_token=mock-admin-token');

    await expect(page.getByRole('heading', { name: 'Mission Control' })).toBeVisible();
    await expect(page.getByText('REAL OPERATIONAL DATA')).toBeVisible();
    await expect(page.getByRole('img', { name: 'System status HEALTHY' })).toBeVisible();
    await expect(page.getByText('fieldStats', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('authenticated operationalHealth response')).toBeVisible();
    await expect(page.getByText('RUNTIME REVISION')).toBeVisible();
    await expect(page.getByText('UNKNOWN', { exact: true }).first()).toBeVisible();

    await page.getByRole('button', { name: 'BACKUP', exact: true }).click();
    await expect(page.getByText('READING').locator('..')).toContainText('BACKUP');
    await expect(page.getByRole('button', { name: 'BACKUP', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.screenshot({ path: '/tmp/mission-control-desktop.png', fullPage: true });

    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog', { name: 'Mission Control commands' })).toBeVisible();
    await expect(page.getByPlaceholder('Search Mission Control')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Mission Control commands' })).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.mc-shell')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    );
    await page.screenshot({ path: '/tmp/mission-control-mobile.png', fullPage: true });
    await expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });

  test('unauthenticated access remains behind the existing route boundary', async ({ page }) => {
    await page.goto('/mission-control');
    await expect(page).toHaveURL(/\/login/);
  });

  test('operational read failure is explicit and does not become a fake incident', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER });
    await page.route('**/functions/operationalHealth**', (route) =>
      route.fulfill({ status: 503, json: { error: 'Operational health unavailable' } }),
    );
    await page.goto('/mission-control?access_token=mock-admin-token');
    await expect(page.getByRole('alert')).toContainText('OPERATIONAL DATA UNAVAILABLE');
    await expect(page.getByRole('img', { name: 'System status UNKNOWN' })).toBeVisible();
  });
});
