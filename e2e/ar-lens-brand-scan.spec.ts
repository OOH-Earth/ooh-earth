import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// ArLens (/ar) already had a real camera -> GPS -> capture -> Location.create()
// pipeline, but never ran the captured photo through the same AI ad-scanner
// (scanAd) the ordinary /report wizard already uses -- an AR capture was a
// second-class report with no brand/agency/operator identification, purely
// because it was filed through the camera lens instead of the form. Now it
// runs the same scan the wizard's ReportScanner.jsx does, best-effort (a
// failed/empty scan still resolves to a filed report, not an error).

test.use({
  permissions: ['camera'],
  launchOptions: {
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
});

test.describe('ArLens — AR capture is identified by the same AI scanner as /report', () => {
  test('filing a capture runs scanAd and shows the detected brand', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 13.7563, longitude: 100.5018 });

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    let updatedLocation: Record<string, unknown> | null = null;
    await mockBase44(page, { user: null, locations: {} });
    await page.route('**/functions/scanAd', (route) =>
      route.fulfill({
        json: {
          detection: {
            response: {
              is_advertising: true,
              surface_type: 'billboard',
              brand_name: 'Shell',
              ad_agency: 'Ogilvy',
              parent_corp: 'Shell plc',
              ooh_operator: 'JCDecaux',
              industry_sector: 'fossil_fuel',
              harm_tags: ['greenwashing'],
              confidence: 0.9,
            },
          },
        },
      }),
    );
    // Observe the PUT to confirm the AR-filed Location record itself gets
    // the detected fields, not just the on-screen label -- fallback() (not
    // continue()) so the request still reaches mockBase44's own handler
    // instead of going to the real network.
    await page.route('**/entities/Location/*', async (route) => {
      if (route.request().method() === 'PUT') {
        updatedLocation = route.request().postDataJSON();
      }
      await route.fallback();
    });

    await page.goto('/ar');
    await page.getByRole('button', { name: /activate camera/i }).click();
    await expect(page.getByRole('button', { name: /lock on/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /lock on/i }).click();

    await page.getByRole('button', { name: /capture & file report/i }).click();
    await expect(page.getByText(/report filed/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/identified: shell/i)).toBeVisible();

    expect(updatedLocation).not.toBeNull();
    expect((updatedLocation as unknown as { brand_name: string })?.brand_name).toBe('Shell');
    expect((updatedLocation as unknown as { ad_agency: string })?.ad_agency).toBe('Ogilvy');

    expect(filterCrashes(errors), errors.join('\n')).toEqual([]);
  });
});

// A filed AR report used to be a dead end -- "Re-target" was the only
// option, with no way back to the location detail page or the map. The
// ordinary /report wizard's done-state already offers "View your report"
// and "View on map" (FieldReport.jsx); AR should feel like the same
// journey, not a separate disconnected product.
test.describe('ArLens — a filed report links back into the rest of the product', () => {
  test('done state offers "View report" and "View on map", not just re-target', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 13.7563, longitude: 100.5018 });
    await mockBase44(page, { user: null, locations: {} });
    await page.route('**/functions/scanAd', (route) =>
      route.fulfill({
        json: { detection: { response: { is_advertising: false } } },
      }),
    );

    await page.goto('/ar');
    await page.getByRole('button', { name: /activate camera/i }).click();
    await expect(page.getByRole('button', { name: /lock on/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /lock on/i }).click();
    await page.getByRole('button', { name: /capture & file report/i }).click();
    await expect(page.getByText(/report filed/i)).toBeVisible({ timeout: 15_000 });

    const viewReport = page.getByRole('link', { name: /view report/i });
    await expect(viewReport).toBeVisible();
    await expect(viewReport).toHaveAttribute('href', /^\/location\//);
    await expect(page.getByRole('link', { name: /view on map/i })).toHaveAttribute('href', '/map');
  });
});

// The CO2 overlay's number was always a fixed, generic per-billboard-average
// constant, never a measurement of the specific billboard in frame -- but
// the copy ("THIS AD COSTS THE PLANET") read as if it were describing that
// exact ad. Now it's honestly framed as an average.
test.describe('ArLens — CO2 overlay is honestly framed as an average, not a measurement', () => {
  test('takeover and intel overlays say "average", not "this ad"', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/ar');
    await page.getByRole('button', { name: /activate camera/i }).click();
    await expect(page.getByRole('button', { name: /lock on/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /lock on/i }).click();

    await expect(page.getByText(/costs the planet/i)).toBeVisible();
    await expect(page.getByText(/^this ad$/i)).not.toBeVisible();
    await expect(page.getByText(/avg\./i).first()).toBeVisible();
  });
});
