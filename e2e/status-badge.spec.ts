import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// LocationDetail.jsx previously rendered a "rejected" location's status
// badge with the exact same neutral border-slate2/text-darkgray classes as
// a "verified" one -- distinguished only by a small BadgeCheck icon on
// verified. A moderator scanning the page could easily mistake a rejected
// report for a verified one. Now both LocationDetail and Dashboard.jsx
// share one status->classes source (src/lib/statusBadge.js), and rejected
// gets its own distinct (flare/red-orange) styling, matching the color
// already used for "pending" review states elsewhere in the app's
// vocabulary for "needs attention."

function trackConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

test.describe('LocationDetail — status badge is visually distinct per state', () => {
  test('rejected and verified locations render different badge classes', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-status-verified': {
          id: 'loc-status-verified',
          title: 'Billboard · Verified Status Check',
          type: 'billboard',
          address: '10 Test St, Testville',
          lat: 13.75,
          lng: 100.5,
          image_url: '',
          status: 'verified',
          status_updated_at: new Date().toISOString(),
          access_key: 'none',
        },
        'loc-status-rejected': {
          id: 'loc-status-rejected',
          title: 'Billboard · Rejected Status Check',
          type: 'billboard',
          address: '11 Test St, Testville',
          lat: 13.76,
          lng: 100.51,
          image_url: '',
          status: 'rejected',
          status_updated_at: new Date().toISOString(),
          access_key: 'none',
        },
      },
      locationPhotos: [],
    });

    await page.goto('/location/loc-status-verified');
    const verifiedBadge = page.getByText('verified', { exact: true }).first();
    await expect(verifiedBadge).toBeVisible();
    const verifiedClass = await verifiedBadge.getAttribute('class');

    await page.goto('/location/loc-status-rejected');
    const rejectedBadge = page.getByText('rejected', { exact: true }).first();
    await expect(rejectedBadge).toBeVisible();
    const rejectedClass = await rejectedBadge.getAttribute('class');

    expect(rejectedClass).not.toEqual(verifiedClass);
    expect(rejectedClass).toContain('flare');
    expect(verifiedClass).not.toContain('flare');

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });
});
