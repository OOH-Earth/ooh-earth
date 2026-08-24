import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// Small, high-value regression coverage for paths not exercised by the
// existing suite: primary navigation, the donation/support page (real donor
// funds — see SECURITY.md), and the auth boundary on a protected route.
// Deliberately kept to 3 tests, not a sweep — see ENGINEERING_SUMMARY.md's
// testing-gap note for what's still not covered (login form submission,
// Map's own search/filter interactions, backend function unit tests).

function trackConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

test('primary navigation: home -> map -> report all render without crashing', async ({ page }) => {
  const consoleErrors = trackConsoleErrors(page);
  const mapProjectionRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (
      url.pathname.includes('/entities/FieldCheck') ||
      url.pathname.includes('/entities/LeadClaim')
    ) {
      mapProjectionRequests.push(url.searchParams.get('fields') || '');
    }
  });
  await mockBase44(page, { user: null, locations: {}, locationPhotos: [] });

  await page.goto('/');
  await expect(page).toHaveTitle(/OOH/i);

  const projectedMapRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      url.pathname.includes('/entities/FieldCheck') &&
      url.searchParams.get('fields') === 'location_id,status,created_date'
    );
  });
  await page.getByRole('link', { name: 'Field map', exact: true }).click();
  await expect(page).toHaveURL(/\/map/);
  await expect(page.locator('#root')).not.toBeEmpty();
  await projectedMapRequest;

  await page.goto('/report');
  await expect(page.getByRole('heading', { name: /Adbusting/i })).toBeVisible();

  expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  expect(mapProjectionRequests).toContain('location_id,status,created_date');
});

test('donation/support page renders the Stripe donate panel', async ({ page }) => {
  // Support.jsx no longer embeds Donorbox in an iframe — replaced with a
  // direct Stripe checkout panel (StripeDonate.jsx, confirmed by reading the
  // current file, not assumed from the old test).
  const consoleErrors = trackConsoleErrors(page);
  await page.goto('/support');

  await expect(page.getByRole('heading', { name: 'Card / fiat' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Donate now' })).toBeVisible();

  expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
});

test('auth boundary: an unauthenticated visitor hitting /dashboard is redirected to /login, not shown the queue', async ({
  page,
}) => {
  const consoleErrors = trackConsoleErrors(page);
  // No ?access_token= — appParams.token stays empty, so AuthContext never
  // calls auth.me() and isAuthenticated stays false (see AuthContext.jsx).
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText(/Log in/i).first()).toBeVisible();

  expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
});
