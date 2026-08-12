import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, ADMIN_USER, type MockDb } from './fixtures/mockBase44';

// Dashboard.jsx's verify/reject "classify" workflow. As of the current
// origin/main, verify() unconditionally routes through the moderate
// function (base44.functions.invoke) for every clearance level — there is
// no more admin-direct-entity-update path. status_updated_at stamping and
// the LocationPhoto cascade both happen server-side in that one function
// (base44/functions/moderate/entry.ts), mirrored here in
// fixtures/mockBase44.ts's own 'action: verify' handler so this test
// exercises the same contract without a live backend.
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
    const moderateCalls: any[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/functions/moderate')) {
        moderateCalls.push(req.postDataJSON());
      }
    });

    const db: MockDb = {
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
    };
    await mockBase44(page, db);

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Approve Workflow Check/i)).toBeVisible({ timeout: 10_000 });
    await shot(page, testInfo, 'dashboard-pending-queue');

    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(page.getByText(/Approve Workflow Check/i)).toHaveCount(0, { timeout: 10_000 });
    await shot(page, testInfo, 'dashboard-after-approve');

    // The client only ever sends {action, entity, id, status} — the server
    // (mocked here identically to the real function) computes
    // status_updated_at and cascades the photos. Assert both halves.
    const verifyCall = moderateCalls.find((c) => c.action === 'verify');
    expect(verifyCall).toMatchObject({ entity: 'Location', id: 'loc-pending-1', status: 'verified' });

    expect(db.locations!['loc-pending-1'].status).toBe('verified');
    expect(typeof db.locations!['loc-pending-1'].status_updated_at).toBe('string');
    expect(Number.isNaN(Date.parse(db.locations!['loc-pending-1'].status_updated_at))).toBe(false);
    for (const p of db.locationPhotos!) expect(p.status).toBe('verified');

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });

  test('Reject sets the location (and its pending photos) to rejected', async ({ page }, testInfo) => {
    const consoleErrors = trackConsoleErrors(page);

    const db: MockDb = {
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
    };
    await mockBase44(page, db);

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Reject Workflow Check/i)).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Reject', exact: true }).click();
    await expect(page.getByText(/Reject Workflow Check/i)).toHaveCount(0, { timeout: 10_000 });
    await shot(page, testInfo, 'dashboard-after-reject');

    expect(db.locations!['loc-pending-2'].status).toBe('rejected');
    expect(db.locationPhotos![0].status).toBe('rejected');

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });
});
