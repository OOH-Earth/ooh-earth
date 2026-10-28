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
  // heading must not imply figures exist or assert concealment
  await expect(page.locator('#ad-spend h2')).toContainText('Ad spend');
  await expect(page.locator('#ad-spend')).not.toContainText(/they bury|climate damage/i);
});

test('Map makes no InvokeLLM request; removed layers are disabled even if saved', async ({
  page,
}, testInfo) => {
  // Mobile: the layer controls live in the map sheet owned by the UI-release work (#383), so
  // their placement is covered there; the shared network/state logic is proven on desktop.
  test.skip(testInfo.project.name.includes('mobile'), 'layer-toggle placement differs on mobile');
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
  // aria-disabled (not disabled): still focusable so keyboard/screen-reader users reach the reason
  const removed = page.locator('button[aria-disabled="true"][title^="Unavailable"]');
  await expect(removed).toHaveCount(3);
  await removed.first().focus();
  await expect(removed.first()).toBeFocused();
  await expect(removed.first()).toHaveAttribute('aria-label', /unavailable/i);
  await expect(removed.first()).toHaveAttribute('aria-describedby', 'unsupported-layer-note');
  await expect(page.locator('#unsupported-layer-note')).toContainText('Unavailable');
  const saved = () => page.evaluate(() => localStorage.getItem('ooh-map-layers-v2'));
  const before = await saved();
  // Playwright treats aria-disabled controls as not actionable, so force the pointer click
  // and also press Enter/Space on the focused control: none may activate anything.
  await removed.first().click({ force: true });
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);
  expect(await saved()).toEqual(before);
  expect(spy.llm).toEqual([]);
});

for (const route of ['/ecology', '/warzones']) {
  test(`${route} explains unavailability, no counts, no requests`, async ({ page }) => {
    const spy = await installRequestSpy(page);
    await page.goto(route);
    await settle(page);
    // request assertions first so an unfixed build fails on the captured calls, not a selector
    expect(spy.llm).toEqual([]);
    expect([...spy.unexpectedExternal]).toEqual([]);
    // visible at every width (mobile hides the results sidebar in split mode)
    await expect(page.getByTestId('layer-unavailable')).toBeVisible();
    await expect(page.getByTestId('layer-unavailable')).toContainText('Unavailable');
    await expect(page.locator('body')).not.toContainText(/\d+ results/);
  });
}
