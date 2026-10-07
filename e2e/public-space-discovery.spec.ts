import { test, expect } from '@playwright/test';
import { mockBase44, type MockDb } from './fixtures/mockBase44';

// Public Space / Street Sports Intelligence v1 — map/category discovery.
// Mission test 9: category directory (and, by the same categories.js data,
// the map filter bar) can discover facility types. Mission test 10:
// existing OOH category directories are unaffected.

test('the skatepark category directory lists live skatepark locations', async ({ page }) => {
  const db: MockDb = {
    user: null,
    locations: {
      'sk-1': {
        id: 'sk-1',
        title: 'Riverside Skatepark',
        type: 'skatepark',
        address: 'Riverside, Bangkok',
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
      },
      'bill-1': {
        id: 'bill-1',
        title: 'Unrelated Billboard',
        type: 'billboard',
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
      },
    },
  };
  await mockBase44(page, db);
  await page.goto('/category/skatepark');
  await expect(page.getByRole('heading', { name: 'Skateparks', level: 1 })).toBeVisible();
  await expect(page.getByText('Riverside Skatepark')).toBeVisible();
  await expect(page.getByText('Unrelated Billboard')).toHaveCount(0);
});

test('the basketball court category directory lists live basketball court locations', async ({
  page,
}) => {
  const db: MockDb = {
    user: null,
    locations: {
      'bb-1': {
        id: 'bb-1',
        title: 'Sukhumvit Courts',
        type: 'basketball_court',
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
      },
    },
  };
  await mockBase44(page, db);
  await page.goto('/category/basketball-court');
  await expect(page.getByRole('heading', { name: 'Basketball Courts', level: 1 })).toBeVisible();
  await expect(page.getByText('Sukhumvit Courts')).toBeVisible();
});

// Mission test 10: an existing OOH category directory is unaffected by the
// new facility types being added to the same shared taxonomy.
test('the billboard category directory is unaffected', async ({ page }) => {
  const db: MockDb = {
    user: null,
    locations: {
      'bill-2': {
        id: 'bill-2',
        title: 'Downtown Billboard',
        type: 'billboard',
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
      },
      'sk-2': {
        id: 'sk-2',
        title: 'Unrelated Skatepark',
        type: 'skatepark',
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
      },
    },
  };
  await mockBase44(page, db);
  await page.goto('/category/billboard');
  await expect(page.getByRole('heading', { name: 'Billboards', level: 1 })).toBeVisible();
  await expect(page.getByText('Downtown Billboard')).toBeVisible();
  await expect(page.getByText('Unrelated Skatepark')).toHaveCount(0);
});
