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
            origins: {
              label: 'Declared origin',
              value: 'Italy',
              evidence_class: 'DATASET_REPORTED',
              source: 'Open Food Facts',
              attribution: 'Open Food Facts contributors',
              coordinates: { lat: 41.9, lng: 12.5 },
            },
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
    await page.getByLabel('OOH context latitude').fill('43.8');
    await page.getByLabel('OOH context longitude').fill('11.2');
    await page.getByRole('button', { name: 'Apply point' }).click();
    await expect(page.getByText('Derived geodesic distance')).toBeVisible();
    await expect(
      page.getByText('Not shipping distance, transport route, or freight distance.'),
    ).toBeVisible();
    await expect(page.getByText('Insufficient evidence')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });

  test('invalid context coordinates keep logistics unknown', async ({ page }) => {
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
    await expect(page.getByText('No evidenced coordinate pair is available.')).toBeVisible();
    await page.getByLabel('OOH context latitude').fill('91');
    await page.getByLabel('OOH context longitude').fill('12');
    await page.getByRole('button', { name: 'Apply point' }).click();
    await expect(page.getByText('Enter a valid latitude')).toBeVisible();
    await expect(page.getByText('No evidenced coordinate pair is available.')).toBeVisible();
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
