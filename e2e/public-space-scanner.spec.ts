import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Public Space / Street Sports Intelligence v1 — scanAd facility detection.
// Mission test 6: AI suggestions (facility type, possible relationship)
// enter editable review state, never get auto-applied as fact. Mission
// test 12: the existing Ad Scanner ad-surface path is unaffected.

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

test('a facility detection with no brand seen pre-fills the type field and shows a generic evidence prompt', async ({
  page,
}) => {
  await mockBase44(page, { user: null, locations: {} });
  await uploadAndScan(page, {
    is_advertising: true,
    surface_type: 'skatepark',
    facility_setting: 'outdoor',
    facility_public_access: 'unknown',
    brand_name: '',
    possible_relationship_type: 'unknown',
    industry_sector: '',
    harm_tags: [],
    confidence: 0.8,
    description: 'A skatepark, no branding visible.',
  });

  await expect(
    page.getByText('Public-space facility detected — a visible logo alone never proves a'),
  ).toBeVisible();
  await expect(
    page.getByText('Add any visible-branding evidence as an editable, unverified relationship'),
  ).toBeVisible();

  // The suggestion landed in the editable Step 1 type picker -- not
  // auto-submitted anywhere.
  await expect(page.getByRole('button', { name: 'Skatepark' })).toHaveClass(/bg-ozone/);
});

test('a facility detection with a brand but no signage evidence stays advisory, not a claim', async ({
  page,
}) => {
  await mockBase44(page, { user: null, locations: {} });
  await uploadAndScan(page, {
    is_advertising: true,
    surface_type: 'skatepark',
    facility_setting: 'outdoor',
    facility_public_access: 'unknown',
    brand_name: 'Redline Energy',
    possible_relationship_type: 'unknown',
    industry_sector: '',
    harm_tags: [],
    confidence: 0.8,
    description: 'A skatepark with a logo visible on the ramp.',
  });

  await expect(
    page.getByText(
      'Suggested relationship: Unknown — still UNKNOWN until reviewed with evidence.',
      { exact: false },
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skatepark' })).toHaveClass(/bg-ozone/);
});

test('a facility detection with a literal signage-based relationship hint still reads as a suggestion to review, not a fact', async ({
  page,
}) => {
  await mockBase44(page, { user: null, locations: {} });
  await uploadAndScan(page, {
    is_advertising: true,
    surface_type: 'basketball_court',
    facility_setting: 'outdoor',
    facility_public_access: 'free',
    brand_name: 'Community Trust Fund',
    possible_relationship_type: 'community_partner',
    industry_sector: '',
    harm_tags: [],
    confidence: 0.85,
    description: 'A basketball court with a "Rebuilt by Community Trust Fund" sign.',
  });

  await expect(
    page.getByText(
      'Suggested relationship: Community Partner — still UNKNOWN until reviewed with evidence.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Basketball Court' })).toHaveClass(/bg-ozone/);
});

// Mission test 12: the pre-existing ad-surface scan path (no facility
// involved) still behaves exactly as before -- no facility copy shown.
test('a plain billboard detection shows no public-space advisory copy', async ({ page }) => {
  await mockBase44(page, { user: null, locations: {} });
  await uploadAndScan(page, {
    is_advertising: true,
    surface_type: 'billboard',
    brand_name: 'Shell',
    industry_sector: 'fossil_fuel',
    harm_tags: [],
    confidence: 0.9,
    description: 'A Shell billboard.',
  });
  await expect(page.getByText('Public-space facility detected', { exact: false })).toHaveCount(0);
});
