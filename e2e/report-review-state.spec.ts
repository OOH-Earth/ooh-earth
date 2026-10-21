import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

test.describe('report page does not promise instant public visibility', () => {
  test('header copy describes moderator review, not an open public archive', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/report');
    const body = await page.locator('main').innerText();
    expect(body).toMatch(/saved for moderator review/i);
    expect(body).not.toMatch(/every report enters the public archive/i);
    expect(body).not.toMatch(/no gatekeeper/i);
  });
});
