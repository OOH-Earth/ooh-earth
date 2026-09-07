import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

test.describe('Protocol One scanner evidence boundary', () => {
  test('valid manual EAN renders field-level provenance and unknown cost state', async ({
    page,
  }) => {
    await mockBase44(page, {
      user: null,
      productLookup: {
        status: 'available',
        retrieved_at: '2026-09-06T00:00:00.000Z',
        product: {
          gtin: '3017620422003',
          fields: {
            product_name: {
              label: 'Product name',
              value: 'Example spread',
              evidence_class: 'DATASET_REPORTED',
              source: 'Open Food Facts',
              attribution: 'Open Food Facts contributors',
            },
            brand: {
              label: 'Brand',
              value: 'Example brand',
              evidence_class: 'DATASET_REPORTED',
              source: 'Open Food Facts',
              attribution: 'Open Food Facts contributors',
            },
            origins: { label: 'Declared origin', value: null, evidence_class: 'UNKNOWN' },
            manufacturing_places: {
              label: 'Manufacturing places',
              value: null,
              evidence_class: 'UNKNOWN',
            },
          },
        },
      },
    });
    await page.goto('/scan');
    await page.getByRole('button', { name: 'Manual' }).click();
    await page.getByPlaceholder('Enter UPC / EAN digits').fill('3017620422003');
    await page.getByRole('button', { name: 'Decode' }).click();

    await expect(page.getByRole('heading', { name: 'Example spread' })).toBeVisible();
    await expect(page.getByText('DATASET_REPORTED').first()).toBeVisible();
    await expect(page.getByText('Unknown').first()).toBeVisible();
    await expect(
      page.getByText('No defensible total cost is available from this scan.'),
    ).toBeVisible();
  });

  test('invalid checksum never invokes product lookup', async ({ page }) => {
    let lookupCalls = 0;
    page.on('request', (request) => {
      if (request.url().includes('/functions/productLookup')) lookupCalls += 1;
    });
    await mockBase44(page, { user: null });
    await page.goto('/scan');
    await page.getByRole('button', { name: 'Manual' }).click();
    await page.getByPlaceholder('Enter UPC / EAN digits').fill('3017620422002');
    await page.getByRole('button', { name: 'Decode' }).click();

    await expect(
      page.getByText('The barcode checksum is invalid. Check the digits and try again.'),
    ).toBeVisible();
    expect(lookupCalls).toBe(0);
  });
});
