import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

test.describe('positioning alignment', () => {
  const funding = (page: any) => page.getByTestId('funding-total');

  test('campaign shows a checking state, never a figure, before the total resolves', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.route('**/functions/fieldStats', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({ json: { raised: 11 } });
    });

    const navigation = page.goto('/campaign');
    await expect(funding(page)).toHaveText(/Checking funding total/);
    await navigation;
  });

  test('an unverified numeric fieldStats total is never shown as raised, confirmed or received', async ({
    page,
  }) => {
    for (const response of [
      { name: 'legacy numeric total', json: { raised: 11, donors: 1 } },
      { name: 'zero', json: { raised: 0 } },
      { name: 'string total', json: { raised: 'unknown' } },
      {
        name: 'unverified object',
        json: {
          verified_funding: {
            status: 'pending',
            amount: 40,
            currency: 'USD',
            as_of: '2026-10-19T00:00:00Z',
          },
        },
      },
      {
        name: 'wrong currency',
        json: {
          verified_funding: {
            status: 'verified',
            amount: 40,
            currency: 'EUR',
            as_of: '2026-10-19T00:00:00Z',
          },
        },
      },
    ]) {
      await test.step(response.name, async () => {
        await mockBase44(page, { user: null, locations: {} });
        await page.route('**/functions/fieldStats', (route) =>
          route.fulfill({ json: response.json }),
        );
        await page.goto('/campaign');
        await expect(funding(page)).toHaveText('Verified funding total unavailable');
        const body = await page.locator('main').innerText();
        expect(body).not.toMatch(/\$11\b/);
        expect(body).not.toMatch(/\$0 (confirmed|verified|raised)/i);
        expect(body).not.toMatch(/\$[\d,]+ (confirmed|raised|received)/i);
        expect(body).toMatch(/target \$50,000/i);
        await page.unroute('**/functions/fieldStats');
      });
    }
  });

  test('provider/service failure shows unavailable rather than zero', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.route('**/functions/fieldStats', (route) =>
      route.fulfill({ status: 503, json: { error: 'temporary' } }),
    );
    await page.goto('/campaign');
    await expect(funding(page)).toHaveText('Verified funding total unavailable');
    await expect(page.locator('main')).not.toContainText(/\$0/);
  });

  test('a backend-verified total is shown with currency and date, separate from the target', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.route('**/functions/fieldStats', (route) =>
      route.fulfill({
        json: {
          raised: 999,
          verified_funding: {
            status: 'verified',
            amount: 40,
            currency: 'USD',
            as_of: '2026-10-19T00:00:00Z',
          },
        },
      }),
    );
    await page.goto('/campaign');
    await expect(funding(page)).toHaveText('$40 verified');
    await expect(page.locator('main')).toContainText('Provider-verified as of');
    await expect(page.locator('main')).not.toContainText('$999');
  });

  test('the thank-you banner does not claim receipt from the URL alone', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/campaign?status=thanks');
    await expect(
      page.getByText(/counts as received only once the payment provider confirms/),
    ).toBeVisible();
    await expect(page.getByText(/Contribution received/)).toHaveCount(0);
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
