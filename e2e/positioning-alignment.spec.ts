import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

test.describe('positioning alignment', () => {
  test('campaign shows a loading state before the total resolves', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.route('**/functions/fieldStats', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({ json: { raised: 0 } });
    });

    const navigation = page.goto('/campaign');
    await expect(page.getByText('Total unavailable')).toBeVisible();
    await navigation;
  });

  test('campaign distinguishes confirmed zero from unavailable and error totals', async ({
    page,
  }) => {
    for (const response of [
      { name: 'zero', fulfill: (route: any) => route.fulfill({ json: { raised: 0 } }) },
      {
        name: 'unavailable',
        fulfill: (route: any) => route.fulfill({ status: 200, json: { raised: 'unknown' } }),
      },
      {
        name: 'error',
        fulfill: (route: any) => route.fulfill({ status: 503, json: { error: 'temporary' } }),
      },
    ]) {
      await test.step(response.name, async () => {
        await mockBase44(page, { user: null, locations: {} });
        await page.route('**/functions/fieldStats', response.fulfill);
        await page.goto('/campaign');
        if (response.name === 'zero') {
          await expect(page.getByText('$0 confirmed')).toBeVisible();
        } else {
          await expect(page.getByText('Total unavailable')).toBeVisible();
          await expect(page.getByText('$0 confirmed')).toHaveCount(0);
        }
      });
      await page.unroute('**/functions/fieldStats');
    }
  });

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`${viewport.name} public pages preserve identity and metadata`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await mockBase44(page, { user: null, locations: {} });

      await page.goto('/');
      await expect(page).toHaveTitle('OOH Earth — Street Art & Adbusting Maps');
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        /adbusting platform.*documents outdoor advertising/i,
      );

      await page.goto('/about');
      await expect(page.getByText('Document first. Interpret carefully.')).toBeVisible();
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
        'content',
        /adbusting.*research.*photography.*creative remixes/i,
      );

      await page.goto('/campaign');
      await expect(page.getByText('Fund the Field Offensive')).toBeVisible();
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
        'content',
        /community-funded work.*outdoor advertising.*creative adbusting/i,
      );
    });
  }
});
