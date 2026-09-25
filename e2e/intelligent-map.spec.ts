import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

test.describe('Intelligent Map — bounded field attention mode', () => {
  test('shows deterministic attention controls and selected reasons without provider fanout', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
    const externalRequests: string[] = [];
    const errors: string[] = [];
    page.on('request', (request) => {
      if (!request.url().includes('localhost')) externalRequests.push(request.url());
    });
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await mockBase44(page, {
      user: null,
      locations: {
        'attention-map': {
          id: 'attention-map',
          title: 'Attention map location',
          type: 'billboard',
          address: '1 Field Way',
          lat: 13.7563,
          lng: 100.5018,
          status: 'pending',
          created_date: '2020-01-01T00:00:00.000Z',
        },
      },
      fieldChecks: {},
    });
    await page.goto('/map');
    await page.getByRole('button', { name: 'Flat map' }).dispatchEvent('click');
    const toggle = page.getByTestId('field-attention-toggle');
    await expect(toggle).toBeVisible({ timeout: 10_000 });
    await toggle.dispatchEvent('click');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('attention-filters')).toBeVisible();
    await expect(page.getByRole('button', { name: 'PENDING' })).toBeVisible();
    await page.getByRole('button', { name: 'NEEDS ATTENTION' }).dispatchEvent('click');
    await expect(page.getByTestId('attention-filters')).toContainText('NEEDS ATTENTION');
    expect(
      externalRequests.filter((url) =>
        /weather|biodiversity|heritage|openfoodfacts|routing/i.test(url),
      ),
    ).toEqual([]);
    expect(filterCrashes(errors), errors.join('\n')).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    ).toBe(false);
  });

  test('keeps the mission handoff actionable from a selected attention location', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('ooh-map-attention-mode', 'true');
      localStorage.setItem('ooh-map-view', 'flat');
    });
    await mockBase44(page, {
      user: null,
      locations: {
        'attention-handoff': {
          id: 'attention-handoff',
          title: 'Handoff location',
          type: 'billboard',
          address: '2 Field Way',
          lat: 13.7563,
          lng: 100.5018,
          status: 'pending',
          created_date: '2020-01-01T00:00:00.000Z',
        },
      },
      fieldChecks: {},
    });
    await page.goto('/map?highlight=attention-handoff');
    await expect(page.getByTestId('map-attention-card')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Add to mission' }).dispatchEvent('click');
    await expect(page.getByRole('link', { name: 'Open mission' })).toHaveAttribute(
      'href',
      '/portal/ops?section=geo',
    );
  });
});
