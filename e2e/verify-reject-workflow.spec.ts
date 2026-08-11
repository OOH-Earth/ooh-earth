import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, ADMIN_USER } from './fixtures/mockBase44';

// Dashboard.jsx's admin verify()/reject path — the "classify" workflow that
// drives TimeSinceTag (stamps status_updated_at) and cascades status to any
// pending LocationPhoto rows (see base44/functions/moderate/entry.ts for the
// equivalent moderate-function path, exercised the same way server-side).
//
// Reaching an authenticated view requires the app's real auth bootstrap:
// AuthContext only calls auth.me() when appParams.token is set, which the
// SDK reads once from ?access_token=<token> on first load (see
// src/lib/app-params.js) and persists to localStorage. Passing it on goto()
// is what makes ProtectedRoute render <Dashboard/> instead of redirecting
// to /login — no application code is touched to achieve this.

function trackConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

async function shot(
  page: import('@playwright/test').Page,
  testInfo: import('@playwright/test').TestInfo,
  name: string
) {
  await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/${name}.png`, fullPage: true });
}

test.describe('Dashboard — verify/reject/classify workflow', () => {
  test('Approve verifies the location, stamps the tag timestamp, and cascades to pending photos', async ({
    page,
  }, testInfo) => {
    const consoleErrors = trackConsoleErrors(page);
    const puts: { url: string; body: any }[] = [];
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/entities/')) {
        puts.push({ url: req.url(), body: req.postDataJSON() });
      }
    });

    await mockBase44(page, {
      user: ADMIN_USER,
      locations: {
        'loc-pending-1': {
          id: 'loc-pending-1',
          title: 'Billboard · Approve Workflow Check',
          type: 'billboard',
          address: '5 Queue St, Testville',
          lat: 13.8,
          lng: 100.6,
          image_url: '',
          status: 'pending',
          status_updated_at: null,
        },
      },
      locationPhotos: [
        { id: 'photo-1', location_id: 'loc-pending-1', url: 'https://example.com/1.jpg', status: 'pending' },
        { id: 'photo-2', location_id: 'loc-pending-1', url: 'https://example.com/2.jpg', status: 'pending' },
      ],
    });

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Approve Workflow Check/i)).toBeVisible({ timeout: 10_000 });
    await shot(page, testInfo, 'dashboard-pending-queue');

    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText(/Approve Workflow Check/i)).toHaveCount(0, { timeout: 10_000 });
    await shot(page, testInfo, 'dashboard-after-approve');

    const locationPut = puts.find((p) => p.url.includes('/entities/Location/loc-pending-1'));
    expect(locationPut?.body?.status).toBe('verified');
    expect(typeof locationPut?.body?.status_updated_at).toBe('string');
    expect(Number.isNaN(Date.parse(locationPut?.body?.status_updated_at))).toBe(false);

    const photoPuts = puts.filter((p) => p.url.includes('/entities/LocationPhoto/'));
    expect(photoPuts.map((p) => p.url).sort()).toEqual(
      [
        expect.stringContaining('/entities/LocationPhoto/photo-1'),
        expect.stringContaining('/entities/LocationPhoto/photo-2'),
      ].sort()
    );
    for (const p of photoPuts) expect(p.body?.status).toBe('verified');

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });

  test('Reject sets the location (and its pending photos) to rejected', async ({ page }, testInfo) => {
    const consoleErrors = trackConsoleErrors(page);
    const puts: { url: string; body: any }[] = [];
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/entities/')) {
        puts.push({ url: req.url(), body: req.postDataJSON() });
      }
    });

    await mockBase44(page, {
      user: ADMIN_USER,
      locations: {
        'loc-pending-2': {
          id: 'loc-pending-2',
          title: 'Billboard · Reject Workflow Check',
          type: 'billboard',
          lat: 13.81,
          lng: 100.61,
          status: 'pending',
          status_updated_at: null,
        },
      },
      locationPhotos: [
        { id: 'photo-3', location_id: 'loc-pending-2', url: 'https://example.com/3.jpg', status: 'pending' },
      ],
    });

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Reject Workflow Check/i)).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByText(/Reject Workflow Check/i)).toHaveCount(0, { timeout: 10_000 });
    await shot(page, testInfo, 'dashboard-after-reject');

    const locationPut = puts.find((p) => p.url.includes('/entities/Location/loc-pending-2'));
    expect(locationPut?.body?.status).toBe('rejected');
    const photoPut = puts.find((p) => p.url.includes('/entities/LocationPhoto/photo-3'));
    expect(photoPut?.body?.status).toBe('rejected');

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });
});
