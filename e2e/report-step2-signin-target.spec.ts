import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Signed-out visitors who press Identify get an inline "Sign in" link. It must meet the
// 44px touch target, stay keyboard-focusable, send nothing to scanAd, and leave the manual
// form usable.
test.describe('FieldReport step 2 — inline Sign in target', () => {
  for (const vp of [
    { name: 'phone-small', width: 320, height: 640 },
    { name: 'short-landscape', width: 844, height: 390 },
    { name: 'laptop', width: 1280, height: 720 },
  ]) {
    test(`Sign in link is >=44px, focusable, makes no AI request @ ${vp.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await mockBase44(page, { user: null, locations: {} });
      let scanCalls = 0;
      await page.route('**/functions/scanAd', (route) => {
        scanCalls += 1;
        return route.fulfill({ status: 401, json: {} });
      });

      await page.goto('/report');
      await page
        .getByRole('button', { name: 'Upload' })
        .locator('input[type="file"]')
        .setInputFiles(path.join(__dirname, 'fixtures', 'test-image.png'));
      await page.getByRole('button', { name: '02 Identify' }).click();
      await page.getByRole('button', { name: 'Identify', exact: true }).click();

      const link = page.getByRole('link', { name: 'Sign in' });
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);

      await link.focus();
      await expect(link).toBeFocused();
      const input = page.getByPlaceholder("e.g. Shell, McDonald's, Toyota");
      await input.fill('Manual Brand');
      await expect(input).toHaveValue('Manual Brand');
      expect(scanCalls).toBe(0);
    });
  }
});
