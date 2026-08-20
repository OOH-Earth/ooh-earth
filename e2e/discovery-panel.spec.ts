import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import { mockBase44, ADMIN_USER } from './fixtures/mockBase44';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG1 = path.join(__dirname, 'fixtures', 'test-image.png');

// The Discovery Intelligence panel (DiscoveryPanel.jsx) extends FieldReport's
// existing success card once a synced, authenticated, brand-identified
// report's gamification state has refreshed. Every field is derived from
// real useGamification()/pointsForReport()/BADGES state -- these tests prove
// the numbers are genuinely correct (not just present) and that the panel
// gracefully disappears for anonymous, offline, and blank-brand submissions.

async function fillAndSubmit(
  page: Page,
  { brand, withPhoto = false }: { brand?: string; withPhoto?: boolean } = {},
) {
  await page.goto('/report');
  await expect(page.getByRole('heading', { name: /Adbusting/i })).toBeVisible();

  if (withPhoto) {
    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles(IMG1);
    await expect(page.getByText(/Replace/i)).toBeVisible();
  }

  await page.getByPlaceholder('Street, district, city').fill('900 Test Ave, Testville');
  await page.getByText('Enter coordinates manually').click();
  await page.getByPlaceholder('Latitude').fill('13.75');
  await page.getByPlaceholder('Longitude').fill('100.50');

  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.click(); // Document -> Identify

  if (brand) {
    await page.getByPlaceholder("e.g. Shell, McDonald's, Toyota").fill(brand);
  }

  await submitBtn.click(); // Identify -> Classify
  await submitBtn.click(); // Classify -> Respond
  await expect(submitBtn).toHaveText(/Transmit report/i);
  await submitBtn.click(); // submit
}

function panelFor(page: Page) {
  return page
    .getByText('Discovery Intelligence')
    .locator('xpath=ancestor::*[contains(@class,"grid-bg")]');
}

function seededNike(count: number, startAt = 1) {
  const locations: Record<string, unknown> = {};
  for (let i = startAt; i < startAt + count; i++) {
    locations[`loc-${i}`] = { id: `loc-${i}`, created_by_id: ADMIN_USER.id, brand_name: 'Nike' };
  }
  return locations;
}

test.describe('FieldReport — Discovery Intelligence panel', () => {
  test('authenticated + real brand: shows real brand, XP (pointsForReport, no photo), and correct Nth-discovery/milestone progress', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: seededNike(3) });
    await fillAndSubmit(page, { brand: 'Nike' });
    await expect(page.getByText(/Transmission received/i)).toBeVisible({ timeout: 10_000 });

    const panel = panelFor(page);
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel.getByText('Nike', { exact: true })).toBeVisible();
    // No photo attached and status is 'pending' -> pointsForReport gives
    // exactly the 10-point base, no verified/photo bonus. Proves the real
    // formula is reused, not a duplicate/invented one.
    await expect(panel.getByText('+10')).toBeVisible();
    // 3 seeded + this submission = the 4th Nike discovery.
    await expect(panel.getByText(/Your 4th Nike discovery/i)).toBeVisible();
    await expect(panel.getByText('4 / 5')).toBeVisible();
    await expect(panel.getByText(/1 more to Brand Collector/i)).toBeVisible();
    // No AI confidence was ever produced by a scan in this test -- must be
    // omitted entirely, never a fabricated percentage.
    await expect(panel.getByText(/% confidence/i)).toHaveCount(0);
  });

  test('XP bonus reflects a real photo (pointsForReport +50), not a hardcoded number', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    await fillAndSubmit(page, { brand: 'Shell', withPhoto: true });
    await expect(page.getByText(/Transmission received/i)).toBeVisible({ timeout: 10_000 });

    const panel = panelFor(page);
    await expect(panel).toBeVisible({ timeout: 10_000 });
    // 10 base + 50 photo bonus (not verified, so no +40) = 60.
    await expect(panel.getByText('+60')).toBeVisible();
  });

  test('crossing a real threshold shows the genuinely-unlocked milestone, not a fabricated one', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: seededNike(4) });
    await fillAndSubmit(page, { brand: 'Nike' });
    await expect(page.getByText(/Transmission received/i)).toBeVisible({ timeout: 10_000 });

    const panel = panelFor(page);
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel.getByText(/Milestone unlocked/i)).toBeVisible();
    await expect(panel.getByText('Brand Collector', { exact: true })).toBeVisible();
    // The progress readout is replaced by the unlocked state, not shown
    // alongside it.
    await expect(panel.getByText('5 / 5')).toHaveCount(0);
  });

  test('anonymous submission: no personal collection/XP data is shown', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await fillAndSubmit(page, { brand: 'Nike' });
    await expect(page.getByText(/Transmission received/i)).toBeVisible({ timeout: 10_000 });

    // The existing, pre-existing "Ad chain logged" line is brand-only and
    // still fine to show -- only the personal collector panel is withheld.
    await expect(page.getByText(/Ad chain logged/i)).toBeVisible();
    await expect(page.getByText('Discovery Intelligence')).toHaveCount(0);
  });

  test('offline/queued submission: no fabricated XP or collection progress', async ({ page }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    await page.goto('/report');
    await expect(page.getByRole('heading', { name: /Adbusting/i })).toBeVisible();
    await page.getByPlaceholder('Street, district, city').fill('900 Test Ave, Testville');
    await page.getByText('Enter coordinates manually').click();
    await page.getByPlaceholder('Latitude').fill('13.75');
    await page.getByPlaceholder('Longitude').fill('100.50');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.getByPlaceholder("e.g. Shell, McDonald's, Toyota").fill('Nike');
    await submitBtn.click();
    await submitBtn.click();

    await page.context().setOffline(true);
    try {
      await submitBtn.click();
      await expect(page.getByText(/Queued offline/i)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText('Discovery Intelligence')).toHaveCount(0);
    } finally {
      await page.context().setOffline(false);
    }
  });

  test('blank brand: no brand-specific panel or ad-chain block renders', async ({ page }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    await fillAndSubmit(page, {}); // brand left blank
    await expect(page.getByText(/Transmission received/i)).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText(/Ad chain logged/i)).toHaveCount(0);
    await expect(page.getByText('Discovery Intelligence')).toHaveCount(0);
  });
});
