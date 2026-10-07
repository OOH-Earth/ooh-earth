import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, ADMIN_USER, type MockDb } from './fixtures/mockBase44';

// Public Space / Street Sports Intelligence v1 — moderation queue coverage.
// Mission test 5: a relationship only reaches 'verified' through this exact
// moderator action, never by a submitter self-setting status (see
// LocationRelationship.jsonc's status RLS + base44/functions/moderate's
// ENTITIES allowlist). Mission test 11/12-adjacent: existing Location/
// FieldCheck moderation is unaffected by the new entity being added
// alongside them.

test.describe('Dashboard — LocationRelationship moderation', () => {
  test('a pending relationship claim appears in the queue, tagged, and Approve verifies + stamps verified_date', async ({
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
        'sk-1': {
          id: 'sk-1',
          title: 'Riverside Skatepark',
          type: 'skatepark',
          lat: 13.74,
          lng: 100.56,
          status: 'verified',
        },
      },
      locationRelationships: {
        'rel-1': {
          id: 'rel-1',
          location_id: 'sk-1',
          location_title: 'Riverside Skatepark',
          brand_name: 'Community Trust Fund',
          relationship_type: 'community_partner',
          evidence_source: 'Plaque at entrance',
          status: 'pending',
          created_date: new Date().toISOString(),
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Riverside Skatepark/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('claim', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(page.getByText('claim', { exact: true })).toHaveCount(0, {
      timeout: 10_000,
    });

    const verifyCall = moderateCalls.find((c) => c.action === 'verify');
    expect(verifyCall).toMatchObject({
      entity: 'LocationRelationship',
      id: 'rel-1',
      status: 'verified',
    });
    expect(db.locationRelationships!['rel-1'].status).toBe('verified');
    expect(typeof db.locationRelationships!['rel-1'].verified_date).toBe('string');
  });

  test('a queue with zero pending relationship claims behaves exactly as before (Location/FieldCheck moderation unaffected)', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const db: MockDb = {
      user: ADMIN_USER,
      locations: {
        'loc-1': {
          id: 'loc-1',
          title: 'Billboard · Regression Check',
          type: 'billboard',
          lat: 13.7,
          lng: 100.5,
          status: 'pending',
        },
      },
    };
    await mockBase44(page, db);

    await page.goto('/dashboard?access_token=mock-admin-token');
    await expect(page.getByText(/Regression Check/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('claim', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(page.getByText(/Regression Check/i)).toHaveCount(0, { timeout: 10_000 });
    expect(db.locations!['loc-1'].status).toBe('verified');

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });
});
