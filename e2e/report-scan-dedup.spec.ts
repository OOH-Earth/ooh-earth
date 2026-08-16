import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Step 1's AI Ad Scanner (ReportScanner.jsx, backed by the real scanAd
// function) already identifies brand/campaign/sector/agency/operator from
// the photo. Step 2 (ReportStep2Identify.jsx) used to unconditionally offer
// its own "Identify" scan as the primary action -- a second, weaker LLM
// call re-analyzing the same image, risking overwriting Step 1's better
// result. Now Step 2 checks the shared `ai_scanned` flag Step 1 sets on a
// successful scan and, if already scanned, shows a confirmation state with
// a de-emphasized "Re-scan" instead of presenting a full duplicate scan as
// the primary action.

test.describe('FieldReport — Step 2 does not duplicate Step 1s AI scan', () => {
  test('shows "already identified" once Step 1s scanner succeeds, instead of a fresh primary CTA', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });

    // scanAd isn't modeled by the generic entity mock -- fulfil it directly
    // with a successful detection, matching ReportScanner's own unwrap
    // contract (resp.data?.detection?.response).
    await page.route('**/functions/scanAd', (route) =>
      route.fulfill({
        json: {
          detection: {
            response: {
              is_advertising: true,
              surface_type: 'billboard',
              brand_name: 'TestCo',
              ad_agency: 'Test Agency',
              parent_corp: 'Test Holdings',
              campaign_name: 'Test Campaign',
              ooh_operator: 'Test Media',
              industry_sector: 'finance',
              harm_tags: [],
              confidence: 0.92,
              description: 'A billboard advertising TestCo.',
            },
          },
        },
      }),
    );

    await page.goto('/report');

    // Step 1: upload a photo (drives ReportScanner's visibility) and run it.
    const file = path.join(__dirname, 'fixtures', 'test-image.png');
    await page.getByLabel('Upload').setInputFiles(file);
    await expect(page.getByText('AI Ad Scanner')).toBeVisible();
    await page.getByRole('button', { name: 'Run scan' }).click();
    await expect(page.getByText('Scan complete')).toBeVisible({ timeout: 10_000 });

    // Move to Step 2 via the step indicator (free navigation, not gated).
    await page.getByRole('button', { name: '02 Identify' }).click();

    await expect(page.getByText(/Already identified by the Step 1 AI Scanner/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Re-scan' })).toBeVisible();
    // The pre-filled field from Step 1's (real) scan, not Step 2's own.
    await expect(page.getByPlaceholder("e.g. Shell, McDonald's, Toyota")).toHaveValue('TestCo');
  });
});
