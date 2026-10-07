import { test, expect, type Page } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// The Main Map's mushroom / flora / conflict layers are produced by a language model, not by
// observations. They must (1) not be requested until the layer is switched on, and (2) say so
// everywhere they appear. Dated, verifiable ecology lives on /ecology (iNaturalist).

// Prompts of the model-written layers: mushroom hotspots, flora hotspots, conflict zones and the
// environmental news summary ticker.
const PROMPT_KIND = /mushroom foraging|plant biodiversity|conflict zones|environmental alerts/i;

async function openMap(page: Page) {
  await mockBase44(page, { user: null, locations: {} });
  const calls: string[] = [];
  await page.route(
    (url) => url.pathname.endsWith('/integration-endpoints/Core/InvokeLLM'),
    (route) => {
      const body = route.request().postData() || '';
      calls.push(body);
      const kind = /mushroom/i.test(body)
        ? 'mushroom'
        : /plant biodiversity/i.test(body)
          ? 'flora'
          : /environmental alerts/i.test(body)
            ? 'alerts'
            : 'war';
      const spots = [
        {
          species: 'Cantharellus',
          habitat: 'forest',
          note: 'Chanterelle zone',
          lat: 51.5,
          lng: -0.1,
          region: 'London',
        },
      ];
      if (kind === 'alerts')
        return route.fulfill({
          json: {
            alerts: [
              {
                title: 'Flood watch',
                region: 'Somewhere',
                source: 'Some Agency',
                url: 'javascript:alert(1)',
                severity: 'flash',
              },
            ],
          },
        });
      return route.fulfill({
        json:
          kind === 'war'
            ? {
                zones: [
                  {
                    title: 'Test zone',
                    region: 'Nowhere',
                    advisory: 'x',
                    severity: 'critical',
                    lat: 10,
                    lng: 10,
                    source: 'Some Agency',
                  },
                ],
              }
            : { spots },
      });
    },
  );
  await page.goto('/map');
  await expect(page.getByRole('button', { name: /Mushrooms/i }).first()).toBeVisible({
    timeout: 20_000,
  });
  return calls;
}

const generated = (calls: string[]) => calls.filter((c) => PROMPT_KIND.test(c));

test.describe('Main Map — AI-generated layers', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('opening the map makes no mushroom, flora or conflict model calls', async ({ page }) => {
    const calls = await openMap(page);
    await page.waitForTimeout(2500);
    expect(generated(calls)).toHaveLength(0);
  });

  test('switching a layer on makes exactly one call, and its results are labelled AI-generated', async ({
    page,
  }) => {
    const calls = await openMap(page);
    await page
      .getByRole('button', { name: /Mushrooms/i })
      .first()
      .click();
    await expect.poll(() => generated(calls).length, { timeout: 15_000 }).toBe(1);
    await expect(page.getByText(/AI-generated · unverified/).first()).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForTimeout(1500);
    expect(generated(calls)).toHaveLength(1); // not re-requested by other consumers
    // The other generated layers stay unrequested.
    expect(generated(calls).some((c) => /conflict/i.test(c))).toBe(false);
  });

  test('the environmental summary ticker is opt-in, labelled, and never links to non-http URLs', async ({
    page,
  }) => {
    const calls = await openMap(page);
    const load = page.getByRole('button', { name: /Load AI summary of environmental news/ });
    await expect(load).toContainText('AI-generated · unverified');
    await page.waitForTimeout(1500);
    expect(generated(calls)).toHaveLength(0);
    await load.click();
    await expect.poll(() => generated(calls).length, { timeout: 15_000 }).toBe(1);
    await expect(page.getByText('AI summary', { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/not an official warning/).first()).toBeAttached();
    await expect(page.getByText(/model-named source: Some Agency/).first()).toBeVisible();
    // A model-supplied javascript: URL must not become a link target.
    const link = page.locator('a', { hasText: 'Flood watch' }).first();
    await expect(link).not.toHaveAttribute('href', /javascript:/i);
  });
});
