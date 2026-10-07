import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

test('Home terrain cards lead to the public Location Detail', async ({ page }) => {
  await mockBase44(page, {
    user: null,
    locations: {
      'loc-home-discovery': {
        id: 'loc-home-discovery',
        title: 'Home discovery fixture',
        type: 'billboard',
        status: 'verified',
        lat: 13.7563,
        lng: 100.5018,
        address: 'Bangkok, Thailand',
      },
    },
  });

  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const terrain = page.getByText('The terrain, now');
  await expect(terrain).toBeVisible({ timeout: 60_000 });
  await expect(
    page.getByRole('link', { name: /Open Home discovery fixture location detail/i }),
  ).toHaveAttribute('href', '/location/loc-home-discovery');
  await expect(
    page.getByRole('link', { name: /Open Home discovery fixture location detail/i }),
  ).toBeVisible();
});
