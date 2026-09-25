import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, ADMIN_USER, type MockDb } from './fixtures/mockBase44';

// FieldCheck (re-checks logged via FieldCheckCamera on /location/:id) used to
// have no verification path at all -- base44/functions/moderate/entry.ts's
// ENTITIES allowlist only covered Location and DigitalBust, so a submitted
// FieldCheck stayed 'pending' forever and could never become 'verified'.
// That silently broke FieldCheckPanel's Before/After comparison, which only
// ever looks at verified checks. This exercises the fix: FieldCheck now
// flows through the exact same generic queue/verify path already proven for
// Location and DigitalBust (Dashboard.jsx's Row/verify() are entity-agnostic
// already -- only the fetch + a normalizer + the backend allowlist changed).

test.describe('Dashboard — FieldCheck moderation', () => {
  test('a pending re-check appears in the queue, tagged "re-check", and Approve verifies it', async ({
    page,
  }) => {
    const moderateCalls: any[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/functions/moderate')) {
        moderateCalls.push(req.postDataJSON());
      }
    });

    const db: MockDb = {
      user: ADMIN_USER,
      locations: {
        'loc-1': {
          id: 'loc-1',
          title: 'Billboard · Sukhumvit Soi 3',
          type: 'billboard',
          lat: 13.74,
          lng: 100.56,
          status: 'verified',
          brand_name: 'Nike',
          condition: 'functional',
        },
      },
      fieldChecks: {
        'check-1': {
          id: 'check-1',
          location_id: 'loc-1',
          location_title: 'Billboard · Sukhumvit Soi 3',
          location_type: 'billboard',
          lat: 13.74,
          lng: 100.56,
          brand_name: 'Adidas',
          condition: 'functional',
          adbust_type: 'none',
          status: 'pending',
          created_date: new Date().toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Billboard · Sukhumvit Soi 3/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('re-check', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(page.getByText(/Billboard · Sukhumvit Soi 3/i)).toHaveCount(0, {
      timeout: 10_000,
    });

    const verifyCall = moderateCalls.find((c) => c.action === 'verify');
    expect(verifyCall).toMatchObject({ entity: 'FieldCheck', id: 'check-1', status: 'verified' });
    expect(db.fieldChecks!['check-1'].status).toBe('verified');
    expect(typeof db.fieldChecks!['check-1'].status_updated_at).toBe('string');
  });

  test('a queue with zero pending FieldChecks behaves exactly as before (no regression)', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await mockBase44(page, {
      user: ADMIN_USER,
      locations: {
        'loc-2': {
          id: 'loc-2',
          title: 'Painted Wall · Regression Check',
          type: 'painted',
          lat: 13.7,
          lng: 100.5,
          status: 'pending',
        },
      },
    });

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Regression Check/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('re-check', { exact: true })).toHaveCount(0);

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });
});
