import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMBER = { id: 'scout-391', email: 'scout391@oohearth.test', role: 'user', access: 'member' };
const BRAND = "e.g. Shell, McDonald's, Toyota";

// Mock-only coverage for the #391 + #397 combined candidate. Every scanAd response is fulfilled by
// the test; nothing reaches a real function, provider or Location write.
// Registered first: Playwright runs later routes first, so each test's scanAd route overrides the
// fixture's default.
async function prepare(page: Page, user: Record<string, unknown> | null) {
  await mockBase44(page, { user, locations: {} });
  // Mock-only placeholder so AuthContext treats the mocked user as signed in; not a credential.
  if (user) await page.addInitScript(() => localStorage.setItem('base44_access_token', 'e2e-mock'));
}

async function openStep2(page: Page) {
  await page.goto('/report');
  await page
    .getByRole('button', { name: 'Upload' })
    .locator('input[type="file"]')
    .setInputFiles(path.join(__dirname, 'fixtures', 'test-image.png'));
  await page.getByRole('button', { name: '02 Identify' }).click();
}

test.describe('FieldReport step 2 — scanAd states (mocked)', () => {
  test('signed-out: guidance shown, nothing sent, manual report preserved', async ({ page }) => {
    await prepare(page, null);
    let calls = 0;
    await page.route('**/functions/scanAd', (r) => {
      calls += 1;
      return r.fulfill({ status: 401, json: {} });
    });
    await openStep2(page);
    await page.getByRole('button', { name: 'Identify', exact: true }).click();
    await expect(page.getByText('AI scan is for signed-in members.')).toBeVisible();
    await page.getByPlaceholder(BRAND).fill('Typed Brand');
    await expect(page.getByPlaceholder(BRAND)).toHaveValue('Typed Brand');
    expect(calls).toBe(0);
  });

  test('signed-in success applies detection', async ({ page }) => {
    await prepare(page, MEMBER);
    let calls = 0;
    await page.route('**/functions/scanAd', (r) => {
      calls += 1;
      return r.fulfill({
        json: {
          detection: { is_advertising: true, brand_name: 'Shell', parent_corp: 'Shell plc' },
        },
      });
    });
    await openStep2(page);
    await page.getByRole('button', { name: 'Identify', exact: true }).click();
    await expect(page.getByText('Detection applied')).toBeVisible();
    await expect(page.getByPlaceholder(BRAND)).toHaveValue('Shell');
    expect(calls).toBe(1);
  });

  test('signed-in failure (500) shows manual fallback, no retry, form intact', async ({ page }) => {
    await prepare(page, MEMBER);
    let calls = 0;
    await page.route('**/functions/scanAd', (r) => {
      calls += 1;
      return r.fulfill({ status: 502, json: { error: 'Scan unavailable' } });
    });
    await openStep2(page);
    await page.getByRole('button', { name: 'Identify', exact: true }).click();
    await expect(page.getByText('Detection failed')).toBeVisible();
    await page.getByPlaceholder(BRAND).fill('Manual After Failure');
    await expect(page.getByPlaceholder(BRAND)).toHaveValue('Manual After Failure');
    await page.waitForTimeout(500);
    expect(calls).toBe(1);
  });

  test('signed-in 504 response (mocked; the 45s handler timer is covered by the offline Deno tests) degrades to manual, one request', async ({
    page,
  }) => {
    await prepare(page, MEMBER);
    let calls = 0;
    await page.route('**/functions/scanAd', async (r) => {
      calls += 1;
      await new Promise((res) => setTimeout(res, 1200));
      return r.fulfill({ status: 504, json: { error: 'Scan timed out' } });
    });
    await openStep2(page);
    await page.getByRole('button', { name: 'Identify', exact: true }).click();
    await expect(page.getByText('Scanning…')).toBeVisible();
    await expect(page.getByText('Detection failed')).toBeVisible({ timeout: 10_000 });
    expect(calls).toBe(1);
  });

  test('five same-tick activations produce exactly one request', async ({ page }) => {
    await prepare(page, MEMBER);
    let calls = 0;
    await page.route('**/functions/scanAd', async (r) => {
      calls += 1;
      await new Promise((res) => setTimeout(res, 800));
      return r.fulfill({ json: { detection: { is_advertising: true, brand_name: 'Shell' } } });
    });
    await openStep2(page);
    const btn = page.getByRole('button', { name: 'Identify', exact: true });
    await btn.evaluate((el) => {
      for (let i = 0; i < 5; i += 1) (el as HTMLButtonElement).click();
    });
    await expect(page.getByText('Detection applied')).toBeVisible();
    expect(calls).toBe(1);
  });

  test('edits made while the scan is in flight are preserved', async ({ page }) => {
    await prepare(page, MEMBER);
    let release: () => void = () => {};
    const gate = new Promise<void>((res) => {
      release = res;
    });
    await page.route('**/functions/scanAd', async (r) => {
      await gate;
      return r.fulfill({
        json: { detection: { is_advertising: true, brand_name: 'AiBrand', parent_corp: 'AiCorp' } },
      });
    });
    await openStep2(page);
    await page.getByRole('button', { name: 'Identify', exact: true }).click();
    await expect(page.getByText('Scanning…')).toBeVisible();
    await page.getByPlaceholder(BRAND).fill('My Own Brand');
    release();
    await expect(page.getByText('Detection applied')).toBeVisible();
    await expect(page.getByPlaceholder(BRAND)).toHaveValue('My Own Brand');
    await expect(page.getByPlaceholder('e.g. Shell plc, Yum! Brands, WPP')).toHaveValue('AiCorp');
  });
});

test.describe('UnitFinder withdrawn path (mocked)', () => {
  test('unavailable with working Report link; zero model, geocode, scan or Location-write calls', async ({
    page,
  }) => {
    const bad: string[] = [];
    page.on('request', (req) => {
      const u = req.url();
      if (
        /InvokeLLM|functions\/scanAd|nominatim|geocod|photon\.komoot|maptiler.*geocoding/i.test(u)
      ) {
        bad.push(`${req.method()} ${u}`);
      }
      if (req.method() === 'POST' && /\/entities\/Location(\?|$)/.test(u))
        bad.push(`${req.method()} ${u}`);
    });
    await mockBase44(page, { user: MEMBER, locations: {} });
    await page.goto('/map');
    await page.getByRole('button', { name: 'Find units' }).click();
    const dialog = page.getByRole('dialog', { name: 'AI Unit Finder' });
    await expect(dialog.getByTestId('unit-finder-unavailable')).toContainText('Unavailable');
    const link = dialog.getByRole('link', { name: 'Open the report form' });
    await expect(link).toHaveAttribute('href', '/report');
    await link.click();
    await expect(page).toHaveURL(/\/report$/);
    expect(bad).toEqual([]);
  });
});
