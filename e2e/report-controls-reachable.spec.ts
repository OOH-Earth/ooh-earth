import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// Real-click actionability on the first-user form with every fixed layer present
// (header, bottom tabs, bottom nudge bar). Playwright's click scrolls the target
// into view and fails if another element would receive the pointer event, so this
// proves each control can actually be pressed -- not just that it has a box.
const SIZES = [
  { width: 844, height: 390 },
  { width: 568, height: 320 },
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 1024, height: 768 },
];

for (const size of SIZES) {
  test(`report form controls can be pressed at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/report');
    // wait for the nudge bar so the fixed layers are all present
    await page
      .getByText(/fuel the next action/i)
      .waitFor({ timeout: 8000 })
      .catch(() => {});
    const controls = [
      page.getByRole('button', { name: '02 IDENTIFY' }),
      page.getByRole('button', { name: 'BILLBOARD' }),
      page.locator('label[aria-label="Capture live"]'),
      page.locator('label[aria-label="Upload"]'),
      page.getByRole('button', { name: /locate me/i }),
      page.getByText('Enter coordinates manually', { exact: true }),
      page.getByRole('button', { name: /^continue$/i }),
    ];
    for (const control of controls) {
      await control.scrollIntoViewIfNeeded();
      await control.click({ trial: true, timeout: 8000 });
    }
    // and a real step change still works end to end
    await page.getByText('Enter coordinates manually', { exact: true }).click();
    await page.getByPlaceholder('Latitude').fill('51.45');
    await page.getByPlaceholder('Longitude').fill('-2.58');
    await page.getByRole('button', { name: /^continue$/i }).click();
    await expect(page.getByText('// Step 2 of 4')).toBeVisible();
  });
}
