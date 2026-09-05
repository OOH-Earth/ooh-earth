import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

const location = {
  id: 'context-demo-location',
  title: 'Context demonstration Location',
  type: 'billboard',
  address: 'Synthetic Avenue',
  lat: 51.5,
  lng: -0.12,
  image_url: '',
  status: 'verified',
  notes: 'private field notes must not appear in context evidence',
};

test.describe('Location context evidence foundation', () => {
  test('renders attributable evidence and the derived distance', async ({ page }) => {
    await mockBase44(page, { user: null, locations: { [location.id]: location } });
    await page.goto(`/location/${location.id}`);

    const panel = page.getByTestId('location-context-evidence');
    await expect(panel).toBeVisible();
    await expect(panel.getByText('Context fixture')).toBeVisible();
    await expect(panel.getByText('OBSERVED', { exact: true })).toBeVisible();
    await expect(panel.getByText('DERIVED', { exact: true })).toBeVisible();
    await expect(panel.locator('dd').filter({ hasText: '0 m' }).first()).toBeVisible();
    await expect(panel.getByText('© OOH Earth', { exact: true }).first()).toBeVisible();
    await expect(panel).not.toContainText('private field notes');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

  test('shows an intentional unavailable state without external requests', async ({ page }) => {
    await mockBase44(page, {
      user: null,
      locations: {
        'unconnected-location': { ...location, id: 'unconnected-location' },
      },
    });
    await page.goto('/location/unconnected-location');

    const panel = page.getByTestId('location-context-evidence');
    await expect(panel.getByTestId('context-evidence-unavailable')).toBeVisible();
    await expect(panel).toContainText('No source-backed context is available');
  });
});
