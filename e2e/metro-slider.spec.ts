import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

const fixtureImage =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="90"%3E%3Crect width="160" height="90" fill="%2300ff88"/%3E%3C/svg%3E';

const locations = {
  'field-log-1': {
    id: 'field-log-1',
    title: 'North wall signal',
    type: 'billboard',
    address: 'Synthetic Avenue',
    image_url: fixtureImage,
    created_date: '2026-09-01T10:00:00.000Z',
  },
  'field-log-2': {
    id: 'field-log-2',
    title: 'East station panel',
    type: 'poster',
    address: 'Synthetic Station',
    image_url: fixtureImage,
    created_date: '2026-08-31T10:00:00.000Z',
  },
  'unlinked-feed-record': {
    title: 'Unlinked field note',
    type: 'poster',
    image_url: fixtureImage,
    created_date: '2026-08-30T10:00:00.000Z',
  },
};

test.describe('Latest Field Log slider', () => {
  test.beforeEach(async ({ page }) => {
    await mockBase44(page, { locations });
    await page.goto('/');
    await expect(page.getByText('// Latest field log')).toBeVisible();
  });

  test('uses a consistent non-stretching media viewport and Location card links', async ({
    page,
  }) => {
    const card = page.getByTestId('field-log-card').first();
    const image = card.getByTestId('field-log-image');
    const locationLink = card.getByTestId('field-log-location-link');
    const mapLink = card.getByTestId('field-log-map-link');

    await expect(image).toBeVisible();
    await expect(locationLink).toHaveAttribute('href', '/location/field-log-1');
    await expect(mapLink).toHaveAttribute('href', '/map?highlight=field-log-1');

    const media = await image.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return { objectFit: style.objectFit, width: rect.width, height: rect.height };
    });
    expect(media.objectFit).toBe('cover');
    expect(media.width).toBeGreaterThan(0);
    expect(media.height).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );

    await locationLink.evaluate((element) => (element as HTMLAnchorElement).click());
    await expect(page).toHaveURL(/\/location\/field-log-1$/);
  });

  test('keeps the explicit map action separate from Location navigation', async ({ page }) => {
    const card = page.getByTestId('field-log-card').first();
    await expect(card.getByTestId('field-log-location-link')).toHaveAttribute(
      'href',
      '/location/field-log-1',
    );
    await expect(card.getByTestId('field-log-map-link')).toHaveAttribute(
      'href',
      '/map?highlight=field-log-1',
    );

    const unlinked = page
      .getByTestId('field-log-card')
      .filter({ hasText: 'Unlinked field note' })
      .first();
    await expect(unlinked.getByTestId('field-log-location-link')).toHaveCount(0);
    await expect(unlinked.getByTestId('field-log-map-link')).toHaveCount(0);
  });
});
