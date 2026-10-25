import { test, expect, type Page } from '@playwright/test';
import { installRequestSpy, FIXTURE_LOCATIONS } from './fixtures/aiRequestSpy';

// The contained public paths (map layer generation, ad-spend table, alert ticker, LLM brand
// extraction) must not call InvokeLLM, and the replacement states must render. Fully offline:
// every external host is stubbed in fixtures/aiRequestSpy.ts and any unlisted external request
// fails the test. Positive control: the same fixture against the unfixed build (ee75604) records
// the calls (see specs/s2-base44-usage-audit/validation.md); a spy that is silent on both builds
// proves nothing, so do not weaken the fixture without re-running that control.

async function settle(page: Page) {
  // no networkidle: polling endpoints never go idle
  await page.waitForTimeout(8000);
}

test('Home makes no InvokeLLM request and counts brands from brand_name', async ({ page }) => {
  const spy = await installRequestSpy(page);
  await page.goto('/');
  await settle(page);
  expect(spy.llm).toEqual([]);
  expect([...spy.unexpectedExternal]).toEqual([]);
  await page.locator('#offenders').scrollIntoViewIfNeeded();
  const registry = page.locator('#offenders');
  await expect(registry).toContainText('Coca-Cola');
  await expect(registry).toContainText('3× logged'); // verified, verified, pending: case/whitespace folded
  await expect(registry).toContainText('Shell');
  await expect(registry).not.toContainText('BP'); // rejected record excluded
  await expect(registry).not.toContainText('LLM-Brand');
  await expect(registry).not.toContainText('watchlist');
  await expect(registry).toContainText(`${FIXTURE_LOCATIONS.length} field records loaded`);
  await page.locator('#ad-spend').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('ad-spend-unavailable')).toContainText('Unavailable');
  await expect(page.locator('#ad-spend')).not.toContainText('OOH spend/yr');
});

test('Map makes no InvokeLLM request; removed layers are disabled even if saved', async ({
  page,
}) => {
  const spy = await installRequestSpy(page);
  await page.addInitScript(() => {
    localStorage.setItem('ooh-map-view', JSON.stringify('flat'));
    localStorage.setItem(
      'ooh-map-layers-v2',
      JSON.stringify(['ads', 'mushrooms', 'flora', 'war', 'rivers']),
    );
  });
  await page.goto('/map');
  await settle(page);
  expect(spy.llm).toEqual([]);
  expect([...spy.unexpectedExternal]).toEqual([]);
  const removed = page.locator('button[title^="Unavailable"]');
  await expect(removed).toHaveCount(3);
  for (let i = 0; i < 3; i++) await expect(removed.nth(i)).toBeDisabled();
});

for (const route of ['/ecology', '/warzones']) {
  test(`${route} explains unavailability, no counts, no requests`, async ({ page }) => {
    const spy = await installRequestSpy(page);
    await page.goto(route);
    await expect(page.getByTestId('layer-unavailable')).toContainText('Unavailable');
    await expect(page.locator('body')).not.toContainText(/\d+ results/);
    await settle(page);
    expect(spy.llm).toEqual([]);
    expect([...spy.unexpectedExternal]).toEqual([]);
  });
}
