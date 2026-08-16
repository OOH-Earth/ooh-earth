import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// No existing coverage rendered ZoraMarketPanel's actual recharts chart
// before this test -- added alongside the recharts 2.15.4 -> 3.10.1
// upgrade specifically to catch a rendering regression in the LineChart/
// YAxis/Tooltip/ResponsiveContainer surface this repo actually uses.

test.describe('ZoraMarketPanel — recharts LineChart renders real market data', () => {
  test('draws the price line and responds to hover once 2+ price points exist', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await mockBase44(page, { user: null, locations: {} });

    // useCoinData only pushes a new history point when the price changes,
    // and only draws the LineChart once history.length > 1 -- return a
    // different price on the second poll so the chart actually mounts.
    let call = 0;
    await page.route('**/api.dexscreener.com/**', (route) => {
      call += 1;
      const price = call === 1 ? '0.001774' : '0.001820';
      route.fulfill({
        json: {
          pairs: [
            {
              priceUsd: price,
              priceChange: { h24: '0.85' },
              marketCap: 1774000,
              volume: { h24: 52000 },
              txns: { h24: { buys: 120, sells: 80 } },
            },
          ],
        },
      });
    });

    await page.clock.install();
    await page.goto('/zora');
    await page.waitForTimeout(1000);
    // useCoinData polls every 20000ms -- fast-forward past one interval.
    await page.clock.fastForward(21_000);
    await page.waitForTimeout(500);

    const svg = page.locator('.recharts-wrapper svg.recharts-surface').first();
    await expect(svg).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.recharts-line-curve').first()).toBeVisible();
    await expect(page.getByText('$0.001820', { exact: true }).first()).toBeVisible();

    // Hover to exercise the Tooltip's formatter/labelFormatter callback
    // props without throwing.
    const box = await svg.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(200);
    }

    expect(filterCrashes(errors), errors.join('\n')).toEqual([]);
  });
});
