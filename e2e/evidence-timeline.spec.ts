import { test, expect } from '@playwright/test';
import { mockBase44, type MockDb } from './fixtures/mockBase44';

test('Location detail shows bounded evidence memory without exposing unmoderated photos', async ({
  page,
}) => {
  const old = '2020-01-01T00:00:00.000Z';
  const recent = new Date(Date.now() - 60_000).toISOString();
  const db: MockDb = {
    user: null,
    locations: {
      'memory-1': {
        id: 'memory-1',
        title: 'Memory test location',
        type: 'billboard',
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
        created_date: old,
        status_updated_at: recent,
        image_url: 'https://example.com/cover.jpg',
      },
    },
    fieldChecks: {
      old: {
        id: 'old',
        location_id: 'memory-1',
        status: 'verified',
        created_date: old,
        brand_name: 'Old Brand',
      },
      pending: { id: 'pending', location_id: 'memory-1', status: 'pending', created_date: recent },
    },
    locationPhotos: [
      {
        id: 'private',
        location_id: 'memory-1',
        status: 'pending',
        created_date: recent,
        url: 'https://example.com/private.jpg',
      },
      {
        id: 'public',
        location_id: 'memory-1',
        status: 'verified',
        created_date: old,
        url: 'https://example.com/public.jpg',
      },
    ],
  };
  await mockBase44(page, db);
  await page.goto('/location/memory-1');
  const timeline = page.getByTestId('evidence-timeline');
  await expect(timeline).toBeVisible();
  await expect(timeline).toContainText('CURRENT EVIDENCE');
  await expect(timeline).toContainText('HISTORICAL / UNKNOWN EVIDENCE');
  await expect(timeline).toContainText('Field check awaiting verification');
  await expect(timeline).toContainText('CHANGE: UNKNOWN');
  await expect(page.locator('img[src="https://example.com/private.jpg"]')).toHaveCount(0);
  await expect(page.locator('img[src="https://example.com/public.jpg"]')).toHaveCount(1);
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
});
