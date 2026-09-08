import { test, expect } from '@playwright/test';
import { mockBase44, ADMIN_USER, type MockDb } from './fixtures/mockBase44';

test('builds a bounded field mission from attention evidence and keeps the work actions connected', async ({
  page,
}) => {
  const old = '2020-01-01T00:00:00.000Z';
  const db: MockDb = {
    user: ADMIN_USER,
    locations: {
      'mission-a': {
        id: 'mission-a',
        title: 'North wall',
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
        status_updated_at: old,
        created_date: old,
      },
      'mission-b': {
        id: 'mission-b',
        title: 'South wall',
        lat: 13.71,
        lng: 100.51,
        status: 'pending',
        status_updated_at: old,
        created_date: old,
      },
    },
    fieldChecks: {},
  };
  await mockBase44(page, db);
  await page.goto('/portal/ops?access_token=mock-admin-token');
  await page.getByRole('button', { name: 'Geospatial Intelligence' }).click();

  const mission = page.getByTestId('field-mission');
  await expect(mission).toContainText('temporary session');
  await mission.getByLabel('mission-a').check();
  await mission.getByLabel('mission-b').check();
  await mission.getByRole('button', { name: /Create mission \(2\/20\)/ }).click();

  await expect(mission).toContainText('Mission 2 locations');
  await expect(mission).toContainText('verification pending');
  await expect(mission).toContainText('DISTANCE UNKNOWN');
  await expect(mission.getByRole('link', { name: /View on map/i })).toHaveAttribute(
    'href',
    /\/map\?mission=/,
  );
  await mission
    .getByRole('combobox', { name: 'Mission status for mission-a' })
    .selectOption('OPENED');
  await expect(mission.getByRole('combobox', { name: 'Mission status for mission-a' })).toHaveValue(
    'OPENED',
  );

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
