import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ReportScanner.jsx cross-checks scanAd's parent_corp against the same
// authoritative advertiserRegistry.js lookup AdvertiserInfo.jsx already uses
// at display time -- but here it runs at capture time, before the report is
// ever submitted. A recognized parent corp with no model-provided sector
// gets the registry's sector as a gap-fill; a recognized parent corp whose
// model-provided sector disagrees with the registry gets flagged for the
// operative to resolve, never silently overwritten.

async function uploadAndScan(page, detection) {
  await page.route('**/functions/scanAd', (route) =>
    route.fulfill({ json: { detection: { response: detection } } }),
  );
  await page.goto('/report');
  const file = path.join(__dirname, 'fixtures', 'test-image.png');
  await page
    .getByRole('button', { name: 'Upload' })
    .locator('input[type="file"]')
    .setInputFiles(file);
  await expect(page.getByText('AI Ad Scanner')).toBeVisible();
  await page.getByRole('button', { name: 'Run scan' }).click();
  await expect(page.getByText('Scan complete', { exact: false })).toBeVisible({
    timeout: 10_000,
  });
}

test.describe('ReportScanner — capture-time registry verification', () => {
  test('a recognized parent corp with no model sector gets the registry sector as a gap-fill', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    await uploadAndScan(page, {
      is_advertising: true,
      surface_type: 'billboard',
      brand_name: 'Shell',
      parent_corp: 'Shell plc',
      industry_sector: '',
      harm_tags: [],
      confidence: 0.91,
      description: 'A Shell billboard.',
    });

    await expect(page.getByText(/Sector inferred from registry: Fossil Fuel/i)).toBeVisible();

    await page.getByRole('button', { name: '02 Identify' }).click();
    await expect(page.getByRole('button', { name: 'Fossil fuel' })).toHaveClass(/bg-ozone/);
  });

  test('a recognized parent corp whose model sector agrees is shown as confirmed, not just inferred', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    await uploadAndScan(page, {
      is_advertising: true,
      surface_type: 'billboard',
      brand_name: 'Shell',
      parent_corp: 'Shell plc',
      industry_sector: 'fossil_fuel',
      harm_tags: [],
      confidence: 0.91,
      description: 'A Shell billboard.',
    });

    await expect(page.getByText(/Sector confirmed from registry: Fossil Fuel/i)).toBeVisible();
  });

  test('a model sector that conflicts with the registry is flagged, not silently overwritten', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    await uploadAndScan(page, {
      is_advertising: true,
      surface_type: 'billboard',
      brand_name: 'Shell',
      parent_corp: 'Shell plc',
      industry_sector: 'finance',
      harm_tags: [],
      confidence: 0.91,
      description: 'A Shell billboard.',
    });

    await expect(
      page.getByText(/Scan said Finance, but our registry lists Shell plc as Fossil Fuel/i),
    ).toBeVisible();

    // The model's own value wins in the form -- the registry flags the
    // disagreement for a human to resolve, it does not resolve it for them.
    await page.getByRole('button', { name: '02 Identify' }).click();
    await expect(page.getByRole('button', { name: 'Finance' })).toHaveClass(/bg-ozone/);
    await expect(page.getByRole('button', { name: 'Fossil fuel' })).not.toHaveClass(/bg-ozone/);
  });

  test('an unrecognized parent corp gets no registry notice at all', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await uploadAndScan(page, {
      is_advertising: true,
      surface_type: 'billboard',
      brand_name: 'TestCo',
      parent_corp: 'Some Unrecognized Holdings',
      industry_sector: '',
      harm_tags: [],
      confidence: 0.91,
      description: 'A TestCo billboard.',
    });

    await expect(page.getByText(/from registry/i)).not.toBeVisible();
  });
});
